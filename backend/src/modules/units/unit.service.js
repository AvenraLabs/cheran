import { Op } from "sequelize";
import Unit from "./unit.model.js";
import AppError from "../../shared/appError.js";

export async function listUnits({ search, is_active } = {}) {
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { symbol: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }
  if (is_active !== undefined) {
    where.is_active = is_active;
  }

  const units = await Unit.findAll({
    where,
    order: [["name", "ASC"]],
  });

  return units;
}

export async function getUnitById(id) {
  const unit = await Unit.findByPk(id);
  if (!unit) {
    throw new AppError(`Unit not found with ID ${id}`, 404);
  }
  return unit;
}

export async function createUnit({ name, symbol, is_active = true }) {
  const cleanName = name.trim();
  const cleanSymbol = symbol ? symbol.trim().toUpperCase() : cleanName.toUpperCase();

  const existing = await Unit.findOne({
    where: dbWhereName(cleanName),
  });
  if (existing) {
    throw new AppError(`Unit '${cleanName}' already exists`, 409);
  }

  const unit = await Unit.create({
    name: cleanName,
    symbol: cleanSymbol,
    is_active,
  });

  return unit;
}

export async function updateUnit(id, { name, symbol, is_active }) {
  const unit = await Unit.findByPk(id);
  if (!unit) {
    throw new AppError(`Unit not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) {
    const cleanName = name.trim();
    const existing = await Unit.findOne({
      where: {
        ...dbWhereName(cleanName),
        id: { [Op.ne]: id },
      },
    });
    if (existing) {
      throw new AppError(`Unit '${cleanName}' already exists`, 409);
    }
    updates.name = cleanName;
    if (!symbol) updates.symbol = cleanName.toUpperCase();
  }
  if (symbol !== undefined && symbol !== null) {
    updates.symbol = symbol.trim().toUpperCase();
  }
  if (is_active !== undefined) updates.is_active = is_active;

  await unit.update(updates);
  return unit;
}

function dbWhereName(name) {
  return {
    name: { [Op.iLike]: name },
  };
}
