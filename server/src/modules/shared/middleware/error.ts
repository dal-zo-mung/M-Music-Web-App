import type { ErrorRequestHandler } from "express";

type ErrorWithStatus = Error & {
  statusCode?: number;
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error instanceof Error && error.stack ? error.stack : error);

  const normalizedError = error as ErrorWithStatus;
  const statusCode = normalizedError.statusCode ?? 500;

  res.status(statusCode).json({
    status: false,
    message: normalizedError.message || "Internal Server Error",
    errors: [normalizedError.message || "Internal Server Error"],
    ...(process.env.NODE_ENV !== "production" && normalizedError.stack
      ? { stack: normalizedError.stack }
      : {}),
  });
};
