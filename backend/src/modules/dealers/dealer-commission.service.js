import { Op } from "sequelize";
import DealerCommission from "./dealer-commission.model.js";
import Dealer from "./dealer.model.js";
import GovernmentProject from "../projects/project.model.js";
import AppError from "../../shared/appError.js";

/**
 * Calculate and record dealer commission for a project or sale
 */
export async function createDealerCommission({
  dealer_id,
  project_id = null,
  sale_id = null,
  base_amount,
  commission_percentage = null,
  status = "PENDING",
  notes = null,
}) {
  const dealer = await Dealer.findByPk(dealer_id);
  if (!dealer) {
    throw new AppError(`Dealer not found with ID ${dealer_id}`, 404);
  }

  const rate =
    commission_percentage !== null && commission_percentage !== undefined
      ? parseFloat(commission_percentage)
      : parseFloat(dealer.commission_percentage || 0);

  const base = parseFloat(base_amount);
  if (isNaN(base) || base <= 0) {
    throw new AppError("Base amount must be positive", 400);
  }

  const commissionAmount = parseFloat(((base * rate) / 100).toFixed(2));

  const commission = await DealerCommission.create({
    dealer_id: dealer.id,
    project_id: project_id || null,
    sale_id: sale_id || null,
    commission_percentage: rate,
    base_amount: base,
    commission_amount: commissionAmount,
    status,
    notes,
  });

  return commission;
}

/**
 * List commissions with filters and totals summary
 */
export async function listDealerCommissions({
  dealer_id,
  status,
  project_id,
  page = 1,
  limit = 50,
} = {}) {
  const where = {};
  if (dealer_id) where.dealer_id = dealer_id;
  if (status) where.status = status;
  if (project_id) where.project_id = project_id;

  const offset = (page - 1) * limit;

  const { rows, count } = await DealerCommission.findAndCountAll({
    where,
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
      {
        model: GovernmentProject,
        as: "project",
        attributes: ["id", "application_id", "farmer_name", "current_status"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  // Calculate summary totals
  const allCommissions = await DealerCommission.findAll({
    where,
    attributes: ["status", "commission_amount"],
  });

  const totals = {
    totalCommission: 0,
    pendingCommission: 0,
    approvedCommission: 0,
    paidCommission: 0,
  };

  for (const c of allCommissions) {
    const amt = parseFloat(c.commission_amount) || 0;
    totals.totalCommission += amt;
    if (c.status === "PENDING") totals.pendingCommission += amt;
    else if (c.status === "APPROVED") totals.approvedCommission += amt;
    else if (c.status === "PAID") totals.paidCommission += amt;
  }

  return {
    commissions: rows,
    totals,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Update commission status (e.g. APPROVED, PAID)
 */
export async function updateCommissionStatus(id, { status, paid_date, notes }) {
  const commission = await DealerCommission.findByPk(id);
  if (!commission) {
    throw new AppError(`Dealer commission not found with ID ${id}`, 404);
  }

  const updates = {};
  if (status) updates.status = status;
  if (paid_date !== undefined) updates.paid_date = paid_date;
  if (notes !== undefined) updates.notes = notes;

  if (status === "PAID" && !commission.paid_date && !paid_date) {
    updates.paid_date = new Date().toISOString().split("T")[0];
  }

  await commission.update(updates);
  return commission;
}
