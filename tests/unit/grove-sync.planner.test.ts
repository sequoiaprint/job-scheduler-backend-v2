import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickOnePerJobNumber, planSync } from "../../src/features/grove-sync/services/grove-sync.planner.js";
import type { GroveJobCard, SyncedJobSnapshot } from "../../src/features/grove-sync/types/grove-sync.types.js";

const card = (jobNumber: string, jobName = `Job ${jobNumber}`, createdAt = "2026-08-01", remarks: string | null = null): GroveJobCard => ({
  groveId: `${jobNumber}-${createdAt}`,
  jobNumber,
  jobName,
  remarks,
  createdAt: new Date(createdAt),
});

const job = (jobNumber: string, overrides: Partial<SyncedJobSnapshot> = {}): SyncedJobSnapshot => ({
  job_number: jobNumber,
  job_name: `Job ${jobNumber}`,
  remarks: null,
  machine_name: null,
  is_completed: false,
  ...overrides,
});

describe("pickOnePerJobNumber", () => {
  it("keeps unique cards untouched", () => {
    const { cards, duplicateJobNumbers } = pickOnePerJobNumber([card("A"), card("B")]);
    assert.deepEqual(cards.map((c) => c.jobNumber), ["A", "B"]);
    assert.deepEqual(duplicateJobNumbers, []);
  });

  it("keeps the newest card when a job number is reused, and reports it", () => {
    const { cards, duplicateJobNumbers } = pickOnePerJobNumber([
      card("A", "old", "2026-07-01"),
      card("B"),
      card("A", "new", "2026-08-10"),
      card("A", "middle", "2026-07-20"),
    ]);
    assert.deepEqual(cards.map((c) => [c.jobNumber, c.jobName]), [["A", "new"], ["B", "Job B"]]);
    assert.deepEqual(duplicateJobNumbers, ["A"]);
  });
});

describe("planSync", () => {
  it("creates jobs that are open in Grove but missing in Atlas", () => {
    const plan = planSync([card("A"), card("B")], [job("A")]);
    assert.deepEqual(plan.create.map((c) => c.jobNumber), ["B"]);
    assert.deepEqual(plan.update, []);
    assert.deepEqual(plan.remove, []);
  });

  it("updates jobs whose name or remarks changed in Grove", () => {
    const plan = planSync(
      [card("A", "Renamed"), card("B", "Job B", "2026-08-01", "rush"), card("C")],
      [job("A"), job("B"), job("C")],
    );
    assert.deepEqual(plan.update.map((c) => c.jobNumber), ["A", "B"]);
  });

  it("never touches machine, run order or completion when updating", () => {
    const plan = planSync([card("A")], [job("A", { machine_name: "KOMORI", is_completed: true })]);
    assert.deepEqual(plan, { create: [], update: [], remove: [] });
  });

  it("removes jobs that left Grove only while they are still unscheduled", () => {
    const plan = planSync(
      [],
      [
        job("UNSCHEDULED"),
        job("ON_MACHINE", { machine_name: "RYOBI3" }),
        job("COMPLETED", { machine_name: "RYOBI3", is_completed: true }),
      ],
    );
    assert.deepEqual(plan.remove, ["UNSCHEDULED"]);
  });

  it("treats null and missing remarks the same", () => {
    const plan = planSync([card("A")], [job("A", { remarks: null })]);
    assert.deepEqual(plan.update, []);
  });
});
