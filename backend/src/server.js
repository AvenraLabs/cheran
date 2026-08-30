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

    // Idempotent column check (ensures newly introduced columns/tables exist before sync & index creation)
    await db.query(`
      ALTER TABLE IF EXISTS dealer_commissions
        ADD COLUMN IF NOT EXISTS fittings_amount DECIMAL(14, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS fittings_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS fittings_paid_date DATE,
        ADD COLUMN IF NOT EXISTS fittings_paid_ref VARCHAR(255),
        ADD COLUMN IF NOT EXISTS fittings_notes TEXT;

      ALTER TABLE IF EXISTS expenses
        ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'irrigation';

      CREATE TABLE IF NOT EXISTS material_supplied_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        supplied_ha DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        supplied_count INTEGER NOT NULL DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_material_supplied_cat_year UNIQUE (category, financial_year)
      );
    `);

    // Sync schema with models (creates any missing tables)
    console.log("🔄 Synchronizing database tables...");
    await db.sync({ force: false });

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
