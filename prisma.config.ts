import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ quiet: true });

// The Prisma CLI needs a connection URL; it is built from the same DATABASE_* parts the
// app uses, so the credentials live in exactly one place. `prisma generate` runs without them.
const { DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } = process.env;
const url =
  DATABASE_HOST && DATABASE_USER && DATABASE_PASSWORD && DATABASE_NAME
    ? `mysql://${encodeURIComponent(DATABASE_USER)}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT ?? 3306}/${DATABASE_NAME}`
    : undefined;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
