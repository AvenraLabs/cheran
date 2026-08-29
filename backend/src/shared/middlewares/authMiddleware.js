import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import AppError from "../appError.js";

/**
 * Require valid JWT authentication token
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please login.", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired session. Please login again.", 401));
  }
};

/**
 * Optional JWT authentication (populates req.user if token present)
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;
    } catch {
      // ignore invalid optional token
    }
  }
  next();
};

/**
 * Restrict route to specific roles (e.g. ADMIN)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    const userRole = (req.user.role || "USER").toUpperCase();
    const formattedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (userRole === "ADMIN") {
      return next();
    }

    if (!formattedAllowed.includes(userRole)) {
      return next(
        new AppError(
          `Access forbidden. Role '${req.user.role}' is not authorized to access this module.`,
          403
        )
      );
    }

    next();
  };
};

/**
 * Global Role Module Access Middleware:
 * 1. 'ADMIN': Full access to all modules and configuration.
 * 2. 'USER': Allowed:
 *    - Dashboard (/api/dashboard)
 *    - Govt Projects (/api/government/projects, /api/government/statuses)
 *    - Direct Sales (/api/sales, /api/customers, /api/items, /api/units)
 *    - Load Order Upload (/api/invoices/load-order)
 *    - Excel Imports (/api/government/imports)
 *    - Dealers Directory (/api/dealers)
 * 3. 'DEALER': Allowed ONLY:
 *    - Govt Projects (/api/government/projects, /api/government/statuses)
 *    - Excel Imports (/api/government/imports)
 *    - Dealers Directory (/api/dealers)
 *    - Auth (/api/auth) & Health (/api/health)
 */
export const enforceRoleModuleAccess = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const role = (req.user.role || "USER").toUpperCase();
  if (role === "ADMIN") {
    return next();
  }

  // Full path prefix check
  const fullPath = (req.originalUrl || req.url || "").split("?")[0];

  // Common infrastructure routes
  const commonPrefixes = ["/api/auth", "/api/health"];
  if (commonPrefixes.some((prefix) => fullPath.startsWith(prefix))) {
    return next();
  }

  if (role === "DEALER") {
    const dealerAllowedPrefixes = [
      "/api/government/projects",
      "/api/government/statuses",
      "/api/government/imports",
      "/api/reports",
      "/api/dealers",
    ];

    const isAllowed = dealerAllowedPrefixes.some((prefix) => fullPath.startsWith(prefix));
    if (!isAllowed) {
      return next(
        new AppError(
          `Access forbidden. Dealer role is restricted to Govt Projects, Pendency Report, and Excel Imports.`,
          403
        )
      );
    }
    return next();
  }

  // 'USER' role: Restricted to 4 modules (Govt Projects, Load Order Import, Excel Imports, and Commissions)
  if (role === "USER") {
    const userAllowedPrefixes = [
      "/api/government/projects",
      "/api/government/statuses",
      "/api/government/imports",
      "/api/invoices",
      "/api/proceedings",
      "/api/dealers",
    ];

    const isAllowed = userAllowedPrefixes.some((prefix) => fullPath.startsWith(prefix));
    if (!isAllowed) {
      return next(
        new AppError(
          `Access forbidden. User role is restricted to Govt Projects, Load Order Import, Excel Imports, and Commission modules.`,
          403
        )
      );
    }
    return next();
  }

  return next();
};

export default requireAuth;
