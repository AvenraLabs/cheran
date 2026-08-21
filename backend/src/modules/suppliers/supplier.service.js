import { Op } from "sequelize";
import Supplier from "./supplier.model.js";
import AppError from "../../shared/appError.js";

export async function listSuppliers({ search, is_active, page = 1, limit = 50 } = {}) {
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { phone: { [Op.iLike]: `%${search.trim()}%` } },
      { gst_number: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }
  if (is_active !== undefined) where.is_active = is_active;

  const offset = (page - 1) * limit;

  const { rows, count } = await Supplier.findAndCountAll({
    where,
    order: [["name", "ASC"]],
    limit,
    offset,
  });

  return {
    suppliers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getSupplierOptions() {
  const suppliers = await Supplier.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "phone", "gst_number"],
    order: [["name", "ASC"]],
  });
  return { suppliers };
}

export async function getSupplierById(id) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    throw new AppError(`Supplier not found with ID ${id}`, 404);
  }
  return supplier;
}

export async function createSupplier({ name, phone, email, address, gst_number, is_active = true }) {
  const supplier = await Supplier.create({
    name: name.trim(),
    phone: phone ? phone.trim() : null,
    email: email ? email.trim() : null,
    address: address ? address.trim() : null,
    gst_number: gst_number ? gst_number.trim() : null,
    is_active,
  });

  return supplier;
}

export async function updateSupplier(id, { name, phone, email, address, gst_number, is_active }) {
  const supplier = await Supplier.findByPk(id);
  if (!supplier) {
    throw new AppError(`Supplier not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
  if (email !== undefined) updates.email = email ? email.trim() : null;
  if (address !== undefined) updates.address = address ? address.trim() : null;
  if (gst_number !== undefined) updates.gst_number = gst_number ? gst_number.trim() : null;
  if (is_active !== undefined) updates.is_active = is_active;

  await supplier.update(updates);
  return supplier;
}
