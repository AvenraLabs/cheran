import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentStatus from "../statuses/status.model.js";

/**
 * Extract Financial Year STRICTLY from Application ID:
 * Primary examples:
 * - A-DPR-KRM-5360643095-2026-27 -> 2026-2027
 * - H-KGI-BGR-5549687254-2022-23 -> 2022-2023
 * The only source of truth is the Application ID ending year.
 */
export const FINANCIAL_YEAR_SQL_EXPRESSION = `
  CASE
    -- 1. application_id ends with -YYYY-YY (e.g. -2026-27 or -2022-23)
    WHEN "GovernmentProject"."application_id" ~ '-(20[0-9]{2})-([0-9]{2})$' THEN 
      CASE 
        WHEN (2000 + ((regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-([0-9]{2})$'))[2])::INTEGER) <= ((regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-([0-9]{2})$'))[1])::INTEGER THEN
          CONCAT(
            (regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-([0-9]{2})$'))[1],
            '-',
            (((regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-([0-9]{2})$'))[1])::INTEGER + 1)::TEXT
          )
        ELSE
          CONCAT(
            (regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-([0-9]{2})$'))[1],
            '-',
            (2000 + ((regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-([0-9]{2})$'))[2])::INTEGER)::TEXT
          )
      END

    -- 2. application_id ends with -YYYY-YYYY (e.g. -2026-2027)
    WHEN "GovernmentProject"."application_id" ~ '-(20[0-9]{2})-(20[0-9]{2})$' THEN 
      CONCAT(
        (regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-(20[0-9]{2})$'))[1],
        '-',
        (regexp_match("GovernmentProject"."application_id", '-(20[0-9]{2})-(20[0-9]{2})$'))[2]
      )

    -- 3. Any -YYYY-YY anywhere in ID
    WHEN "GovernmentProject"."application_id" ~ '(20[0-9]{2})-([0-9]{2})' THEN
      CONCAT(
        (regexp_match("GovernmentProject"."application_id", '(20[0-9]{2})-([0-9]{2})'))[1],
        '-',
        (2000 + ((regexp_match("GovernmentProject"."application_id", '(20[0-9]{2})-([0-9]{2})'))[2])::INTEGER)::TEXT
      )

    -- 4. Any -YYYY-YYYY anywhere in ID
    WHEN "GovernmentProject"."application_id" ~ '(20[0-9]{2})-(20[0-9]{2})' THEN
      CONCAT(
        (regexp_match("GovernmentProject"."application_id", '(20[0-9]{2})-(20[0-9]{2})'))[1],
        '-',
        (regexp_match("GovernmentProject"."application_id", '(20[0-9]{2})-(20[0-9]{2})'))[2]
      )

    ELSE 'Unknown'
  END
`;

export const FINANCIAL_YEAR_SQL_EXPRESSION_GP = `
  CASE
    -- 1. application_id ends with -YYYY-YY (e.g. -2026-27 or -2022-23)
    WHEN gp.application_id ~ '-(20[0-9]{2})-([0-9]{2})$' THEN 
      CASE 
        WHEN (2000 + ((regexp_match(gp.application_id, '-(20[0-9]{2})-([0-9]{2})$'))[2])::INTEGER) <= ((regexp_match(gp.application_id, '-(20[0-9]{2})-([0-9]{2})$'))[1])::INTEGER THEN
          CONCAT(
            (regexp_match(gp.application_id, '-(20[0-9]{2})-([0-9]{2})$'))[1],
            '-',
            (((regexp_match(gp.application_id, '-(20[0-9]{2})-([0-9]{2})$'))[1])::INTEGER + 1)::TEXT
          )
        ELSE
          CONCAT(
            (regexp_match(gp.application_id, '-(20[0-9]{2})-([0-9]{2})$'))[1],
            '-',
            (2000 + ((regexp_match(gp.application_id, '-(20[0-9]{2})-([0-9]{2})$'))[2])::INTEGER)::TEXT
          )
      END

    -- 2. application_id ends with -YYYY-YYYY (e.g. -2026-2027)
    WHEN gp.application_id ~ '-(20[0-9]{2})-(20[0-9]{2})$' THEN 
      CONCAT(
        (regexp_match(gp.application_id, '-(20[0-9]{2})-(20[0-9]{2})$'))[1],
        '-',
        (regexp_match(gp.application_id, '-(20[0-9]{2})-(20[0-9]{2})$'))[2]
      )

    -- 3. Any -YYYY-YY anywhere in ID
    WHEN gp.application_id ~ '(20[0-9]{2})-([0-9]{2})' THEN
      CONCAT(
        (regexp_match(gp.application_id, '(20[0-9]{2})-([0-9]{2})'))[1],
        '-',
        (2000 + ((regexp_match(gp.application_id, '(20[0-9]{2})-([0-9]{2})'))[2])::INTEGER)::TEXT
      )

    -- 4. Any -YYYY-YYYY anywhere in ID
    WHEN gp.application_id ~ '(20[0-9]{2})-(20[0-9]{2})' THEN
      CONCAT(
        (regexp_match(gp.application_id, '(20[0-9]{2})-(20[0-9]{2})'))[1],
        '-',
        (regexp_match(gp.application_id, '(20[0-9]{2})-(20[0-9]{2})'))[2]
      )

    ELSE 'Unknown'
  END
`;

/**
 * Build Dashboard where clause strictly using ID-based Financial Year
 */
function buildDashboardWhere({ year, district, dealer_id } = {}) {
  const where = {};
  if (district && district.trim() !== "") {
    where.district = { [Op.iLike]: `%${district.trim()}%` };
  }
  if (dealer_id && dealer_id !== "ALL") {
    if (dealer_id === "UNASSIGNED") {
      where.dealer_id = null;
    } else {
      where.dealer_id = dealer_id;
    }
  }

  if (year && year !== "ALL") {
    const cleanYear = year.trim().replace(/'/g, "''");
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push(
      db.literal(`(${FINANCIAL_YEAR_SQL_EXPRESSION} = '${cleanYear}')`)
    );
  }

  return where;
}

/**
 * High-level government project metrics & distributions
 */
export async function getGovernmentSummary(params = {}) {
  const where = buildDashboardWhere(params);

  const totalProjects = await GovernmentProject.count({ where });

  // Fetch available distinct financial years parsed strictly from actual Application IDs in DB
  const yearsRes = await db.query(
    `SELECT DISTINCT (${FINANCIAL_YEAR_SQL_EXPRESSION}) AS y 
     FROM government_projects "GovernmentProject"
     WHERE "GovernmentProject"."application_id" IS NOT NULL
     ORDER BY y DESC;`,
    { type: QueryTypes.SELECT }
  ).catch(() => []);

  const availableYears = yearsRes
    .map((r) => r.y)
    .filter((y) => y && y !== "Unknown");

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
      availableYears,
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

  // 1. Status Distribution (Ordered strictly by government workflow sequence_order)
  const whereClauses = [];
  const replacements = {};

  if (params.year && params.year !== "ALL") {
    whereClauses.push(`(${FINANCIAL_YEAR_SQL_EXPRESSION_GP}) = :year`);
    replacements.year = params.year;
  }
  if (params.district && params.district.trim() !== "") {
    whereClauses.push(`gp.district ILIKE :district`);
    replacements.district = `%${params.district.trim()}%`;
  }
  if (params.dealer_id && params.dealer_id !== "ALL") {
    if (params.dealer_id === "UNASSIGNED") {
      whereClauses.push(`gp.dealer_id IS NULL`);
    } else {
      whereClauses.push(`gp.dealer_id = :dealer_id`);
      replacements.dealer_id = params.dealer_id;
    }
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const statusStats = await db.query(
    `SELECT 
       gp.current_status,
       COUNT(gp.id)::integer AS count,
       COALESCE(SUM(gp.total_area_ha), 0)::float AS total_area_ha,
       COALESCE(SUM(gp.total_fund_released), 0)::float AS total_fund_released,
       COALESCE(SUM(gp.invoice_amount), 0)::float AS total_invoice_amount,
       COALESCE(SUM(gp.quotation_subsidy_amount), 0)::float AS total_subsidy_amount,
       COALESCE(gs.sequence_order, 999)::integer AS seq
     FROM government_projects gp
     LEFT JOIN government_statuses gs ON gp.current_status = gs.name
     ${whereSql}
     GROUP BY gp.current_status, gs.sequence_order
     ORDER BY seq ASC, count DESC;`,
    { replacements, type: QueryTypes.SELECT }
  );

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
    availableYears,
  };
}

/**
 * Status distribution breakdown strictly ordered by workflow sequence
 */
export async function getStatusDistribution(params = {}) {
  const whereClauses = [];
  const replacements = {};

  if (params.year && params.year !== "ALL") {
    whereClauses.push(`(${FINANCIAL_YEAR_SQL_EXPRESSION_GP}) = :year`);
    replacements.year = params.year;
  }
  if (params.district && params.district.trim() !== "") {
    whereClauses.push(`gp.district ILIKE :district`);
    replacements.district = `%${params.district.trim()}%`;
  }
  if (params.dealer_id && params.dealer_id !== "ALL") {
    if (params.dealer_id === "UNASSIGNED") {
      whereClauses.push(`gp.dealer_id IS NULL`);
    } else {
      whereClauses.push(`gp.dealer_id = :dealer_id`);
      replacements.dealer_id = params.dealer_id;
    }
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const rows = await db.query(
    `SELECT 
       gp.current_status,
       COUNT(gp.id)::integer AS count,
       COALESCE(SUM(gp.total_area_ha), 0)::float AS total_area_ha,
       COALESCE(SUM(gp.total_fund_released), 0)::float AS total_fund_released,
       COALESCE(SUM(gp.invoice_amount), 0)::float AS total_invoice_amount,
       COALESCE(gs.sequence_order, 999)::integer AS seq
     FROM government_projects gp
     LEFT JOIN government_statuses gs ON gp.current_status = gs.name
     ${whereSql}
     GROUP BY gp.current_status, gs.sequence_order
     ORDER BY seq ASC, count DESC;`,
    { replacements, type: QueryTypes.SELECT }
  );

  const totalProjects = rows.reduce((acc, r) => acc + (parseInt(r.count, 10) || 0), 0);

  const distribution = rows.map((r) => {
    const count = parseInt(r.count, 10);
    return {
      status: r.current_status || "Unknown",
      count,
      percentage: totalProjects > 0 ? parseFloat(((count / totalProjects) * 100).toFixed(2)) : 0,
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
export async function getDealerDistribution(params = {}) {
  const where = buildDashboardWhere(params);

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
export async function getDistrictDistribution(params = {}) {
  const where = buildDashboardWhere(params);

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
 * Stage Transition Speeds computed strictly for the 3 core business milestones:
 * 1. Issue Work Order -> INVOICED (Material Preparation)
 * 2. INVOICED -> Work Completed / Work Completion Approved (1st Fund Commission Milestone)
 * 3. First Fund Credited -> Joint Verification Completed (2nd Fund Commission Milestone)
 */
export async function getStageDurations(filters = {}) {
  const whereClauses = [];
  const replacements = {};

  if (filters.year && filters.year !== "ALL") {
    whereClauses.push(`(${FINANCIAL_YEAR_SQL_EXPRESSION_GP}) = :year`);
    replacements.year = filters.year;
  }

  if (filters.district && filters.district.trim() !== "") {
    whereClauses.push(`gp.district ILIKE :district`);
    replacements.district = `%${filters.district.trim()}%`;
  }
  if (filters.dealer_id && filters.dealer_id !== "ALL") {
    if (filters.dealer_id === "UNASSIGNED") {
      whereClauses.push(`gp.dealer_id IS NULL`);
    } else {
      whereClauses.push(`gp.dealer_id = :dealer_id`);
      replacements.dealer_id = filters.dealer_id;
    }
  }

  const joinClause = whereClauses.length > 0
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    WITH project_milestones AS (
      SELECT 
        gp.id AS project_id,
        gp.application_id,
        
        -- 1. Issue Work Order Date
        MIN(CASE WHEN h.status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') THEN COALESCE(h.status_date, h.observed_at::date) END) AS wo_date,
        
        -- 2. Invoiced Date
        MIN(CASE WHEN h.status = 'INVOICED' THEN COALESCE(h.status_date, h.observed_at::date) END) AS inv_date,
        
        -- 3. Work Completion Date
        MIN(CASE WHEN h.status IN ('Work Completed', 'Work Completion Approved') THEN COALESCE(h.status_date, h.observed_at::date) END) AS wc_date,
        
        -- 4. 1st Fund Credited Date
        MIN(CASE WHEN h.status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)') THEN COALESCE(h.status_date, h.observed_at::date) END) AS fund1_date,
        
        -- 5. Joint Verification Date
        MIN(CASE WHEN h.status IN ('Joint Verification Completed', 'Earlier JV Completed') THEN COALESCE(h.status_date, h.observed_at::date) END) AS jv_date
        
      FROM government_projects gp
      INNER JOIN government_project_status_history h ON h.project_id = gp.id
      ${joinClause}
      GROUP BY gp.id, gp.application_id
    )
    SELECT 
      -- Milestone 1: Issue Work Order -> INVOICED
      COUNT(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN 1 END)::integer AS count_1,
      ROUND(AVG(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN (inv_date - wo_date) END), 1)::float AS avg_1,
      MIN(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN (inv_date - wo_date) END)::integer AS min_1,
      MAX(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN (inv_date - wo_date) END)::integer AS max_1,

      -- Milestone 2: INVOICED -> Work Completion
      COUNT(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN 1 END)::integer AS count_2,
      ROUND(AVG(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN (wc_date - inv_date) END), 1)::float AS avg_2,
      MIN(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN (wc_date - inv_date) END)::integer AS min_2,
      MAX(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN (wc_date - inv_date) END)::integer AS max_2,

      -- Milestone 3: First Fund Credited -> Joint Verification
      COUNT(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN 1 END)::integer AS count_3,
      ROUND(AVG(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN (jv_date - fund1_date) END), 1)::float AS avg_3,
      MIN(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN (jv_date - fund1_date) END)::integer AS min_3,
      MAX(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN (jv_date - fund1_date) END)::integer AS max_3

    FROM project_milestones;
  `;

  const rows = await db.query(sql, { replacements, type: QueryTypes.SELECT });
  const row = rows[0] || {};

  const stageDurations = [
    {
      from_status: "Issued Work Order",
      to_status: "INVOICED",
      stage_label: "Work Order → Invoiced (Material Supply)",
      sub_label: "Company Invoicing Speed",
      count: row.count_1 || 0,
      averageDays: row.avg_1 || 0,
      minDays: row.min_1 || 0,
      maxDays: row.max_1 || 0,
    },
    {
      from_status: "INVOICED",
      to_status: "Work Completed",
      stage_label: "Invoiced → Work Completed / Approved",
      sub_label: "Dealer Field Completion (1st Fund Commission)",
      count: row.count_2 || 0,
      averageDays: row.avg_2 || 0,
      minDays: row.min_2 || 0,
      maxDays: row.max_2 || 0,
    },
    {
      from_status: "First Fund Credited",
      to_status: "Joint Verification Completed",
      stage_label: "1st Fund Credited → Joint Verification",
      sub_label: "Dealer JV Speed (2nd Fund Commission)",
      count: row.count_3 || 0,
      averageDays: row.avg_3 || 0,
      minDays: row.min_3 || 0,
      maxDays: row.max_3 || 0,
    },
  ];

  const totalTransitions = (row.count_1 || 0) + (row.count_2 || 0) + (row.count_3 || 0);

  return {
    totalTransitions,
    stageDurations,
  };
}
