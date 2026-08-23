const ApiError = require("../utils/ApiError");

function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const isCastError = err.name === "CastError" && err.kind === "ObjectId";
  const isValidationError = err.name === "ValidationError";
  const isDuplicateKey = err?.code === 11000;
  const statusCode =
    isCastError || isValidationError
      ? 400
      : isDuplicateKey
        ? 409
        : err.statusCode || 500;
  const message = isCastError
    ? `Invalid ${err.path || "identifier"}`
    : isValidationError
      ? "Validation failed"
      : isDuplicateKey
        ? "A record with that value already exists"
        : err.message || "Internal server error";

  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || null,
  });
}

module.exports = { notFoundHandler, errorHandler };
