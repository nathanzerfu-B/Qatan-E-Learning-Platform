/**
 * 🛡️ Enterprise Safe Centralized Error Handling Middleware
 * Standardizes error responses, masks internal stacks and DB details in production,
 * and handles JWT, Multer, Prisma, and JSON syntax edge cases.
 */

// Custom Operational API Error
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized safe error-handling middleware
export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  console.error("❌ Internal Error Caught:", {
    path: req.originalUrl,
    method: req.method,
    name: err.name,
    code: err.code,
    message: err.message,
    stack: isDev ? err.stack : undefined,
  });

  // 1. Custom Operational ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
  }

  // 2. JWT Authentication & Expiration Errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token. Please log in again.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication token has expired. Please log in again.",
    });
  }

  // 3. Multer File Upload Errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Uploaded file is too large. Maximum allowed size is 50MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // 4. Prisma ORM Database Errors
  if (err.code === "P2002") {
    const target = err.meta?.target ? ` on field '${err.meta.target}'` : "";
    return res.status(409).json({
      success: false,
      message: `A record with this value already exists${target}.`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "The requested resource could not be found.",
    });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Database relationship error: referenced resource does not exist.",
    });
  }

  if (err.code === "P1001" || err.code === "P1008") {
    return res.status(503).json({
      success: false,
      message: "Database service is temporarily unavailable. Please try again shortly.",
    });
  }

  // 5. JSON parsing error in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload provided.",
    });
  }

  // 6. Generic Unhandled Server Error
  const statusCode = err.statusCode || 500;
  const message =
    statusCode === 500 && !isDev
      ? "Internal server error. Please try again later."
      : err.message || "An unexpected error occurred.";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

// 404 Route Not Found Handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
};

// Async route handler wrapper to safely forward errors to errorHandler
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global process exception safety nets
export const setupProcessErrorHandlers = () => {
  process.on("unhandledRejection", (reason) => {
    console.error("🚨 Unhandled Promise Rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("🚨 Uncaught Exception:", error);
  });
};

