import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.config.js";
import { grovePool } from "./config/grove-db.config.js";
import { prisma } from "./config/prisma.config.js";
import { closeSocketServer, initSocketServer } from "./config/socket.config.js";
import { startGroveSyncScheduler, stopGroveSyncScheduler } from "./features/grove-sync/services/grove-sync.scheduler.js";
import { logDatabaseConnectivity } from "./features/health/services/health.service.js";
import { logger } from "./utils/logger.utils.js";

const httpServer = createServer(createApp());
initSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(`Atlas API listening on port ${env.PORT} (${env.NODE_ENV})`);
  void logDatabaseConnectivity();
  startGroveSyncScheduler();
});

let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down`);

  stopGroveSyncScheduler();
  // Closing Socket.IO also closes the HTTP server it is attached to.
  await closeSocketServer();
  await Promise.allSettled([prisma.$disconnect(), grovePool.end()]);
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
