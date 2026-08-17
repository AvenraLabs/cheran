import { Op } from "sequelize";
import Dealer from "./dealer.model.js";
import GovernmentProject from "../projects/project.model.js";
import { normalizeDealerName } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

export async function listDealers({ search, is_active, page = 1, limit = 20 }) {
  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active;
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { normalized_name: { [Op.iLike]: `%${normalizeDealerName(search)}%` } },
    ];
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Dealer.findAndCountAll({
    where,
    order: [["name", "ASC"]],
    limit,
    offset,
  });

  return {
    dealers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getDealerById(id) {
  const dealer = await Dealer.findByPk(id, {
    include: [
      {
        model: GovernmentProject,
        as: "projects",
        attributes: ["id", "application_id", "current_status", "farmer_name", "district"],
        limit: 10,
      },
    ],
  });

  if (!dealer) {
    throw new AppError(`Dealer not found with ID ${id}`, 404);
  }

  const totalProjects = await GovernmentProject.count({
    where: { dealer_id: id },
  });

  return {
    ...dealer.toJSON(),
    totalProjects,
  };
}

export async function createDealer({ name, commission_percentage, commission_basis, is_active = true }) {
  const normalized_name = normalizeDealerName(name);

  // Check if existing dealer with same normalized name
  const existing = await Dealer.findOne({ where: { normalized_name } });
  if (existing) {
    return existing;
  }

  const dealer = await Dealer.create({
    name: name.trim(),
    normalized_name,
    commission_percentage: commission_percentage || null,
    commission_basis: commission_basis || null,
    is_active,
  });

  return dealer;
}

export async function updateDealer(id, { name, commission_percentage, commission_basis, is_active }) {
  const dealer = await Dealer.findByPk(id);
  if (!dealer) {
    throw new AppError(`Dealer not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) {
    updates.name = name.trim();
    updates.normalized_name = normalizeDealerName(name);
  }
  if (commission_percentage !== undefined) updates.commission_percentage = commission_percentage;
  if (commission_basis !== undefined) updates.commission_basis = commission_basis;
  if (is_active !== undefined) updates.is_active = is_active;

  await dealer.update(updates);
  return dealer;
}
