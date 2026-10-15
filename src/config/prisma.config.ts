import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.config.js";

// PRISMA: the single client for Atlas's own database (artwork_jobs, proofing_jobs, users).
const adapter = new PrismaMariaDb({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  connectionLimit: env.DATABASE_CONNECTION_LIMIT,
});

export const prisma = new PrismaClient({ adapter });
