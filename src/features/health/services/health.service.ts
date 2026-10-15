import { HEALTH_CHECK_TIMEOUT_MS } from "../data/health.data.js";
import { pingDatabase, pingGrove } from "../repositories/health.repository.js";
import type { DependencyState, HealthReport } from "../types/health.types.js";

// SERVICE: checks each dependency with a timeout so a hung database can't hang the probe.

const probe = async (ping: () => Promise<void>): Promise<DependencyState> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), HEALTH_CHECK_TIMEOUT_MS);
  });
  try {
    await Promise.race([ping(), timeout]);
    return "up";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
};

export const getHealth = async (): Promise<HealthReport> => {
  const [database, grove] = await Promise.all([probe(pingDatabase), probe(pingGrove)]);
  return {
    status: database === "up" && grove === "up" ? "ok" : "degraded",
    database,
    grove,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
};
