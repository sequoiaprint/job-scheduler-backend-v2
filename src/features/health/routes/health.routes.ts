import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";

// Mounted at /health.
const router = Router();

router.get("/", healthController);

export default router;
