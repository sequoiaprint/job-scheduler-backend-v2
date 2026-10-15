import { grovePool } from "../../../config/grove-db.config.js";
import type { JobType } from "../../jobs/types/jobs.types.js";
import { CLOSED_JOB_STATUSES, GROVE_JOB_SOURCES } from "../data/grove.data.js";
import type { GroveJobCard } from "../types/grove-sync.types.js";

// REPOSITORY: read-only queries against Grove. Table and column names come from grove.data.ts,
// never from a request; status values are bound as parameters.

interface GroveJobCardRow {
  id: string;
  job_number: string;
  job_name: string | null;
  remarks: string | null;
  created_at: Date;
}

// Cards that are still open: they have a job number, are not marked completed and their
// status is not one of the closed statuses.
export const findOpenJobCards = async (jobType: JobType): Promise<GroveJobCard[]> => {
  const { table, jobNumberColumn } = GROVE_JOB_SOURCES[jobType];
  const statusPlaceholders = CLOSED_JOB_STATUSES.map(() => "?").join(", ");

  const rows: GroveJobCardRow[] = await grovePool.query(
    `SELECT id, \`${jobNumberColumn}\` AS job_number, job_name, remarks, created_at
       FROM \`${table}\`
      WHERE \`${jobNumberColumn}\` IS NOT NULL
        AND TRIM(\`${jobNumberColumn}\`) <> ''
        AND (job_completed IS NULL OR job_completed = 0)
        AND (job_status IS NULL OR UPPER(TRIM(job_status)) NOT IN (${statusPlaceholders}))`,
    [...CLOSED_JOB_STATUSES],
  );

  // Grove names sometimes carry stray leading tabs/spaces.
  return rows.map((row) => ({
    groveId: row.id,
    jobNumber: row.job_number.trim(),
    jobName: (row.job_name ?? "").trim(),
    remarks: row.remarks?.trim() || null,
    createdAt: row.created_at,
  }));
};
