import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentStatus from "../statuses/status.model.js";

/**
 * High-level government project metrics & distributions
 */
export async function getGovernmentSummary({ year, district, dealer_id } = {}) {
  const where = {};
  if (year) where.year = year;
  if (district) where.district = { [Op.iLike]: `%${district}%` };
  if (dealer_id) where.dealer_id = dealer_id;

  const totalProjects = await GovernmentProject.count({ where });

  if (totalProjects === 0) {
    return {
      totalProjects: 0,
      byStatus: [],
      byDistrict: [],
      byDealer: [],
      pendingProjects: 0,
    };
  }

  // 1. Status Distribution (Dynamic from DB)
  const statusStats = await GovernmentProject.findAll({
    where,
    attributes: [
      "current_status",
      [db.fn("COUNT", db.col("id")), "count"],
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
    ],
    group: ["current_status"],
    order: [[db.literal("count"), "DESC"]],
    raw: true,
  });

  const byStatus = statusStats.map((s) => {
    const count = parseInt(s.count, 10);
    return {
      status: s.current_status || "Unknown",
      count,
      percentage: parseFloat(((count / totalProjects) * 100).toFixed(2)),
      totalAreaHa: s.total_area_ha ? parseFloat(s.total_area_ha) : 0,
    };
  });

  // 2. District Distribution
  const districtStats = await GovernmentProject.findAll({
    where,
    attributes: [
      "district",
      [db.fn("COUNT", db.col("id")), "count"],
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
    ],
    group: ["district"],
    order: [[db.literal("count"), "DESC"]],
    limit: 15,
    raw: true,
  });

  const byDistrict = districtStats.map((d) => {
    const count = parseInt(d.count, 10);
    return {
      district: d.district || "Unspecified",
      count,
      percentage: parseFloat(((count / totalProjects) * 100).toFixed(2)),
      totalAreaHa: d.total_area_ha ? parseFloat(d.total_area_ha) : 0,
    };
  });

  // 3. Dealer Distribution
  const dealerStats = await GovernmentProject.findAll({
    where,
    attributes: [
      "dealer_id",
      [db.fn("COUNT", db.col("GovernmentProject.id")), "count"],
      [db.fn("SUM", db.col("quotation_subsidy_amount")), "total_subsidy_amount"],
      [db.fn("SUM", db.col("total_fund_released")), "total_fund_released"],
    ],
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name"],
      },
    ],
    group: ["dealer_id", "dealer.id", "dealer.name"],
    order: [[db.literal("count"), "DESC"]],
    limit: 15,
    raw: true,
  });

  const byDealer = dealerStats.map((d) => {
    const count = parseInt(d.count, 10);
    return {
      dealer_id: d.dealer_id || null,
      dealer_name: d["dealer.name"] || "Unassigned / Direct",
      count,
      percentage: parseFloat(((count / totalProjects) * 100).toFixed(2)),
      totalSubsidyAmount: d.total_subsidy_amount ? parseFloat(d.total_subsidy_amount) : 0,
      totalFundReleased: d.total_fund_released ? parseFloat(d.total_fund_released) : 0,
    };
  });

  // 4. Pending Projects (Projects not yet reached terminal completion)
  const completedStatuses = [
    "Final Fund Credited (UTR Updated)",
    "Iamwarm Fund Credited (UTR Updated)",
    "Rejected By State Agri / Horti",
  ];

  const pendingProjects = await GovernmentProject.count({
    where: {
      ...where,
      current_status: {
        [Op.notIn]: completedStatuses,
      },
    },
  });

  return {
    totalProjects,
    byStatus,
    byDistrict,
    byDealer,
    pendingProjects,
  };
}

/**
 * Status distribution breakdown with count and percentage
 */
export async function getStatusDistribution({ year, district, dealer_id } = {}) {
  const where = {};
  if (year) where.year = year;
  if (district) where.district = { [Op.iLike]: `%${district}%` };
  if (dealer_id) where.dealer_id = dealer_id;

  const totalProjects = await GovernmentProject.count({ where });
  if (totalProjects === 0) {
    return {
      totalProjects: 0,
      distribution: [],
    };
  }

  const rows = await GovernmentProject.findAll({
    where,
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

  const distribution = rows.map((r) => {
    const count = parseInt(r.count, 10);
    return {
      status: r.current_status || "Unknown",
      count,
      percentage: parseFloat(((count / totalProjects) * 100).toFixed(2)),
      totalAreaHa: r.total_area_ha ? parseFloat(r.total_area_ha) : 0,
      totalInvoiceAmount: r.total_invoice_amount ? parseFloat(r.total_invoice_amount) : 0,
      totalFundReleased: r.total_fund_released ? parseFloat(r.total_fund_released) : 0,
    };
  });

  return {
    totalProjects,
    distribution,
  };
}

/**
 * Dealer distribution breakdown
 */
export async function getDealerDistribution({ year, district } = {}) {
  const where = {};
  if (year) where.year = year;
  if (district) where.district = { [Op.iLike]: `%${district}%` };

  const totalProjects = await GovernmentProject.count({ where });
  if (totalProjects === 0) {
    return {
      totalProjects: 0,
      distribution: [],
    };
  }

  const rows = await GovernmentProject.findAll({
    where,
    attributes: [
      "dealer_id",
      [db.fn("COUNT", db.col("GovernmentProject.id")), "count"],
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
      [db.fn("SUM", db.col("quotation_subsidy_amount")), "total_subsidy_amount"],
      [db.fn("SUM", db.col("invoice_amount")), "total_invoice_amount"],
      [db.fn("SUM", db.col("total_fund_released")), "total_fund_released"],
    ],
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
    ],
    group: ["dealer_id", "dealer.id", "dealer.name", "dealer.commission_percentage"],
    order: [[db.literal("count"), "DESC"]],
    raw: true,
  });

  const distribution = rows.map((r) => {
    const count = parseInt(r.count, 10);
    return {
      dealer_id: r.dealer_id || null,
      dealer_name: r["dealer.name"] || "Unassigned",
      commission_percentage: r["dealer.commission_percentage"]
        ? parseFloat(r["dealer.commission_percentage"])
        : null,
      count,
      percentage: parseFloat(((count / totalProjects) * 100).toFixed(2)),
      totalAreaHa: r.total_area_ha ? parseFloat(r.total_area_ha) : 0,
      totalSubsidyAmount: r.total_subsidy_amount ? parseFloat(r.total_subsidy_amount) : 0,
      totalInvoiceAmount: r.total_invoice_amount ? parseFloat(r.total_invoice_amount) : 0,
      totalFundReleased: r.total_fund_released ? parseFloat(r.total_fund_released) : 0,
    };
  });

  return {
    totalProjects,
    distribution,
  };
}

/**
 * District distribution breakdown
 */
export async function getDistrictDistribution({ year, dealer_id } = {}) {
  const where = {};
  if (year) where.year = year;
  if (dealer_id) where.dealer_id = dealer_id;

  const totalProjects = await GovernmentProject.count({ where });
  if (totalProjects === 0) {
    return {
      totalProjects: 0,
      distribution: [],
    };
  }

  const rows = await GovernmentProject.findAll({
    where,
    attributes: [
      "district",
      [db.fn("COUNT", db.col("id")), "count"],
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
      [db.fn("SUM", db.col("quotation_subsidy_amount")), "total_subsidy_amount"],
      [db.fn("SUM", db.col("total_fund_released")), "total_fund_released"],
    ],
    group: ["district"],
    order: [[db.literal("count"), "DESC"]],
    raw: true,
  });

  const distribution = rows.map((r) => {
    const count = parseInt(r.count, 10);
    return {
      district: r.district || "Unspecified",
      count,
      percentage: parseFloat(((count / totalProjects) * 100).toFixed(2)),
      totalAreaHa: r.total_area_ha ? parseFloat(r.total_area_ha) : 0,
      totalSubsidyAmount: r.total_subsidy_amount ? parseFloat(r.total_subsidy_amount) : 0,
      totalFundReleased: r.total_fund_released ? parseFloat(r.total_fund_released) : 0,
    };
  });

  return {
    totalProjects,
    distribution,
  };
}

/**
 * Average stage durations computed strictly from observed status history transitions
 */
export async function getStageDurations() {
  const sql = `
    WITH transitions AS (
      SELECT 
        project_id,
        status AS from_status,
        status_date AS from_date,
        observed_at AS from_observed_at,
        LEAD(status) OVER (PARTITION BY project_id ORDER BY COALESCE(status_date, observed_at::date) ASC, observed_at ASC) AS to_status,
        LEAD(status_date) OVER (PARTITION BY project_id ORDER BY COALESCE(status_date, observed_at::date) ASC, observed_at ASC) AS to_date,
        LEAD(observed_at) OVER (PARTITION BY project_id ORDER BY COALESCE(status_date, observed_at::date) ASC, observed_at ASC) AS to_observed_at
      FROM government_project_status_history
    ),
    valid_transitions AS (
      SELECT
        from_status,
        to_status,
        CASE 
          WHEN from_date IS NOT NULL AND to_date IS NOT NULL AND to_date >= from_date 
            THEN (to_date - from_date)
          ELSE 
            EXTRACT(DAY FROM (to_observed_at - from_observed_at))::integer
        END AS duration_days
      FROM transitions
      WHERE to_status IS NOT NULL AND to_status != from_status
    )
    SELECT 
      from_status,
      to_status,
      COUNT(*)::integer AS count,
      ROUND(AVG(duration_days), 1)::float AS "averageDays",
      MIN(duration_days)::integer AS "minDays",
      MAX(duration_days)::integer AS "maxDays"
    FROM valid_transitions
    WHERE duration_days >= 0
    GROUP BY from_status, to_status
    ORDER BY count DESC;
  `;

  const results = await db.query(sql, { type: QueryTypes.SELECT });

  return {
    totalTransitions: results.reduce((acc, curr) => acc + curr.count, 0),
    stageDurations: results,
  };
}
