import type { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    statusCode: 404,
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
