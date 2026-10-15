import mariadb from "mariadb";
import { env } from "./env.config.js";

// GROVE: connection pool to Grove's database, the source of artwork and proofing job cards.
// Atlas only ever reads from Grove. Every connection opens a READ ONLY session, so a stray
// write is rejected by MySQL itself rather than relying on the code being careful.
export const grovePool = mariadb.createPool({
  host: env.GROVE_DATABASE_HOST,
  port: env.GROVE_DATABASE_PORT,
  user: env.GROVE_DATABASE_USER,
  password: env.GROVE_DATABASE_PASSWORD,
  database: env.GROVE_DATABASE_NAME,
  connectionLimit: 2,
  initSql: "SET SESSION TRANSACTION READ ONLY",
});
