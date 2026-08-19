import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import User from "../auth/user.model.js";
import AppError from "../../shared/appError.js";

export async function listUsers({ search, role, is_active, page = 1, limit = 25 }) {
  const where = {};

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    where[Op.or] = [
      { username: { [Op.iLike]: term } },
      { name: { [Op.iLike]: term } },
    ];
  }

  if (role) {
    where.role = role.toUpperCase();
  }

  if (is_active !== undefined) {
    where.is_active = is_active === "true" || is_active === true;
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ["id", "username", "name", "role", "is_active", "created_at", "updated_at"],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    users: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    },
  };
}

export async function getUserById(id) {
  const user = await User.findByPk(id, {
    attributes: ["id", "username", "name", "role", "is_active", "created_at", "updated_at"],
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
}

export async function createUser({ username, password, name, role = "USER", is_active = true }) {
  const cleanUsername = username.trim().toLowerCase();

  const existing = await User.findOne({
    where: { username: cleanUsername },
  });

  if (existing) {
    throw new AppError(`A user with username '${cleanUsername}' already exists.`, 409);
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username: cleanUsername,
    password_hash,
    name: name.trim(),
    role: role.toUpperCase(),
    is_active: is_active ?? true,
  });

  return {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    is_active: newUser.is_active,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  };
}

export async function updateUser(id, updates, currentUserId) {
  const user = await User.findByPk(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Prevent self-demotion or self-deactivation if this is the user modifying themselves
  if (currentUserId && user.id === currentUserId) {
    if (updates.is_active === false) {
      throw new AppError("You cannot deactivate your own account.", 400);
    }
    if (updates.role && updates.role !== user.role && updates.role !== "ADMIN") {
      throw new AppError("You cannot demote your own administrator account.", 400);
    }
  }

  // Check username uniqueness if changing username
  if (updates.username && updates.username.trim().toLowerCase() !== user.username.toLowerCase()) {
    const cleanUsername = updates.username.trim().toLowerCase();
    const existing = await User.findOne({
      where: { username: cleanUsername },
    });
    if (existing && existing.id !== id) {
      throw new AppError(`Username '${cleanUsername}' is already taken.`, 409);
    }
    user.username = cleanUsername;
  }

  if (updates.name !== undefined) {
    user.name = updates.name.trim();
  }

  if (updates.role !== undefined) {
    user.role = updates.role.toUpperCase();
  }

  if (updates.is_active !== undefined) {
    user.is_active = Boolean(updates.is_active);
  }

  if (updates.password && updates.password.trim()) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(updates.password.trim(), salt);
  }

  await user.save();

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function deleteUser(id, currentUserId) {
  const user = await User.findByPk(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (currentUserId && user.id === currentUserId) {
    throw new AppError("You cannot delete your own account.", 400);
  }

  // Check if this is the last admin
  if (user.role === "ADMIN") {
    const adminCount = await User.count({
      where: {
        role: "ADMIN",
        is_active: true,
      },
    });
    if (adminCount <= 1) {
      throw new AppError("Cannot delete the only active administrator.", 400);
    }
  }

  await user.destroy();

  return { message: `User '${user.username}' deleted successfully.` };
}
