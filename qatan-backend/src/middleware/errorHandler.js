// Centralized safe error-handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Internal Server Error:", {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Prisma unique constraint violation (e.g. duplicate email)
  if (err.code === "P2002") {
    const target = err.meta?.target ? ` (${err.meta.target})` : "";
    return res.status(409).json({
      success: false,
      message: `A record with this field already exists${target}.`,
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "The requested resource could not be found.",
    });
  }

  // JSON parsing error in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload provided.",
    });
  }

  // Standard safe error response (never leak stack trace in production)
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error. Please try again later." : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
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
