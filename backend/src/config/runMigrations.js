import { Umzug, SequelizeStorage } from "umzug";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import db from "./db.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsPath = path.resolve(__dirname, "../../migrations");
const seedersPath = path.resolve(__dirname, "../../seeders");

export const umzugMigrations = new Umzug({
  migrations: {
    glob: ["*.cjs", { cwd: migrationsPath }],
    resolve: ({ name, path: migrationFilePath, context }) => {
      const mig = require(migrationFilePath);
      return {
        name,
        up: async () => {
          return mig.up(context.getQueryInterface(), context.constructor);
        },
        down: async () => {
          return mig.down(context.getQueryInterface(), context.constructor);
        },
      };
    },
  },
  context: db,
  storage: new SequelizeStorage({ sequelize: db, tableName: "SequelizeMeta" }),
  logger: console,
});

export const umzugSeeders = new Umzug({
  migrations: {
    glob: ["*.cjs", { cwd: seedersPath }],
    resolve: ({ name, path: seederFilePath, context }) => {
      const seeder = require(seederFilePath);
      return {
        name,
        up: async () => {
          return seeder.up(context.getQueryInterface(), context.constructor);
        },
        down: async () => {
          return seeder.down(context.getQueryInterface(), context.constructor);
        },
      };
    },
  },
  context: db,
  storage: new SequelizeStorage({ sequelize: db, tableName: "SequelizeData" }),
  logger: console,
});

export async function runAutomatedMigrations() {
  if (process.env.AUTO_MIGRATE === "false") {
    console.log("⏭️ AUTO_MIGRATE is set to false. Skipping startup migration check.");
    return;
  }

  const LOCK_ID = 884729104; // Unique 64-bit integer advisory lock key for Cheran ERP migrations
  let lockAcquired = false;

  try {
    // Attempt to acquire an advisory lock to prevent multiple PM2 instances from racing
    const [lockResult] = await db.query(`SELECT pg_try_advisory_lock(${LOCK_ID}) AS acquired;`);
    lockAcquired = lockResult[0]?.acquired === true || lockResult[0]?.acquired === "t";

    if (!lockAcquired) {
      console.log("🔒 Another instance is currently executing migrations. Waiting for schema update...");
      // Block until lock is released by other instance
      await db.query(`SELECT pg_advisory_lock(${LOCK_ID});`);
      lockAcquired = true;
    }

    console.log("🔄 Checking and executing pending database migrations...");
    const pending = await umzugMigrations.pending();
    if (pending.length > 0) {
      console.log(`Found ${pending.length} pending migrations:`, pending.map((m) => m.name));
      await umzugMigrations.up();
      console.log("✅ All migrations applied successfully.");
    } else {
      console.log("✅ Database schema is up to date (no pending migrations).");
    }

    // Run seeders for government statuses if not seeded
    const pendingSeeders = await umzugSeeders.pending();
    if (pendingSeeders.length > 0) {
      console.log(`Found ${pendingSeeders.length} pending seeders:`, pendingSeeders.map((s) => s.name));
      await umzugSeeders.up();
      console.log("✅ Seeders executed successfully.");
    }
  } catch (error) {
    console.error("❌ Migration runner error:", error);
    throw error;
  } finally {
    if (lockAcquired) {
      try {
        await db.query(`SELECT pg_advisory_unlock(${LOCK_ID});`);
      } catch {
        // ignore unlock error on process exit
      }
    }
  }
}
