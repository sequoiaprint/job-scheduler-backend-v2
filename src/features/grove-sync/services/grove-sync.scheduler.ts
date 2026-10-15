import { env } from "../../../config/env.config.js";
import { logger } from "../../../utils/logger.utils.js";
import type { SyncTrigger } from "../types/grove-sync.types.js";
import { syncFromGrove } from "./grove-sync.service.js";

// Runs the Grove sync once at startup and then every GROVE_SYNC_INTERVAL_MS.
let timer: NodeJS.Timeout | null = null;

const runSafely = async (trigger: SyncTrigger) => {
  try {
    await syncFromGrove(trigger);
  } catch (error) {
    logger.error(`Grove sync (${trigger}) failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const startGroveSyncScheduler = (): void => {
  if (!env.GROVE_SYNC_ENABLED) {
    logger.info("Grove sync is disabled (GROVE_SYNC_ENABLED=false)");
    return;
  }
  logger.info(`Grove sync every ${env.GROVE_SYNC_INTERVAL_MS / 1000}s from ${env.GROVE_DATABASE_NAME}`);
  void runSafely("startup");
  timer = setInterval(() => void runSafely("schedule"), env.GROVE_SYNC_INTERVAL_MS);
};

export const stopGroveSyncScheduler = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
