import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOrigin } from "./env.config.js";
import { verifyToken } from "../utils/jwt.utils.js";
import { logger } from "../utils/logger.utils.js";

// SOCKET: real-time channel to the boards. Clients authenticate with the same JWT as the REST API.
let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth?.token;
    if (typeof token !== "string" || token.length === 0) {
      return next(new Error("Authentication token is required"));
    }
    try {
      socket.data.user = verifyToken(token);
      return next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: ${socket.id} (${socket.data.user?.username})`);
    socket.on("disconnect", () => logger.debug(`Socket disconnected: ${socket.id}`));
  });

  return io;
};

// No-op until the server is initialised, so services can emit safely from scripts and tests.
export const emitSocketEvent = (event: string, payload: unknown): void => {
  io?.emit(event, payload);
};

export const closeSocketServer = async (): Promise<void> => {
  if (!io) return;
  await io.close();
  io = null;
};
