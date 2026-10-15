import cors from "cors";
import express from "express";
import morgan from "morgan";
import { corsOrigin, env } from "./config/env.config.js";
import healthRoutes from "./features/health/routes/health.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import apiRoutes from "./routes/index.js";

// Builds the Express app without listening, so the server (and tests) decide how to run it.
export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "100kb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/health", healthRoutes);
  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
