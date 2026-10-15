import { env } from "../../../config/env.config.js";
import { emitSocketEvent } from "../../../config/socket.config.js";
import { AppError } from "../../../utils/app-error.utils.js";
import { logger } from "../../../utils/logger.utils.js";
import { JOB_TYPES } from "../../jobs/data/boards.data.js";
import { applySyncChanges, findJobsForSync } from "../../jobs/repositories/jobs.repository.js";
import type { JobType } from "../../jobs/types/jobs.types.js";
import { GROVE_SYNCED_EVENT, SYNC_MESSAGES } from "../data/grove.data.js";
import { findOpenJobCards } from "../repositories/grove.repository.js";
import type {
  GroveJobCard,
  GroveSyncedEvent,
  SyncResult,
  SyncRun,
  SyncStatus,
  SyncTrigger,
} from "../types/grove-sync.types.js";
import { pickOnePerJobNumber, planSync } from "./grove-sync.planner.js";

// SERVICE: pulls open job cards from Grove into artwork_jobs / proofing_jobs.
// This replaces the old Google Sheet sync + webhook.

let currentRun: Promise<SyncRun> | null = null;
let lastRun: SyncRun | null = null;
let lastError: SyncStatus["lastError"] = null;
// Last duplicate list logged per board, so the same warning isn't repeated every minute.
const reportedDuplicates = new Map<JobType, string>();

const toSyncedFields = (card: GroveJobCard) => ({
  jobNumber: card.jobNumber,
  jobName: card.jobName,
  remarks: card.remarks,
});

const syncJobType = async (jobType: JobType): Promise<SyncResult> => {
  const { cards, duplicateJobNumbers } = pickOnePerJobNumber(await findOpenJobCards(jobType));
  const plan = planSync(cards, await findJobsForSync(jobType));

  const counts = await applySyncChanges(jobType, {
    create: plan.create.map(toSyncedFields),
    update: plan.update.map(toSyncedFields),
    remove: plan.remove,
  });

  const duplicatesKey = duplicateJobNumbers.join(", ");
  if (duplicatesKey && reportedDuplicates.get(jobType) !== duplicatesKey) {
    logger.warn(
      `Grove reuses ${duplicateJobNumbers.length} ${jobType} job number(s) on more than one open card; ` +
        `kept the newest card for each: ${duplicatesKey}`,
    );
  }
  reportedDuplicates.set(jobType, duplicatesKey);

  return {
    jobType,
    ...counts,
    changedJobNumbers: [...plan.create, ...plan.update].map((card) => card.jobNumber).concat(plan.remove),
    duplicateJobNumbers,
  };
};

const runSync = async (trigger: SyncTrigger): Promise<SyncRun> => {
  const startedAt = new Date().toISOString();
  try {
    const results: SyncResult[] = [];
    for (const jobType of JOB_TYPES) {
      results.push(await syncJobType(jobType));
    }

    const run: SyncRun = { trigger, startedAt, finishedAt: new Date().toISOString(), results };
    lastRun = run;
    lastError = null;

    for (const result of results) {
      if (result.created + result.updated + result.removed === 0) continue;
      logger.info(
        `Grove sync (${trigger}) ${result.jobType}: ${result.created} new, ` +
          `${result.updated} updated, ${result.removed} removed`,
      );
      const event: GroveSyncedEvent = {
        jobType: result.jobType,
        created: result.created,
        updated: result.updated,
        removed: result.removed,
        jobNumbers: result.changedJobNumbers,
        syncedAt: run.finishedAt,
      };
      emitSocketEvent(GROVE_SYNCED_EVENT, event);
    }
    return run;
  } catch (error) {
    lastError = { at: new Date().toISOString(), message: error instanceof Error ? error.message : String(error) };
    throw error;
  }
};

// Runs a sync. If one is already in flight, the caller shares its result instead of starting a second.
export const syncFromGrove = (trigger: SyncTrigger): Promise<SyncRun> => {
  if (!currentRun) {
    currentRun = runSync(trigger).finally(() => {
      currentRun = null;
    });
  }
  return currentRun;
};

// The "sync now" path used by the API (the Refresh button on the boards).
export const runManualSync = async (): Promise<SyncRun> => {
  if (!env.GROVE_SYNC_ENABLED) {
    throw new AppError(SYNC_MESSAGES.disabled, 503);
  }
  try {
    return await syncFromGrove("manual");
  } catch (error) {
    throw new AppError(`Grove sync failed: ${error instanceof Error ? error.message : String(error)}`, 502);
  }
};

export const getSyncStatus = (): SyncStatus => ({
  enabled: env.GROVE_SYNC_ENABLED,
  intervalMs: env.GROVE_SYNC_INTERVAL_MS,
  groveDatabase: env.GROVE_DATABASE_NAME,
  running: currentRun !== null,
  lastRun,
  lastError,
});
