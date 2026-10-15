import type { Request, Response } from "express";
import { sendResponse } from "../../../utils/send-response.utils.js";
import { SYNC_MESSAGES } from "../data/grove.data.js";
import { getSyncStatus, runManualSync } from "../services/grove-sync.service.js";

// CONTROLLER: manual sync trigger and sync status.

// POST /api/sync
export const runSyncController = async (_req: Request, res: Response) => {
  return sendResponse(res, 200, SYNC_MESSAGES.completed, await runManualSync());
};

// GET /api/sync/status
export const syncStatusController = (_req: Request, res: Response) => {
  return sendResponse(res, 200, SYNC_MESSAGES.status, getSyncStatus());
};
