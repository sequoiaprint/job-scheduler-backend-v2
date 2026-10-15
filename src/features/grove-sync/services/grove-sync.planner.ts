import type { GroveJobCard, SyncedJobSnapshot, SyncPlan } from "../types/grove-sync.types.js";

// Pure sync decisions (no I/O), kept separate so they can be unit tested.

// Grove sometimes gives two different open cards the same job number. Atlas stores one job per
// number, so the most recently created card wins and the number is reported as a duplicate.
export const pickOnePerJobNumber = (
  cards: GroveJobCard[],
): { cards: GroveJobCard[]; duplicateJobNumbers: string[] } => {
  const chosen = new Map<string, GroveJobCard>();
  const duplicates = new Set<string>();

  for (const card of cards) {
    const current = chosen.get(card.jobNumber);
    if (!current) {
      chosen.set(card.jobNumber, card);
      continue;
    }
    duplicates.add(card.jobNumber);
    if (card.createdAt > current.createdAt) {
      chosen.set(card.jobNumber, card);
    }
  }

  return { cards: [...chosen.values()], duplicateJobNumbers: [...duplicates].sort() };
};

// What one sync run changes in an Atlas job table:
// - create: open in Grove but not in Atlas yet (arrives unscheduled, machine_name NULL)
// - update: name or remarks changed in Grove. Machine, run order and completion are never
//           touched; those belong to the operators.
// - remove: no longer open in Grove (closed or deleted) and still unscheduled in Atlas. Jobs
//           already placed on a machine or completed are left alone.
export const planSync = (openCards: GroveJobCard[], existing: SyncedJobSnapshot[]): SyncPlan => {
  const existingByNumber = new Map(existing.map((job) => [job.job_number, job]));
  const openNumbers = new Set(openCards.map((card) => card.jobNumber));

  const create: GroveJobCard[] = [];
  const update: GroveJobCard[] = [];

  for (const card of openCards) {
    const job = existingByNumber.get(card.jobNumber);
    if (!job) {
      create.push(card);
    } else if (job.job_name !== card.jobName || (job.remarks ?? null) !== card.remarks) {
      update.push(card);
    }
  }

  const remove = existing
    .filter((job) => !openNumbers.has(job.job_number) && job.machine_name === null && !job.is_completed)
    .map((job) => job.job_number);

  return { create, update, remove };
};
