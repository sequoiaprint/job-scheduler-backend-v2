import type { JobType } from "../../jobs/types/jobs.types.js";

// TYPES: shapes used while syncing Grove job cards into the Atlas job tables.

// One open job card read from Grove (artworkjobcard or proofing_job_card).
export interface GroveJobCard {
  groveId: string;
  jobNumber: string;
  jobName: string;
  remarks: string | null;
  createdAt: Date;
}

// The columns of an existing Atlas job that a sync compares against.
export interface SyncedJobSnapshot {
  job_number: string;
  job_name: string;
  remarks: string | null;
  machine_name: string | null;
  is_completed: boolean | null;
}

export interface SyncPlan {
  create: GroveJobCard[];
  update: GroveJobCard[];
  remove: string[]; // job numbers
}

export interface SyncResult {
  jobType: JobType;
  created: number;
  updated: number;
  removed: number;
  changedJobNumbers: string[];
  // Job numbers Grove uses on more than one open card (only the newest card is kept).
  duplicateJobNumbers: string[];
}

export type SyncTrigger = "startup" | "schedule" | "manual";

export interface SyncRun {
  trigger: SyncTrigger;
  startedAt: string;
  finishedAt: string;
  results: SyncResult[];
}

export interface SyncStatus {
  enabled: boolean;
  intervalMs: number;
  groveDatabase: string;
  running: boolean;
  lastRun: SyncRun | null;
  lastError: { at: string; message: string } | null;
}

// Payload of the GROVE_SYNCED_EVENT socket event (one per board that changed).
export interface GroveSyncedEvent {
  jobType: JobType;
  created: number;
  updated: number;
  removed: number;
  jobNumbers: string[];
  syncedAt: string;
}
