import GovernmentStatus from "./status.model.js";
import AppError from "../../shared/appError.js";

export async function listStatuses({ is_active } = {}) {
  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  const statuses = await GovernmentStatus.findAll({
    where,
    order: [["sequence_order", "ASC"], ["name", "ASC"]],
  });

  return statuses;
}

export async function getStatusByName(name) {
  return await GovernmentStatus.findOne({
    where: { name: name.trim() },
  });
}

export async function createStatus({ name, is_active = true }) {
  const trimmed = name.trim();
  const existing = await GovernmentStatus.findOne({ where: { name: trimmed } });
  if (existing) {
    throw new AppError(`Status '${trimmed}' already exists`, 400);
  }

  const status = await GovernmentStatus.create({
    name: trimmed,
    is_active,
  });

  return status;
}
