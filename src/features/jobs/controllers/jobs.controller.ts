import type { Request, Response } from "express";
import { sendResponse } from "../../../utils/send-response.utils.js";
import { JOB_MESSAGES } from "../data/boards.data.js";
import { completeJob, getBoard, getCompletedBoard, moveJob, unscheduleJob } from "../services/jobs.service.js";
import { JobParamsSchema, JobTypeParamsSchema, MoveJobSchema } from "../types/jobs.types.js";

// CONTROLLER: validates params/body, calls the jobs service, shapes the response.

// GET /api/jobs/:jobType/board
export const getBoardController = async (req: Request, res: Response) => {
  const { jobType } = JobTypeParamsSchema.parse(req.params);
  return sendResponse(res, 200, JOB_MESSAGES.boardFetched, await getBoard(jobType));
};

// GET /api/jobs/:jobType/completed
export const getCompletedController = async (req: Request, res: Response) => {
  const { jobType } = JobTypeParamsSchema.parse(req.params);
  return sendResponse(res, 200, JOB_MESSAGES.completedFetched, await getCompletedBoard(jobType));
};

// PATCH /api/jobs/:jobType/:jobId/position
export const moveJobController = async (req: Request, res: Response) => {
  const { jobType, jobId } = JobParamsSchema.parse(req.params);
  const input = MoveJobSchema.parse(req.body);
  return sendResponse(res, 200, JOB_MESSAGES.moved, await moveJob(jobType, jobId, input));
};

// PATCH /api/jobs/:jobType/:jobId/complete
export const completeJobController = async (req: Request, res: Response) => {
  const { jobType, jobId } = JobParamsSchema.parse(req.params);
  return sendResponse(res, 200, JOB_MESSAGES.completed, { job: await completeJob(jobType, jobId) });
};

// PATCH /api/jobs/:jobType/:jobId/unschedule
export const unscheduleJobController = async (req: Request, res: Response) => {
  const { jobType, jobId } = JobParamsSchema.parse(req.params);
  return sendResponse(res, 200, JOB_MESSAGES.unscheduled, { job: await unscheduleJob(jobType, jobId) });
};
