import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.utils.js";
import { verifyToken } from "../utils/jwt.utils.js";

// Protects routes with the Bearer JWT issued at login and exposes the user as req.user.
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    throw new AppError("Authentication token is required", 401);
  }

  try {
    req.user = verifyToken(token);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
  next();
};
