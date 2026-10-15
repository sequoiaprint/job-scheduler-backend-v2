// A known, expected failure (bad input, missing record, conflict). The global error handler
// turns it into a JSON response with this status code; anything else becomes a 500.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
