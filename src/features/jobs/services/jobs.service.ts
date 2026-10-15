import { AppError } from "../../../utils/app-error.utils.js";
import { BOARD_MACHINES, JOB_MESSAGES } from "../data/boards.data.js";
import {
  findActiveJobsOnMachine,
  findCompletedJobs,
  findJobById,
  findScheduledJobs,
  findUnscheduledJobs,
  setRunOrders,
  updateJob,
} from "../repositories/jobs.repository.js";
import type {
  Board,
  CompletedBoard,
  Job,
  JobRecord,
  JobType,
  Machine,
  MoveJobInput,
  MoveResult,
} from "../types/jobs.types.js";
import { rebalancedOrder, runOrderBetween } from "./run-order.service.js";

// SERVICE: scheduling rules for both boards. Every function is scoped to one job type, so the
// artwork and proofing boards never see or change each other's jobs.

export const toJob = (record: JobRecord): Job => ({
  id: record.job_id,
  jobNumber: record.job_number,
  jobName: record.job_name,
  remarks: record.remarks,
  machine: record.machine_name,
  runOrder: record.run_order,
  isUpdated: record.is_updated ?? false,
  isCompleted: record.is_completed ?? false,
  createdAt: record.created_at.toISOString(),
  updatedAt: record.updated_at.toISOString(),
});

// One (possibly empty) list per machine column, in the order the records arrive.
const groupByMachine = (machines: readonly Machine[], records: JobRecord[]): Record<string, Job[]> => {
  const groups: Record<string, Job[]> = Object.fromEntries(machines.map((machine) => [machine.key, []]));
  for (const record of records) {
    if (record.machine_name && groups[record.machine_name]) {
      groups[record.machine_name].push(toJob(record));
    }
  }
  return groups;
};

// Accepts a machine key or its display name ("Ryobi 3" -> RYOBI3) and returns the stored key.
const resolveMachineKey = (jobType: JobType, machine: string): string => {
  const wanted = machine.replace(/\s+/g, "").toUpperCase();
  const match = BOARD_MACHINES[jobType].find((candidate) => candidate.key === wanted);
  if (!match) {
    throw new AppError(`Unknown machine "${machine}" on the ${jobType} board`, 400);
  }
  return match.key;
};

const findJobOrThrow = async (jobType: JobType, jobId: string): Promise<JobRecord> => {
  const job = await findJobById(jobType, jobId);
  if (!job) {
    throw new AppError(JOB_MESSAGES.notFound, 404);
  }
  return job;
};

export const getBoard = async (jobType: JobType): Promise<Board> => {
  const machines = BOARD_MACHINES[jobType];
  const [unscheduled, scheduled] = await Promise.all([findUnscheduledJobs(jobType), findScheduledJobs(jobType)]);
  return {
    jobType,
    machines,
    unscheduled: unscheduled.map(toJob),
    scheduled: groupByMachine(machines, scheduled),
  };
};

export const getCompletedBoard = async (jobType: JobType): Promise<CompletedBoard> => {
  const machines = BOARD_MACHINES[jobType];
  return {
    jobType,
    machines,
    completed: groupByMachine(machines, await findCompletedJobs(jobType)),
  };
};

// Places a job on a machine between two neighbours. This is the only place machine_name is set.
export const moveJob = async (jobType: JobType, jobId: string, input: MoveJobInput): Promise<MoveResult> => {
  const machine = resolveMachineKey(jobType, input.machine);
  const job = await findJobOrThrow(jobType, jobId);
  if (job.is_completed) {
    throw new AppError(JOB_MESSAGES.completedLocked, 409);
  }

  const runOrder = runOrderBetween(input.prevRunOrder, input.nextRunOrder);
  if (runOrder !== null) {
    const updated = await updateJob(jobType, jobId, { machine_name: machine, run_order: runOrder });
    return { job: toJob(updated), rebalanced: false };
  }

  // No integer gap left between the neighbours: renumber the machine with the job in place.
  const onMachine = await findActiveJobsOnMachine(jobType, machine);
  const order = rebalancedOrder(
    onMachine.map((record) => ({ id: record.job_id, runOrder: record.run_order })),
    jobId,
    input.prevRunOrder,
  );
  await setRunOrders(jobType, machine, order);
  return { job: toJob(await findJobOrThrow(jobType, jobId)), rebalanced: true };
};

export const completeJob = async (jobType: JobType, jobId: string): Promise<Job> => {
  const job = await findJobOrThrow(jobType, jobId);
  if (job.is_completed) {
    throw new AppError(JOB_MESSAGES.alreadyCompleted, 409);
  }
  if (!job.machine_name) {
    throw new AppError(JOB_MESSAGES.completeNeedsMachine, 409);
  }
  return toJob(await updateJob(jobType, jobId, { is_completed: true }));
};

// Sends a job back to the unscheduled list (clears its machine and position).
export const unscheduleJob = async (jobType: JobType, jobId: string): Promise<Job> => {
  const job = await findJobOrThrow(jobType, jobId);
  if (job.is_completed) {
    throw new AppError(JOB_MESSAGES.completedLocked, 409);
  }
  return toJob(await updateJob(jobType, jobId, { machine_name: null, run_order: null }));
};
