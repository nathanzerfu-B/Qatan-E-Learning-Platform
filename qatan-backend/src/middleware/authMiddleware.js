import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * 🛡️ Role-Based Access Control (RBAC) Guard
 * Restricts route access to specific user roles (e.g. 'admin', 'instructor', 'student')
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Access requires one of [${allowedRoles.join(", ")}]`,
    });
  }

  next();
};

export { authMiddleware, requireRole };

