/**
 * Centralized Backend Error Handler Middleware
 * Handles:
 * - 400 Bad Request
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 404 Not Found
 * - 409 Conflict
 * - 500 Internal Server Error
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;
  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 404;
    err.message = `Resource not found with id: ${err.value}`;
  }

  // Handle Mongoose duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "Field";
    err.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    err.message = messages.join(". ");
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    err.message = "Invalid token authorization";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    err.message = "Token expired, please log in again";
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
