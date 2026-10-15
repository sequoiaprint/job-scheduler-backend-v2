import type { JobType, Machine } from "../types/jobs.types.js";

// DATA: the two job boards (one per Grove job-card type) and the machine columns each board
// schedules onto. A machine's key is what gets stored in machine_name; its name is the label.

export const JOB_TYPES = ["artwork", "proofing"] as const;

const PRESS_MACHINES: readonly Machine[] = [
  { key: "RYOBI3", name: "Ryobi 3" },
  { key: "RYOBI2", name: "Ryobi 2" },
  { key: "KOMORI", name: "Komori" },
  { key: "FLATBED1", name: "Flatbed 1" },
  { key: "FLATBED2", name: "Flatbed 2" },
];

export const BOARD_MACHINES: Record<JobType, readonly Machine[]> = {
  // Placeholder until the artwork columns are decided: same list as proofing for now.
  artwork: PRESS_MACHINES,
  proofing: PRESS_MACHINES,
};

// Gap between neighbouring run_order values on a machine (see run-order.service.ts).
export const RUN_ORDER_STEP = 1_000_000;

export const JOB_MESSAGES = {
  boardFetched: "Board fetched",
  completedFetched: "Completed jobs fetched",
  moved: "Job position updated",
  completed: "Job marked as completed",
  unscheduled: "Job moved back to unscheduled",
  notFound: "Job not found",
  completedLocked: "Completed jobs can't be moved",
  alreadyCompleted: "Job is already completed",
  completeNeedsMachine: "Place the job on a machine before completing it",
} as const;
