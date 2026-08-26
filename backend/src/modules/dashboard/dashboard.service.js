import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
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
      totalAreaHa: 0,
      totalFundsReleased: 0,
      totalInvoiceAmount: 0,
      totalSubsidyAmount: 0,
      byStatus: [],
      byDistrict: [],
      byDealer: [],
      pendingProjects: 0,
    };
  }

  // Global aggregate metrics
  const overallStats = await GovernmentProject.findOne({
    where,
    attributes: [
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
      [db.fn("SUM", db.col("total_fund_released")), "total_fund_released"],
      [db.fn("SUM", db.col("invoice_amount")), "total_invoice_amount"],
      [db.fn("SUM", db.col("quotation_subsidy_amount")), "total_subsidy_amount"],
    ],
    raw: true,
  });

  // 1. Status Distribution (Dynamic from DB)
  const statusStats = await GovernmentProject.findAll({
    where,
    attributes: [
      "current_status",
      [db.fn("COUNT", db.col("id")), "count"],
      [db.fn("SUM", db.col("total_area_ha")), "total_area_ha"],
      [db.fn("SUM", db.col("total_fund_released")), "total_fund_released"],
      [db.fn("SUM", db.col("invoice_amount")), "total_invoice_amount"],
      [db.fn("SUM", db.col("quotation_subsidy_amount")), "total_subsidy_amount"],
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
      totalFundReleased: s.total_fund_released ? parseFloat(s.total_fund_released) : 0,
      totalInvoiceAmount: s.total_invoice_amount ? parseFloat(s.total_invoice_amount) : 0,
      totalSubsidyAmount: s.total_subsidy_amount ? parseFloat(s.total_subsidy_amount) : 0,
    };
  });

  // 2. District Distribution (Excluding empty/null districts)
  const districtStats = await GovernmentProject.findAll({
    where: {
      ...where,
      district: {
        [Op.ne]: null,
        [Op.not]: "",
      },
    },
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

  const byDistrict = districtStats
    .filter((d) => d.district && d.district.trim() !== "")
    .map((d) => {
      const count = parseInt(d.count, 10);
      return {
        district: d.district.trim(),
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
    totalAreaHa: overallStats?.total_area_ha ? parseFloat(overallStats.total_area_ha) : 0,
    totalFundsReleased: overallStats?.total_fund_released ? parseFloat(overallStats.total_fund_released) : 0,
    totalInvoiceAmount: overallStats?.total_invoice_amount ? parseFloat(overallStats.total_invoice_amount) : 0,
    totalSubsidyAmount: overallStats?.total_subsidy_amount ? parseFloat(overallStats.total_subsidy_amount) : 0,
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
export async function getStageDurations(filters = {}) {
  const whereClauses = [];
  const replacements = {};

  if (filters.year) {
    whereClauses.push(`gp.year ILIKE :year`);
    replacements.year = `%${filters.year}%`;
  }
  if (filters.district) {
    whereClauses.push(`gp.district ILIKE :district`);
    replacements.district = `%${filters.district}%`;
  }
  if (filters.dealer_id) {
    whereClauses.push(`gp.dealer_id = :dealer_id`);
    replacements.dealer_id = filters.dealer_id;
  }

  const joinClause = whereClauses.length > 0
    ? `INNER JOIN government_projects gp ON gp.id = h.project_id WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    WITH transitions AS (
      SELECT 
        h.project_id,
        h.status AS from_status,
        h.status_date AS from_date,
        h.observed_at AS from_observed_at,
        LEAD(h.status) OVER (PARTITION BY h.project_id ORDER BY COALESCE(h.status_date, h.observed_at::date) ASC, h.observed_at ASC) AS to_status,
        LEAD(h.status_date) OVER (PARTITION BY h.project_id ORDER BY COALESCE(h.status_date, h.observed_at::date) ASC, h.observed_at ASC) AS to_date,
        LEAD(h.observed_at) OVER (PARTITION BY h.project_id ORDER BY COALESCE(h.status_date, h.observed_at::date) ASC, h.observed_at ASC) AS to_observed_at
      FROM government_project_status_history h
      ${joinClause}
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

  const results = await db.query(sql, { replacements, type: QueryTypes.SELECT });

  return {
    totalTransitions: results.reduce((acc, curr) => acc + curr.count, 0),
    stageDurations: results,
  };
}
