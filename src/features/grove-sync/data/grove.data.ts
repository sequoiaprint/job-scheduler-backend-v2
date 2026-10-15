import type { JobType } from "../../jobs/types/jobs.types.js";

// DATA: where each Atlas board reads its job cards from in Grove.
export const GROVE_JOB_SOURCES: Record<JobType, { table: string; jobNumberColumn: string }> = {
  artwork: { table: "artworkjobcard", jobNumberColumn: "job_number" },
  proofing: { table: "proofing_job_card", jobNumberColumn: "job_no" },
};

// Grove job_status values that mean a card is finished, so it no longer belongs on a board.
// Spellings follow Grove's job_status master (e.g. CANCLED); the usual spellings are included
// in case they appear later. Cards with no status or WIP are treated as open.
export const CLOSED_JOB_STATUSES = [
  "DONE",
  "BILLED",
  "TRANSFERED",
  "TRANSFERRED",
  "CANCLED",
  "CANCELLED",
  "COMPLETED",
] as const;

// Socket.IO event emitted after a sync changed a board.
export const GROVE_SYNCED_EVENT = "grove:synced";

export const SYNC_MESSAGES = {
  completed: "Grove sync completed",
  status: "Grove sync status",
  disabled: "Grove sync is disabled (GROVE_SYNC_ENABLED=false)",
} as const;
