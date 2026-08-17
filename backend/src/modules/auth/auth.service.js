import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./user.model.js";
import env from "../../config/env.js";
import AppError from "../../shared/appError.js";

export async function ensureDefaultAdminUser() {
  try {
    const count = await User.count();
    if (count === 0) {
      const username = env.ADMIN_USERNAME || "admin";
      const password = env.ADMIN_PASSWORD || "admin123";
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      await User.create({
        username,
        password_hash,
        name: "Admin",
        role: "ADMIN",
        is_active: true,
      });
      console.log(`✅ Default admin user '${username}' seeded automatically.`);
    }
  } catch (err) {
    console.error("⚠️ Failed to ensure default admin user:", err.message);
  }
}

export async function loginUser({ username, password }) {
  if (!username || !password) {
    throw new AppError("Username and password are required", 400);
  }

  const user = await User.findOne({
    where: { username: username.trim() },
  });

  if (!user || !user.is_active) {
    throw new AppError("Invalid username or password", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError("Invalid username or password", 401);
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

export async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: ["id", "username", "name", "role", "is_active", "created_at"],
  });
  if (!user || !user.is_active) {
    throw new AppError("User not found or inactive", 404);
  }
  return user;
}
