import { Router } from "express";
import {
  completeJobController,
  getBoardController,
  getCompletedController,
  moveJobController,
  unscheduleJobController,
} from "../controllers/jobs.controller.js";

// Mounted at /api/jobs (signed-in users only). :jobType is "artwork" or "proofing".
const router = Router();

router.get("/:jobType/board", getBoardController);
router.get("/:jobType/completed", getCompletedController);
router.patch("/:jobType/:jobId/position", moveJobController);
router.patch("/:jobType/:jobId/complete", completeJobController);
router.patch("/:jobType/:jobId/unschedule", unscheduleJobController);

export default router;
