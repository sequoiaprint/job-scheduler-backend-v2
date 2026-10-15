import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

// ENV: every runtime setting comes from the environment (see .env.example).
// Parsed once at startup so a missing or malformed value stops the server with a clear message.

const commaSeparated = z
  .string()
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: commaSeparated.pipe(z.array(z.url()).min(1)),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  DATABASE_NAME: z.string().min(1),
  DATABASE_CONNECTION_LIMIT: z.coerce.number().int().positive().default(5),

  GROVE_DATABASE_HOST: z.string().min(1),
  GROVE_DATABASE_PORT: z.coerce.number().int().positive().default(3306),
  GROVE_DATABASE_USER: z.string().min(1),
  GROVE_DATABASE_PASSWORD: z.string().min(1),
  GROVE_DATABASE_NAME: z.string().min(1),
  GROVE_SYNC_ENABLED: z.stringbool().default(true),
  GROVE_SYNC_INTERVAL_MS: z.coerce.number().int().min(10_000).default(60_000),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default("7d"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(14).default(10),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration (check your .env):");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
