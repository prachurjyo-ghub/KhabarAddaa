const ApiError = require("../utils/ApiError");

function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const isCastError = err.name === "CastError" && err.kind === "ObjectId";
  const statusCode = isCastError ? 400 : err.statusCode || 500;
  const message = isCastError
    ? `Invalid ${err.path || "identifier"}`
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
