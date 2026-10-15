import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { loginController, meController, registerController } from "../controllers/auth.controller.js";

// Mounted at /api/auth.
const router = Router();

router.post("/login", loginController);
// Only a signed-in user can create accounts; the first admin comes from `npm run seed:admin`.
router.post("/register", requireAuth, registerController);
router.get("/me", requireAuth, meController);

export default router;
