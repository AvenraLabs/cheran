import app from "./app.js";
import db from "./config/db.js";
import env from "./config/env.js";
import "./models/initModels.js";
import { seedGovernmentStatuses } from "./scripts/seedStatuses.js";

async function startServer() {
  try {
    console.log("🔌 Connecting to PostgreSQL database...");
    await db.authenticate();
    console.log("✅ PostgreSQL connected successfully.");

    // Sync schema with models (creates any missing tables)
    console.log("🔄 Synchronizing database tables...");
    await db.sync({ force: false });

    // Idempotent column check for dealer_commissions (adds any newly introduced columns safely)
    await db.query(`
      ALTER TABLE IF EXISTS dealer_commissions
        ADD COLUMN IF NOT EXISTS fittings_amount DECIMAL(14, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS fittings_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS fittings_paid_date DATE,
        ADD COLUMN IF NOT EXISTS fittings_paid_ref VARCHAR(255),
        ADD COLUMN IF NOT EXISTS fittings_notes TEXT;
    `);

    console.log("✅ Database schema synchronized.");

    // Ensure government statuses are seeded
    await seedGovernmentStatuses();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Cheran Horticulture Backend Server running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
      console.log(`📡 Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("🔒 HTTP server closed.");
        try {
          await db.close();
          console.log("🔒 PostgreSQL connection closed.");
          process.exit(0);
        } catch (err) {
          console.error("Error during DB disconnect:", err);
          process.exit(1);
        }
      });

      // Force shutdown if taking too long
      setTimeout(() => {
        console.error("⚠️ Forcefully terminating server after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason, promise) => {
      console.error("⚠️ UNHANDLED REJECTION caught at:", promise, "reason:", reason);
      // Non-fatal: do not kill the server process on temporary unhandled promise rejection
    });

    process.on("uncaughtException", (err) => {
      console.error("💥 UNCAUGHT EXCEPTION! Shutting down...", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
