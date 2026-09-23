import rateLimit from "express-rate-limit";
import helmet from "helmet";

/**
 * 🛡️ Production-Grade HTTP Security Headers via Helmet
 * Hardens the API against XSS, clickjacking, MIME sniffing, and unauthorized framing
 * while supporting cross-origin media (Cloudinary) and OAuth popups (Discord, Google).
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://*.cloudinary.com",
        "https://lh3.googleusercontent.com",
        "https://cdn.discordapp.com",
      ],
      mediaSrc: [
        "'self'",
        "blob:",
        "https://res.cloudinary.com",
        "https://*.cloudinary.com",
      ],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://localhost:5173",
        "https://api.chapa.co",
        "https://res.cloudinary.com",
        "https://*.cloudinary.com",
        "https://discord.com",
      ],
      frameSrc: ["'self'", "https://checkout.chapa.co"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xFrameOptions: { action: "sameorigin" },
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xPermittedCrossDomainPolicies: { policy: "none" },
  xXssProtection: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * 🛡️ Permissions Policy Header
 * Restricts browser features and sensitive hardware APIs (camera, microphone, geolocation)
 */
export const permissionsPolicy = (req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self 'https://checkout.chapa.co')"
  );
  next();
};

// Rate limiter for login and registration attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login or registration attempts. Please try again in 15 minutes.",
  },
});

// Rate limiter for password reset requests & OTP verification
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 reset requests per window to prevent email flooding
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please wait 15 minutes before requesting again.",
  },
});

// General API rate limiter to protect against denial-of-service
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Limit each IP to 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests to the API. Please slow down.",
  },
});

// Helper function to validate password complexity
export const validatePasswordStrength = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }

  // Check for at least one letter and at least one number or special character
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLetter || !hasNumberOrSymbol) {
    return {
      valid: false,
      message: "Password must contain both letters and numbers/symbols",
    };
  }

  return { valid: true };
};
