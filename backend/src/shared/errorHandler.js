import env from "../config/env.js";

export default function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  // Sequelize Unique Constraint Errors -> 400
  if (err?.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    const field = err?.errors?.[0]?.path;
    const value = err?.errors?.[0]?.value;
    message = field ? `Value '${value}' for '${field}' is already in use` : "Duplicate record error";
  }
  // Sequelize Database Timeout Errors -> 503
  else if (
    err?.name === "TimeoutError" ||
    err?.name === "SequelizeConnectionAcquireTimeoutError" ||
    err?.name === "SequelizeTimeoutError"
  ) {
    statusCode = 503;
    message = "Database is currently busy or connection timed out. Please retry shortly.";
  }
  // Sequelize Validation Errors
  else if (err?.name === "SequelizeValidationError") {
    statusCode = 400;
    message = err.errors.map((e) => e.message).join(", ");
  }
  // Multer Errors
  else if (err?.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = `File too large. Maximum allowed size is ${env.MAX_FILE_SIZE_MB}MB`;
    }
  }

  if (!err.isOperational && statusCode >= 500) {
    console.error("[CRITICAL UNHANDLED ERROR]", err);
  }

  res.status(statusCode).json({
    status: err.status || (statusCode >= 500 ? "error" : "fail"),
    message,
    ...(details ? { details } : {}),
    ...(env.NODE_ENV === "development" && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
