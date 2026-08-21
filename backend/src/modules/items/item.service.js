import { Op } from "sequelize";
import Item from "./item.model.js";
import Unit from "../units/unit.model.js";
import InventoryStock from "../inventory/inventory-stock.model.js";
import AppError from "../../shared/appError.js";

export function normalizeItemName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function listItems({ search, item_type, category, is_active, page = 1, limit = 50 } = {}) {
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { code: { [Op.iLike]: `%${search.trim()}%` } },
      { category: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }
  if (item_type) where.item_type = item_type;
  if (category) where.category = { [Op.iLike]: `%${category.trim()}%` };
  if (is_active !== undefined) where.is_active = is_active;

  const offset = (page - 1) * limit;

  const { rows, count } = await Item.findAndCountAll({
    where,
    include: [
      {
        model: Unit,
        as: "unit",
        attributes: ["id", "name", "symbol"],
      },
      {
        model: InventoryStock,
        as: "stock",
        attributes: ["quantity_on_hand", "updated_at"],
      },
    ],
    order: [["name", "ASC"]],
    limit,
    offset,
  });

  return {
    items: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getItemOptions({ item_type } = {}) {
  const where = { is_active: true };
  if (item_type) where.item_type = item_type;

  const items = await Item.findAll({
    where,
    attributes: ["id", "code", "name", "item_type", "unit_id", "category"],
    include: [{ model: Unit, as: "unit", attributes: ["id", "name", "symbol"] }],
    order: [["name", "ASC"]],
  });
  return { items };
}

export async function getItemById(id) {
  const item = await Item.findByPk(id, {
    include: [
      {
        model: Unit,
        as: "unit",
        attributes: ["id", "name", "symbol"],
      },
      {
        model: InventoryStock,
        as: "stock",
        attributes: ["quantity_on_hand", "updated_at"],
      },
    ],
  });

  if (!item) {
    throw new AppError(`Item not found with ID ${id}`, 404);
  }
  return item;
}

export async function createItem({ code, name, item_type = "FINISHED_GOOD", unit_id, category, unit_price = 0, is_active = true }) {
  const normalized_name = normalizeItemName(name);

  // Validate unit exists
  const unit = await Unit.findByPk(unit_id);
  if (!unit) {
    throw new AppError(`Unit not found with ID ${unit_id}`, 404);
  }

  // Check code uniqueness if provided
  if (code) {
    const existingCode = await Item.findOne({ where: { code: code.trim() } });
    if (existingCode) {
      throw new AppError(`Item with code '${code.trim()}' already exists`, 409);
    }
  }

  const item = await Item.create({
    code: code ? code.trim() : null,
    name: name.trim(),
    normalized_name,
    item_type,
    unit_id,
    category: category ? category.trim() : null,
    unit_price: unit_price ? parseFloat(unit_price) : 0.00,
    is_active,
  });

  // Create initial inventory stock record
  await InventoryStock.findOrCreate({
    where: { item_id: item.id },
    defaults: { item_id: item.id, quantity_on_hand: 0.0 },
  });

  return getItemById(item.id);
}

export async function updateItem(id, { code, name, item_type, unit_id, category, unit_price, is_active }) {
  const item = await Item.findByPk(id);
  if (!item) {
    throw new AppError(`Item not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) {
    updates.name = name.trim();
    updates.normalized_name = normalizeItemName(name);
  }
  if (code !== undefined) {
    if (code) {
      const existingCode = await Item.findOne({
        where: {
          code: code.trim(),
          id: { [Op.ne]: id },
        },
      });
      if (existingCode) {
        throw new AppError(`Item with code '${code.trim()}' already exists`, 409);
      }
      updates.code = code.trim();
    } else {
      updates.code = null;
    }
  }
  if (item_type !== undefined) updates.item_type = item_type;
  if (unit_id !== undefined) {
    const unit = await Unit.findByPk(unit_id);
    if (!unit) {
      throw new AppError(`Unit not found with ID ${unit_id}`, 404);
    }
    updates.unit_id = unit_id;
  }
  if (category !== undefined) updates.category = category ? category.trim() : null;
  if (unit_price !== undefined) updates.unit_price = unit_price !== null && unit_price !== "" ? parseFloat(unit_price) : 0.00;
  if (is_active !== undefined) updates.is_active = is_active;

  await item.update(updates);
  return getItemById(item.id);
}
