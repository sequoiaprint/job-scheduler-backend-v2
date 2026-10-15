import { prisma } from "../../../config/prisma.config.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type { JobRecord, JobType } from "../types/jobs.types.js";

// REPOSITORY: the only layer that talks to artwork_jobs and proofing_jobs.

// Both tables share one column layout, so the proofing delegate's type describes either one.
type JobTable = typeof prisma.proofingJob;
type Db = typeof prisma | Prisma.TransactionClient;

const tableOf = (db: Db, jobType: JobType): JobTable =>
  (jobType === "artwork" ? db.artworkJob : db.proofingJob) as unknown as JobTable;

const table = (jobType: JobType) => tableOf(prisma, jobType);

export const findUnscheduledJobs = (jobType: JobType): Promise<JobRecord[]> => {
  return table(jobType).findMany({
    where: { machine_name: null, is_completed: false },
    orderBy: [{ updated_at: "desc" }],
  });
};

export const findScheduledJobs = (jobType: JobType): Promise<JobRecord[]> => {
  return table(jobType).findMany({
    where: { machine_name: { not: null }, is_completed: false },
    orderBy: [{ run_order: "asc" }, { updated_at: "desc" }],
  });
};

export const findCompletedJobs = (jobType: JobType): Promise<JobRecord[]> => {
  return table(jobType).findMany({
    where: { machine_name: { not: null }, is_completed: true },
    orderBy: [{ updated_at: "asc" }],
  });
};

export const findJobById = (jobType: JobType, jobId: string): Promise<JobRecord | null> => {
  return table(jobType).findUnique({ where: { job_id: jobId } });
};

export const findActiveJobsOnMachine = (jobType: JobType, machine: string): Promise<JobRecord[]> => {
  return table(jobType).findMany({
    where: { machine_name: machine, is_completed: false },
    orderBy: [{ run_order: "asc" }, { updated_at: "desc" }],
  });
};

export const updateJob = (
  jobType: JobType,
  jobId: string,
  data: { machine_name?: string | null; run_order?: number | null; is_completed?: boolean },
): Promise<JobRecord> => {
  return table(jobType).update({ where: { job_id: jobId }, data });
};

// Writes a machine's new numbering (and the moved job's machine) in one transaction.
export const setRunOrders = async (
  jobType: JobType,
  machine: string,
  order: { id: string; runOrder: number }[],
): Promise<void> => {
  await prisma.$transaction(
    order.map(({ id, runOrder }) =>
      table(jobType).update({ where: { job_id: id }, data: { machine_name: machine, run_order: runOrder } }),
    ),
  );
};

// ---- Grove sync ----

export interface SyncedJobFields {
  jobNumber: string;
  jobName: string;
  remarks: string | null;
}

export const findJobsForSync = (jobType: JobType) => {
  return table(jobType).findMany({
    select: { job_number: true, job_name: true, remarks: true, machine_name: true, is_completed: true },
  });
};

// Applies one sync run atomically. Only name and remarks are ever updated, and only jobs that
// are still unscheduled and not completed can be removed (checked again inside the DELETE).
export const applySyncChanges = (
  jobType: JobType,
  changes: { create: SyncedJobFields[]; update: SyncedJobFields[]; remove: string[] },
) => {
  return prisma.$transaction(
    async (tx) => {
      const jobs = tableOf(tx, jobType);

      const created = changes.create.length
        ? (
            await jobs.createMany({
              data: changes.create.map((job) => ({
                job_number: job.jobNumber,
                job_name: job.jobName,
                remarks: job.remarks,
              })),
              skipDuplicates: true,
            })
          ).count
        : 0;

      for (const job of changes.update) {
        await jobs.update({
          where: { job_number: job.jobNumber },
          data: { job_name: job.jobName, remarks: job.remarks, is_updated: true },
        });
      }

      const removed = changes.remove.length
        ? (
            await jobs.deleteMany({
              where: { job_number: { in: changes.remove }, machine_name: null, is_completed: false },
            })
          ).count
        : 0;

      return { created, updated: changes.update.length, removed };
    },
    { maxWait: 10_000, timeout: 60_000 },
  );
};
