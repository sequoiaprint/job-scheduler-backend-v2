// Minimal leveled logger with timestamps. Debug lines only appear outside production.
const isProduction = process.env.NODE_ENV === "production";

const write = (level: string, message: string, meta?: unknown) => {
  const line = `${new Date().toISOString()} [${level}] ${message}`;
  const stream = level === "ERROR" || level === "WARN" ? console.error : console.log;
  if (meta === undefined) stream(line);
  else stream(line, meta);
};

export const logger = {
  debug: (message: string, meta?: unknown) => {
    if (!isProduction) write("DEBUG", message, meta);
  },
  info: (message: string, meta?: unknown) => write("INFO", message, meta),
  warn: (message: string, meta?: unknown) => write("WARN", message, meta),
  error: (message: string, meta?: unknown) => write("ERROR", message, meta),
};
