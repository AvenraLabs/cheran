import app from "./app.js";
import db from "./config/db.js";
import env from "./config/env.js";
import { runAutomatedMigrations } from "./config/runMigrations.js";
import { ensureDefaultAdminUser } from "./modules/auth/auth.service.js";

async function startServer() {
  try {
    console.log("🔌 Connecting to PostgreSQL database...");
    await db.authenticate();
    console.log("✅ PostgreSQL connected successfully.");

    // Run database migrations and seeders automatically
    await runAutomatedMigrations();

    // Ensure default admin user exists
    await ensureDefaultAdminUser();

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

    process.on("unhandledRejection", (err) => {
      console.error("💥 UNHANDLED REJECTION! Shutting down...", err);
      shutdown("UNHANDLED_REJECTION");
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
