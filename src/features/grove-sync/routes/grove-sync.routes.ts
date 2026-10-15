import { Router } from "express";
import { runSyncController, syncStatusController } from "../controllers/grove-sync.controller.js";

// Mounted at /api/sync (signed-in users only).
const router = Router();

router.post("/", runSyncController);
router.get("/status", syncStatusController);

export default router;
