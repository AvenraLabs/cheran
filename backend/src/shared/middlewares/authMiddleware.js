import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import AppError from "../appError.js";
import User from "../../modules/auth/user.model.js";

/**
 * Require valid JWT authentication token
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please login.", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Resolve user from DB to guarantee valid active user record & UUID
    let user = null;
    if (decoded?.id) {
      user = await User.findByPk(decoded.id, {
        attributes: ["id", "username", "name", "role", "is_active"],
      });
    }

    // Auto-heal fallback by username if database was freshly initialized/cloned
    if (!user && decoded?.username) {
      user = await User.findOne({
        where: { username: decoded.username, is_active: true },
        attributes: ["id", "username", "name", "role", "is_active"],
      });
    }

    if (!user || !user.is_active) {
      return next(new AppError("Invalid or expired session. Please login again.", 401));
    }

    req.user = user.toJSON();
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired session. Please login again.", 401));
  }
};

/**
 * Optional JWT authentication (populates req.user if token present)
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      let user = null;
      if (decoded?.id) {
        user = await User.findByPk(decoded.id, {
          attributes: ["id", "username", "name", "role", "is_active"],
        });
      }
      if (!user && decoded?.username) {
        user = await User.findOne({
          where: { username: decoded.username, is_active: true },
          attributes: ["id", "username", "name", "role", "is_active"],
        });
      }
      if (user && user.is_active) {
        req.user = user.toJSON();
      }
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

    const normalizedUserRole = userRole === "PLAST" ? "PLAST_USER" : userRole;
    const normalizedAllowed = formattedAllowed.map((r) => (r === "PLAST" ? "PLAST_USER" : r));

    if (!normalizedAllowed.includes(normalizedUserRole)) {
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

  // 'USER' / 'GOVT' / 'OPERATIONS' role: Strictly restricted to Govt Projects and Load Order Upload only (2 pages)
  if (role === "USER" || role === "GOVT" || role === "OPERATIONS") {
    const isLoadOrderRoute = fullPath.startsWith("/api/invoices/load-order");
    const isGovtProjectRoute =
      fullPath.startsWith("/api/government/projects") ||
      fullPath.startsWith("/api/government/statuses");
    const isDealersOptions = fullPath.startsWith("/api/dealers") && req.method === "GET";
    const isInventoryForLoadOrder =
      (fullPath.startsWith("/api/inventory/stock") || fullPath.startsWith("/api/items")) &&
      req.method === "GET";

    if (isLoadOrderRoute || isGovtProjectRoute || isDealersOptions || isInventoryForLoadOrder) {
      return next();
    }

    return next(
      new AppError(
        `Access forbidden. Role '${req.user.role}' is restricted to Govt Projects and Load Order Upload only.`,
        403
      )
    );
  }

  // 'PLAST_USER' (or legacy 'PLAST') role: Sales & Billing, Customers, Items, Daily Production, Units, and Stock On-Hand
  if (role === "PLAST" || role === "PLAST_USER") {
    const plastAllowedPrefixes = [
      "/api/plast/sales",
      "/api/plast/customers",
      "/api/plast/items",
      "/api/plast/production",
      "/api/plast/units",
      "/api/plast/inventory",
    ];

    const isAllowed = plastAllowedPrefixes.some((prefix) => fullPath.startsWith(prefix));
    if (!isAllowed) {
      return next(
        new AppError(
          `Access forbidden. Plast (User) role is restricted to Sales & Billing, Customers, Items, Daily Production, Units, and Stock On-Hand.`,
          403
        )
      );
    }
    return next();
  }

  // 'PLAST_PAYMENTS' role: Sales & Billing, Customers, Items, Daily Production, Units, Stock On-Hand, and Payments
  if (role === "PLAST_PAYMENTS") {
    const plastAllowedPrefixes = [
      "/api/plast/sales",
      "/api/plast/customers",
      "/api/plast/items",
      "/api/plast/production",
      "/api/plast/units",
      "/api/plast/inventory",
      "/api/plast/payments",
    ];

    const isAllowed = plastAllowedPrefixes.some((prefix) => fullPath.startsWith(prefix));
    if (!isAllowed) {
      return next(
        new AppError(
          `Access forbidden. Plast (Payments) role is restricted to Sales & Billing, Customers, Items, Daily Production, Units, Stock On-Hand, and Payments.`,
          403
        )
      );
    }
    return next();
  }

  return next();
};

export default requireAuth;
