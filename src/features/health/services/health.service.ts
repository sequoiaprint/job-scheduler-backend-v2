import { logger } from "../../../utils/logger.utils.js";
import { HEALTH_CHECK_TIMEOUT_MS } from "../data/health.data.js";
import {
  connectToAtlasDatabase,
  connectToGroveDatabase,
  pingDatabase,
  pingGrove,
} from "../repositories/health.repository.js";
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

// Logged once at startup, so a bad host, password or firewall rule shows up in the
// container logs with its real cause instead of a generic pool timeout.
export const logDatabaseConnectivity = async (): Promise<void> => {
  const checks: [label: string, connect: () => Promise<void>][] = [
    ["Atlas database", connectToAtlasDatabase],
    ["Grove database", connectToGroveDatabase],
  ];
  await Promise.all(
    checks.map(async ([label, connect]) => {
      try {
        await connect();
        logger.info(`${label}: connected`);
      } catch (error) {
        logger.error(`${label}: cannot connect: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
  );
};
