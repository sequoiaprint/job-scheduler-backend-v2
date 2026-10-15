import { grovePool } from "../../../config/grove-db.config.js";
import { prisma } from "../../../config/prisma.config.js";

// REPOSITORY: liveness probes for the two databases the API depends on.

export const pingDatabase = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};

export const pingGrove = async (): Promise<void> => {
  await grovePool.query("SELECT 1");
};
