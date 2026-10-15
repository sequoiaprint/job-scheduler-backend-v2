import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.config.js";
import type { AuthUser } from "../features/auth/types/auth.types.js";

export const signToken = (user: AuthUser): string => {
  const payload: AuthUser = { id: user.id, username: user.username, email: user.email };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });
};

// Throws when the token is malformed, tampered with or expired.
export const verifyToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || typeof decoded.id !== "string") {
    throw new Error("Unexpected token payload");
  }
  return { id: decoded.id, username: String(decoded.username), email: String(decoded.email) };
};
