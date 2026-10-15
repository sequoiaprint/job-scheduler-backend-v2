import { RUN_ORDER_STEP } from "../data/boards.data.js";

// Gap-based ordering. Jobs on a machine are sorted by run_order. A dropped job takes the midpoint
// of its two neighbours' run_orders, so no other job has to change. When the neighbours are too
// close for an integer midpoint, the whole machine is renumbered instead (see rebalancedOrder).

// Returns the run_order for a job dropped between `prev` and `next` (null = column edge),
// or null when there is no room and the machine must be rebalanced.
export const runOrderBetween = (prev: number | null, next: number | null): number | null => {
  if (prev === null) {
    if (next === null) return RUN_ORDER_STEP; // empty column
    const top = Math.floor(next / 2);
    return top > 0 && top < next ? top : null;
  }
  if (next === null) return prev + RUN_ORDER_STEP; // bottom of the column

  const middle = Math.floor((prev + next) / 2);
  return middle > prev && middle < next ? middle : null;
};

// Evenly renumbers a machine with the moving job placed right after every job whose run_order
// is <= prevRunOrder (at the top when prevRunOrder is null).
export const rebalancedOrder = (
  jobsOnMachine: { id: string; runOrder: number | null }[],
  movingJobId: string,
  prevRunOrder: number | null,
): { id: string; runOrder: number }[] => {
  const others = jobsOnMachine.filter((job) => job.id !== movingJobId);

  let insertAt = 0;
  if (prevRunOrder !== null) {
    const firstAfter = others.findIndex((job) => (job.runOrder ?? 0) > prevRunOrder);
    insertAt = firstAfter === -1 ? others.length : firstAfter;
  }

  const ids = [
    ...others.slice(0, insertAt).map((job) => job.id),
    movingJobId,
    ...others.slice(insertAt).map((job) => job.id),
  ];
  return ids.map((id, index) => ({ id, runOrder: (index + 1) * RUN_ORDER_STEP }));
};
