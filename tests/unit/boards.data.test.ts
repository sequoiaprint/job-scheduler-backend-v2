import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GROVE_JOB_SOURCES } from "../../src/features/grove-sync/data/grove.data.js";
import { BOARD_MACHINES, JOB_TYPES } from "../../src/features/jobs/data/boards.data.js";

describe("board configuration", () => {
  it("defines machines and a Grove source for every job type", () => {
    for (const jobType of JOB_TYPES) {
      assert.ok(BOARD_MACHINES[jobType].length > 0, `${jobType} has no machines`);
      assert.ok(GROVE_JOB_SOURCES[jobType], `${jobType} has no Grove source`);
    }
  });

  it("uses unique, normalised machine keys on each board", () => {
    for (const jobType of JOB_TYPES) {
      const keys = BOARD_MACHINES[jobType].map((machine) => machine.key);
      assert.equal(new Set(keys).size, keys.length, `${jobType} has duplicate machine keys`);
      for (const key of keys) {
        assert.match(key, /^[A-Z0-9]+$/, `machine key ${key} must be upper-case with no spaces`);
      }
    }
  });
});
