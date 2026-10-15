import type { AuthUser } from "../features/auth/types/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth on protected routes.
      user?: AuthUser;
    }
  }
}

export {};
