import { z } from "zod";

// TYPES: request schemas (validated at the controller) and the shapes the auth feature returns.

export const LoginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  username: z.string().trim().min(3).max(191),
  email: z.email().max(191),
  // bcrypt only uses the first 72 bytes of a password.
  password: z.string().min(8).max(72),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

// The user as the API exposes it (and as it is stored in the JWT). Never includes the hash.
export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}
