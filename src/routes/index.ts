import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import authRoutes from "../features/auth/routes/auth.routes.js";
import groveSyncRoutes from "../features/grove-sync/routes/grove-sync.routes.js";
import jobsRoutes from "../features/jobs/routes/jobs.routes.js";

// Mounts every feature router under /api.
const router = Router();

router.use("/auth", authRoutes);
router.use("/jobs", requireAuth, jobsRoutes);
router.use("/sync", requireAuth, groveSyncRoutes);

export default router;
