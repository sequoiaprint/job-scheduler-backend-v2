import { prisma } from "../../../config/prisma.config.js";
import { PUBLIC_USER_SELECT } from "../data/auth.data.js";
import type { AuthUser } from "../types/auth.types.js";

// REPOSITORY: the only layer that talks to the users table. Queries in, rows out.

// Includes the password hash: used by login only, to verify credentials.
export const findUserWithPasswordByUsername = (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};

export const findUserById = (id: string): Promise<AuthUser | null> => {
  return prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
};

export const findUserByUsernameOrEmail = (username: string, email: string): Promise<AuthUser | null> => {
  return prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: PUBLIC_USER_SELECT,
  });
};

export const createUser = (data: { username: string; email: string; passwordHash: string }): Promise<AuthUser> => {
  return prisma.user.create({
    data: { username: data.username, email: data.email, password: data.passwordHash },
    select: PUBLIC_USER_SELECT,
  });
};
