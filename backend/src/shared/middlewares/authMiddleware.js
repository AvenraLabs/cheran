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
 * For 'USER' role: strictly allows ONLY the 4 authorized modules:
 * 1. Dashboard (/api/dashboard)
 * 2. Govt Projects (/api/government/projects)
 * 3. Excel Imports (/api/government/imports)
 * 4. Dealers Directory (/api/dealers)
 * + Reference Statuses (/api/government/statuses) & Auth (/api/auth)
 *
 * All other modules (Invoices, Inventory, Items, Units, Suppliers, Customers, Sales, Expenses, Employees, Reports, Settings, Tally, Users)
 * are restricted to ADMIN role.
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

  const allowedPrefixes = [
    "/api/auth",
    "/api/dashboard",
    "/api/government/projects",
    "/api/government/imports",
    "/api/dealers",
    "/api/government/statuses",
    "/api/health",
  ];

  const isAllowed = allowedPrefixes.some((prefix) => fullPath.startsWith(prefix));

  if (!isAllowed) {
    return next(
      new AppError(
        `Access forbidden. User role is restricted to Dashboard, Govt Projects, Excel Imports, and Dealers Directory.`,
        403
      )
    );
  }

  next();
};

export default requireAuth;
