import mariadb from "mariadb";
import { env } from "../../../config/env.config.js";
import { grovePool } from "../../../config/grove-db.config.js";
import { prisma } from "../../../config/prisma.config.js";
import { HEALTH_CHECK_TIMEOUT_MS } from "../data/health.data.js";

// REPOSITORY: liveness probes for the two databases the API depends on.

export const pingDatabase = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};

export const pingGrove = async (): Promise<void> => {
  await grovePool.query("SELECT 1");
};

// One direct connection, outside the pools. A pool only reports "pool timeout"; a direct
// connection fails with the actual reason (host not found, refused, access denied...).
const connectOnce = async (options: mariadb.ConnectionConfig): Promise<void> => {
  const connection = await mariadb.createConnection({ ...options, connectTimeout: HEALTH_CHECK_TIMEOUT_MS });
  await connection.end();
};

export const connectToAtlasDatabase = () =>
  connectOnce({
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
  });

export const connectToGroveDatabase = () =>
  connectOnce({
    host: env.GROVE_DATABASE_HOST,
    port: env.GROVE_DATABASE_PORT,
    user: env.GROVE_DATABASE_USER,
    password: env.GROVE_DATABASE_PASSWORD,
    database: env.GROVE_DATABASE_NAME,
  });
