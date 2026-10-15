import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.utils.js";
import { logger } from "../utils/logger.utils.js";

const fail = (res: Response, statusCode: number, message: string, errors?: unknown) =>
  res.status(statusCode).json({ statusCode, success: false, message, ...(errors ? { errors } : {}) });

// Global error handler: known errors become clean 4xx responses, everything else a logged 500.
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    return fail(res, 400, "Validation failed", errors);
  }

  if (err instanceof AppError) {
    return fail(res, err.statusCode, err.message);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") return fail(res, 404, "Record not found");
    if (err.code === "P2002") return fail(res, 409, "Record already exists");
  }

  // Malformed JSON body (thrown by express.json()).
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return fail(res, 400, "Malformed JSON body");
  }

  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
  return fail(res, 500, "Internal server error");
};
