import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./user.model.js";
import env from "../../config/env.js";
import AppError from "../../shared/appError.js";

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
    { expiresIn: env.JWT_EXPIRES_IN || "30d" }
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
