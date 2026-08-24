import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import errorHandler from "./shared/errorHandler.js";
import AppError from "./shared/appError.js";
import { requireAuth, enforceRoleModuleAccess } from "./shared/middlewares/authMiddleware.js";

// Initialize all models and associations
import "./models/initModels.js";

// Domain Routes
import dealerRoutes from "./modules/dealers/dealer.routes.js";
import statusRoutes from "./modules/statuses/status.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import importRoutes from "./modules/imports/import.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import unitRoutes from "./modules/units/unit.routes.js";
import itemRoutes from "./modules/items/item.routes.js";
import supplierRoutes from "./modules/suppliers/supplier.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import expenseRoutes from "./modules/expenses/expense.routes.js";
import employeeRoutes from "./modules/employees/employee.routes.js";
import customerRoutes from "./modules/customers/customer.routes.js";
import invoiceRoutes from "./modules/invoices/invoice.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import proceedingRoutes from "./modules/proceedings/proceeding.routes.js";

const app = express();

// Trust reverse proxy (Nginx, Cloudflare, Caddy) so IP rate-limiting works accurately
app.set("trust proxy", 1);

// Disable ETags on dynamic API responses to prevent 304 HTTP/2 stream stalls
app.disable("etag");

// Enforce no-cache on all REST API responses so browser/proxies always get fresh 200 OK payloads
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
);

// Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP Request Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// Global API Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api", limiter);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Cheran Irrigation Horticulture & ERP Backend API is running smoothly",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Mount Public Authentication Routes
app.use("/api/auth", authRoutes);

// Protected Domain Routes with Authentication & Role-Based Access Guard
app.use("/api", requireAuth, enforceRoleModuleAccess);

app.use("/api/dealers", dealerRoutes);
app.use("/api/government/statuses", statusRoutes);
app.use("/api/government/projects", projectRoutes);
app.use("/api/government/imports", importRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/proceedings", proceedingRoutes);

// Catch-all 404 handler
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
