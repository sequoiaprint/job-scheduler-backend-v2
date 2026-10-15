import type { Response } from "express";

// Every API response uses the same envelope: { statusCode, success, message, data }.
export const sendResponse = <T>(res: Response, statusCode: number, message: string, data: T) => {
  return res.status(statusCode).json({
    statusCode,
    success: statusCode < 400,
    message,
    data,
  });
};
