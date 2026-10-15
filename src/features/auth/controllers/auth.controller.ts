import type { Request, Response } from "express";
import { sendResponse } from "../../../utils/send-response.utils.js";
import { AUTH_MESSAGES } from "../data/auth.data.js";
import { getCurrentUser, login, register } from "../services/auth.service.js";
import { LoginSchema, RegisterSchema } from "../types/auth.types.js";

// CONTROLLER: validates the request, calls the service, shapes the response.

// POST /api/auth/login
export const loginController = async (req: Request, res: Response) => {
  const input = LoginSchema.parse(req.body);
  const result = await login(input);
  return sendResponse(res, 200, AUTH_MESSAGES.loginSuccess, result);
};

// POST /api/auth/register (signed-in users only)
export const registerController = async (req: Request, res: Response) => {
  const input = RegisterSchema.parse(req.body);
  const user = await register(input);
  return sendResponse(res, 201, AUTH_MESSAGES.registered, { user });
};

// GET /api/auth/me
export const meController = async (req: Request, res: Response) => {
  const user = await getCurrentUser(req.user!.id);
  return sendResponse(res, 200, AUTH_MESSAGES.currentUser, { user });
};
