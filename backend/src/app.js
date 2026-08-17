import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import env from "./config/env.js";
import errorHandler from "./shared/errorHandler.js";
import AppError from "./shared/appError.js";

// Initialize models and associations
import "./models/initModels.js";

// Routes
import dealerRoutes from "./modules/dealers/dealer.routes.js";
import statusRoutes from "./modules/statuses/status.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import importRoutes from "./modules/imports/import.routes.js";

const app = express();

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
    message: "Cheran Plast Horticulture Backend API is running smoothly",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// Mount Domain Routes
app.use("/api/dealers", dealerRoutes);
app.use("/api/government/statuses", statusRoutes);
app.use("/api/government/projects", projectRoutes);
app.use("/api/government/imports", importRoutes);

// Catch-all 404 handler
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
