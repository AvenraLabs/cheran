import { Op } from "sequelize";
import db from "../../config/db.js";
import GovernmentProject from "./project.model.js";
import GovernmentProjectStatusHistory from "./project-history.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentImport from "../imports/import.model.js";
import AppError from "../../shared/appError.js";
import { calculateDaysBetween } from "../../utils/dates.js";

export async function listProjects(filters = {}) {
  const {
    status,
    district,
    block,
    village,
    dealer_id,
    year,
    farmer_name,
    application_id,
    search,
    page = 1,
    limit = 20,
    sort_by = "created_at",
    sort_order = "DESC",
  } = filters;

  const where = {};

  if (status) where.current_status = status;
  if (district) where.district = { [Op.iLike]: `%${district}%` };
  if (block) where.block = { [Op.iLike]: `%${block}%` };
  if (village) where.village = { [Op.iLike]: `%${village}%` };
  if (dealer_id) where.dealer_id = dealer_id;
  if (year) where.year = year;
  if (farmer_name) where.farmer_name = { [Op.iLike]: `%${farmer_name}%` };
  if (application_id) where.application_id = { [Op.iLike]: `%${application_id}%` };

  if (search) {
    where[Op.or] = [
      { application_id: { [Op.iLike]: `%${search}%` } },
      { farmer_name: { [Op.iLike]: `%${search}%` } },
      { mobile: { [Op.iLike]: `%${search}%` } },
      { village: { [Op.iLike]: `%${search}%` } },
      { block: { [Op.iLike]: `%${search}%` } },
      { district: { [Op.iLike]: `%${search}%` } },
      { survey_no_subdivision_no: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const allowedSortFields = [
    "created_at",
    "application_id",
    "farmer_name",
    "district",
    "current_status",
    "current_status_date",
    "total_area_ha",
    "invoice_amount",
    "total_fund_released",
  ];
  const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : "created_at";
  const safeSortOrder = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const offset = (page - 1) * limit;

  const { rows, count } = await GovernmentProject.findAndCountAll({
    where,
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "normalized_name", "commission_percentage"],
      },
    ],
    order: [[safeSortBy, safeSortOrder]],
    limit,
    offset,
  });

  return {
    projects: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getProjectById(id) {
  const project = await GovernmentProject.findByPk(id, {
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "normalized_name", "commission_percentage"],
      },
      {
        model: GovernmentProjectStatusHistory,
        as: "status_history",
        include: [
          {
            model: GovernmentImport,
            as: "source_import",
            attributes: ["id", "file_name", "uploaded_at"],
          },
        ],
      },
    ],
    order: [[{ model: GovernmentProjectStatusHistory, as: "status_history" }, "observed_at", "ASC"]],
  });

  if (!project) {
    throw new AppError(`Government Project not found with ID ${id}`, 404);
  }

  return project;
}

export async function getProjectStatusHistory(projectId) {
  const project = await GovernmentProject.findByPk(projectId, {
    attributes: ["id", "application_id", "farmer_name", "current_status"],
  });

  if (!project) {
    throw new AppError(`Government Project not found with ID ${projectId}`, 404);
  }

  const histories = await GovernmentProjectStatusHistory.findAll({
    where: { project_id: projectId },
    include: [
      {
        model: GovernmentImport,
        as: "source_import",
        attributes: ["id", "file_name", "uploaded_at"],
      },
    ],
    order: [
      ["status_date", "ASC"],
      ["observed_at", "ASC"],
    ],
  });

  // Calculate days between consecutive observed statuses
  const historyWithIntervals = histories.map((entry, index) => {
    const json = entry.toJSON();
    if (index === 0) {
      json.days_since_previous = 0;
      json.previous_status = null;
    } else {
      const prev = histories[index - 1];
      json.previous_status = prev.status;
      json.days_since_previous = calculateDaysBetween(prev.status_date, entry.status_date);
    }
    return json;
  });

  return {
    project,
    total_stages_observed: histories.length,
    history: historyWithIntervals,
  };
}

export async function getStatusSummaryStats() {
  const stats = await GovernmentProject.findAll({
    attributes: [
      "current_status",
      [db.fn("COUNT", db.col("id")), "count"],
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
      [db.fn("SUM", db.col("invoice_amount")), "total_invoice_amount"],
      [db.fn("SUM", db.col("total_fund_released")), "total_fund_released"],
    ],
    group: ["current_status"],
    order: [[db.literal("count"), "DESC"]],
    raw: true,
  });

  const totalProjects = stats.reduce((acc, row) => acc + parseInt(row.count, 10), 0);

  return {
    totalProjects,
    statusBreakdown: stats.map((row) => ({
      status: row.current_status,
      count: parseInt(row.count, 10),
      percentage: totalProjects > 0 ? ((parseInt(row.count, 10) / totalProjects) * 100).toFixed(2) : "0",
      total_area_ha: row.total_area_ha ? parseFloat(row.total_area_ha).toFixed(2) : "0.00",
      total_invoice_amount: row.total_invoice_amount ? parseFloat(row.total_invoice_amount).toFixed(2) : "0.00",
      total_fund_released: row.total_fund_released ? parseFloat(row.total_fund_released).toFixed(2) : "0.00",
    })),
  };
}

export async function getStageDurationStats() {
  // Query consecutive observed transitions using SQL window functions for accurate duration metrics
  const query = `
    WITH ordered_history AS (
      SELECT
        project_id,
        status,
        status_date,
        LAG(status) OVER (PARTITION BY project_id ORDER BY status_date ASC, observed_at ASC) as prev_status,
        LAG(status_date) OVER (PARTITION BY project_id ORDER BY status_date ASC, observed_at ASC) as prev_status_date
      FROM government_project_status_history
      WHERE status_date IS NOT NULL
    )
    SELECT
      prev_status as from_status,
      status as to_status,
      COUNT(*) as transition_count,
      ROUND(AVG(status_date - prev_status_date), 1) as avg_days,
      MIN(status_date - prev_status_date) as min_days,
      MAX(status_date - prev_status_date) as max_days
    FROM ordered_history
    WHERE prev_status IS NOT NULL AND prev_status_date IS NOT NULL AND status_date >= prev_status_date
    GROUP BY prev_status, status
    ORDER BY transition_count DESC;
  `;

  const [transitions] = await db.query(query);

  return {
    transitions: transitions || [],
  };
}
