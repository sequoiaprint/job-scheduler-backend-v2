import type { Request, Response } from "express";
import { sendResponse } from "../../../utils/send-response.utils.js";
import { getHealth } from "../services/health.service.js";

// GET /health — unauthenticated, for uptime checks and deploy scripts. 503 when a database is down.
export const healthController = async (_req: Request, res: Response) => {
  const report = await getHealth();
  const ok = report.status === "ok";
  return sendResponse(res, ok ? 200 : 503, ok ? "Service healthy" : "Service degraded", report);
};
