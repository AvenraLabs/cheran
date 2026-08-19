import bcrypt from "bcryptjs";
import db from "../config/db.js";
import User from "../modules/auth/user.model.js";
import { runAutomatedMigrations } from "../config/runMigrations.js";

async function seedAdmin() {
  const args = process.argv.slice(2);
  const username = args[0] || process.env.ADMIN_USERNAME || "admin";
  const password = args[1] || process.env.ADMIN_PASSWORD || "admin123";
  const name = args[2] || "Administrator";

  console.log("🔌 Connecting to database...");
  await db.authenticate();
  console.log("✅ Database connected.");

  // Ensure all database tables exist via migrations
  await runAutomatedMigrations();

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const existingUser = await User.findOne({ where: { username } });

  if (existingUser) {
    console.log(`ℹ️  User '${username}' already exists. Updating password & ensuring active admin status...`);
    existingUser.password_hash = password_hash;
    existingUser.name = name;
    existingUser.role = "ADMIN";
    existingUser.is_active = true;
    await existingUser.save();
    console.log(`✅ Admin user '${username}' updated successfully.`);
  } else {
    await User.create({
      username,
      password_hash,
      name,
      role: "ADMIN",
      is_active: true,
    });
    console.log(`✅ Admin user '${username}' created successfully.`);
  }

  console.log("-----------------------------------------");
  console.log(`👤 Username: ${username}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`🏷️  Role:     ADMIN`);
  console.log("-----------------------------------------");
}

seedAdmin()
  .then(async () => {
    await db.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("❌ Failed to seed admin user:", error.message || error);
    try {
      await db.close();
    } catch {}
    process.exit(1);
  });
