import { z } from "zod";
import { JOB_TYPES } from "../data/boards.data.js";

// TYPES: the job shapes (as stored and as returned by the API) and the request schemas.

export type JobType = (typeof JOB_TYPES)[number];

export interface Machine {
  key: string;
  name: string;
}

// A row of artwork_jobs or proofing_jobs (both tables share this layout).
export interface JobRecord {
  job_id: string;
  job_number: string;
  job_name: string;
  remarks: string | null;
  machine_name: string | null;
  is_updated: boolean | null;
  created_at: Date;
  updated_at: Date;
  run_order: number | null;
  is_completed: boolean | null;
}

// A job as the API returns it.
export interface Job {
  id: string;
  jobNumber: string;
  jobName: string;
  remarks: string | null;
  machine: string | null;
  runOrder: number | null;
  isUpdated: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  jobType: JobType;
  machines: readonly Machine[];
  unscheduled: Job[];
  // Active jobs per machine key, in run order.
  scheduled: Record<string, Job[]>;
}

export interface CompletedBoard {
  jobType: JobType;
  machines: readonly Machine[];
  completed: Record<string, Job[]>;
}

export interface MoveResult {
  job: Job;
  // True when the machine had to be renumbered; the client should refetch that machine.
  rebalanced: boolean;
}

export const JobTypeParamsSchema = z.object({
  jobType: z.enum(JOB_TYPES),
});

export const JobParamsSchema = JobTypeParamsSchema.extend({
  jobId: z.uuid(),
});

// prev/next are the run_orders of the jobs directly above and below the drop gap
// (null at the top or bottom of the column).
export const MoveJobSchema = z.object({
  machine: z.string().trim().min(1),
  prevRunOrder: z.number().nullable(),
  nextRunOrder: z.number().nullable(),
});

export type MoveJobInput = z.infer<typeof MoveJobSchema>;
