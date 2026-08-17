import { Op } from "sequelize";
import Customer from "./customer.model.js";
import AppError from "../../shared/appError.js";

export async function listCustomers({ search, is_active, page = 1, limit = 50 } = {}) {
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

  const { rows, count } = await Customer.findAndCountAll({
    where,
    order: [["name", "ASC"]],
    limit,
    offset,
  });

  return {
    customers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getCustomerById(id) {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError(`Customer not found with ID ${id}`, 404);
  }
  return customer;
}

export async function createCustomer({ name, phone, email, address, gst_number, is_active = true }) {
  return await Customer.create({
    name: name.trim(),
    phone: phone ? phone.trim() : null,
    email: email ? email.trim() : null,
    address: address ? address.trim() : null,
    gst_number: gst_number ? gst_number.trim() : null,
    is_active,
  });
}

export async function updateCustomer(id, { name, phone, email, address, gst_number, is_active }) {
  const customer = await Customer.findByPk(id);
  if (!customer) {
    throw new AppError(`Customer not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone ? phone.trim() : null;
  if (email !== undefined) updates.email = email ? email.trim() : null;
  if (address !== undefined) updates.address = address ? address.trim() : null;
  if (gst_number !== undefined) updates.gst_number = gst_number ? gst_number.trim() : null;
  if (is_active !== undefined) updates.is_active = is_active;

  await customer.update(updates);
  return customer;
}
