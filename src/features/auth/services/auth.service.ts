import bcrypt from "bcryptjs";
import { env } from "../../../config/env.config.js";
import { AppError } from "../../../utils/app-error.utils.js";
import { signToken } from "../../../utils/jwt.utils.js";
import { AUTH_MESSAGES } from "../data/auth.data.js";
import {
  createUser,
  findUserById,
  findUserByUsernameOrEmail,
  findUserWithPasswordByUsername,
} from "../repositories/user.repository.js";
import type { AuthUser, LoginInput, LoginResult, RegisterInput } from "../types/auth.types.js";

// SERVICE: authentication rules. No HTTP here; controllers handle requests and responses.

export const login = async ({ username, password }: LoginInput): Promise<LoginResult> => {
  const record = await findUserWithPasswordByUsername(username);

  // Same message for unknown user and wrong password, so usernames can't be probed.
  if (!record || !(await bcrypt.compare(password, record.password))) {
    throw new AppError(AUTH_MESSAGES.invalidCredentials, 401);
  }

  const user: AuthUser = { id: record.id, username: record.username, email: record.email };
  return { user, token: signToken(user) };
};

export const register = async ({ username, email, password }: RegisterInput): Promise<AuthUser> => {
  if (await findUserByUsernameOrEmail(username, email)) {
    throw new AppError(AUTH_MESSAGES.alreadyRegistered, 409);
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  return createUser({ username, email, passwordHash });
};

// The token can outlive the account, so the user is re-read on every check.
export const getCurrentUser = async (userId: string): Promise<AuthUser> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError(AUTH_MESSAGES.userGone, 401);
  }
  return user;
};
