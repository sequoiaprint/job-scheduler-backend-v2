import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RUN_ORDER_STEP } from "../../src/features/jobs/data/boards.data.js";
import { rebalancedOrder, runOrderBetween } from "../../src/features/jobs/services/run-order.service.js";

describe("runOrderBetween", () => {
  it("gives the first job on an empty machine one step", () => {
    assert.equal(runOrderBetween(null, null), RUN_ORDER_STEP);
  });

  it("puts a job dropped at the bottom one step after the last job", () => {
    assert.equal(runOrderBetween(3_000_000, null), 4_000_000);
  });

  it("puts a job dropped at the top halfway to zero", () => {
    assert.equal(runOrderBetween(null, 1_000_000), 500_000);
  });

  it("uses the midpoint between two neighbours", () => {
    assert.equal(runOrderBetween(1_000_000, 2_000_000), 1_500_000);
    assert.equal(runOrderBetween(1_000_000, 1_000_003), 1_000_001);
  });

  it("asks for a rebalance when there is no integer gap left", () => {
    assert.equal(runOrderBetween(1_000_000, 1_000_001), null);
    assert.equal(runOrderBetween(5, 5), null);
    assert.equal(runOrderBetween(null, 1), null);
  });

  it("asks for a rebalance when the neighbours arrive out of order", () => {
    assert.equal(runOrderBetween(2_000_000, 1_000_000), null);
  });
});

describe("rebalancedOrder", () => {
  const machine = [
    { id: "a", runOrder: 1 },
    { id: "b", runOrder: 2 },
    { id: "c", runOrder: 3 },
  ];

  it("inserts after the previous neighbour and renumbers evenly", () => {
    assert.deepEqual(rebalancedOrder(machine, "x", 1), [
      { id: "a", runOrder: RUN_ORDER_STEP },
      { id: "x", runOrder: 2 * RUN_ORDER_STEP },
      { id: "b", runOrder: 3 * RUN_ORDER_STEP },
      { id: "c", runOrder: 4 * RUN_ORDER_STEP },
    ]);
  });

  it("inserts at the top when there is no previous neighbour", () => {
    assert.deepEqual(
      rebalancedOrder(machine, "x", null).map((job) => job.id),
      ["x", "a", "b", "c"],
    );
  });

  it("inserts at the bottom when the previous neighbour is the last job", () => {
    assert.deepEqual(
      rebalancedOrder(machine, "x", 3).map((job) => job.id),
      ["a", "b", "c", "x"],
    );
  });

  it("moves a job that is already on the machine without duplicating it", () => {
    const result = rebalancedOrder(machine, "a", 2);
    assert.deepEqual(result.map((job) => job.id), ["b", "a", "c"]);
    assert.deepEqual(result.map((job) => job.runOrder), [1, 2, 3].map((n) => n * RUN_ORDER_STEP));
  });
});
