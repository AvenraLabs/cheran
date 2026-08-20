import db from "../config/db.js";
import { umzugMigrations } from "../config/runMigrations.js";

async function runMigrations() {
  console.log("🔌 Connecting to PostgreSQL database...");
  await db.authenticate();
  console.log("✅ PostgreSQL connected.");

  console.log("🔄 Checking pending migrations in backend/migrations/...");
  const pending = await umzugMigrations.pending();

  if (pending.length === 0) {
    console.log("✅ Database is up to date. No pending migrations.");
  } else {
    console.log(`Found ${pending.length} pending migration(s):`, pending.map((m) => m.name));
    await umzugMigrations.up();
    console.log("🎉 All pending migrations applied successfully!");
  }
}

runMigrations()
  .then(async () => {
    await db.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Migration failed:", error);
    try {
      await db.close();
    } catch {}
    process.exit(1);
  });
