import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentStatus from "../statuses/status.model.js";
import MaterialSuppliedOverride from "./material-supplied-override.model.js";

/**
 * Categorize application ID according to Tamil Nadu government scheme conventions:
 * - Agriculture: Starts with 'A' (includes 'A-...', 'AK...')
 * - Horticulture: Starts with 'H' (includes 'H-...', 'HK...')
 * - Sugarcane: Starts with 'S' (e.g., 'S-...')
 */
export const CATEGORY_SQL_EXPRESSION = `
  CASE 
    WHEN gp.application_id ILIKE 'A%' THEN 'Agriculture'
    WHEN gp.application_id ILIKE 'H%' THEN 'Horticulture'
    WHEN gp.application_id ILIKE 'S%' THEN 'Sugarcane'
    ELSE 'Sugarcane'
  END
`;

/**
 * Extract Financial Year STRICTLY from Application ID:
 * Primary examples:
 * - A-DPR-KRM-5360643095-2026-27 -> 2026-2027
 * - H-KGI-BGR-5549687254-2022-23 -> 2022-2023
 * The only source of truth is the Application ID.
 */
export const FINANCIAL_YEAR_SQL_EXPRESSION = `
  COALESCE(
    gp.year,
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
  )
`;

/**
 * 1. Get Pending Funnel Summary aggregated by Category and Financial Year
 */
export async function getPendingFunnelSummary({ year, dealer_id, district } = {}) {
  let whereClauses = [];
  const replacements = {};

  if (year && year !== "ALL") {
    whereClauses.push(`(${FINANCIAL_YEAR_SQL_EXPRESSION}) = :year`);
    replacements.year = year;
  }
  if (dealer_id && dealer_id !== "ALL") {
    if (dealer_id === "UNASSIGNED") {
      whereClauses.push("gp.dealer_id IS NULL");
    } else {
      whereClauses.push("gp.dealer_id = :dealer_id");
      replacements.dealer_id = dealer_id;
    }
  }
  if (district && district !== "ALL") {
    whereClauses.push("gp.district ILIKE :district");
    replacements.district = `%${district}%`;
  }

  const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const query = `
    WITH categorized AS (
      SELECT 
        gp.id,
        gp.application_id,
        (${FINANCIAL_YEAR_SQL_EXPRESSION}) as year,
        ${CATEGORY_SQL_EXPRESSION} as category,
        COALESCE(gp.applied_area_ha, 0)::float as applied_area_ha,
        gp.current_status,
        COALESCE(gs.sequence_order, 999) as seq,
        CASE 
          WHEN gp.work_order_date IS NOT NULL OR gp.work_order_no IS NOT NULL OR gp.current_status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') OR COALESCE(gs.sequence_order, 0) >= 21 
          THEN 1 ELSE 0 
        END as is_wo_issued,
        CASE 
          WHEN COALESCE(gs.sequence_order, 0) >= 26 
          THEN 1 ELSE 0 
        END as is_invoiced,
        CASE 
          WHEN COALESCE(gs.sequence_order, 0) >= 26 
          THEN 1 ELSE 0 
        END as is_work_completed,
        CASE 
          WHEN gp.first_fund_utr_date IS NOT NULL OR COALESCE(gs.sequence_order, 0) >= 48 OR gp.current_status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)', 'First Fund Proceeding Completed')
          THEN 1 ELSE 0 
        END as is_fund1_credited,
        CASE 
          WHEN COALESCE(gs.sequence_order, 0) >= 52 OR gp.current_status IN ('Joint Verification Completed', 'Earlier JV Completed')
          THEN 1 ELSE 0 
        END as is_jv_completed
      FROM government_projects gp
      LEFT JOIN government_statuses gs ON gp.current_status = gs.name
      ${whereSql}
    )
    SELECT 
      category,
      year,
      COUNT(*)::integer as total_projects,
      COALESCE(SUM(applied_area_ha), 0)::float as total_ha,
      
      -- Work Order Issued
      SUM(CASE WHEN is_wo_issued = 1 THEN 1 ELSE 0 END)::integer as wo_count,
      COALESCE(SUM(CASE WHEN is_wo_issued = 1 THEN applied_area_ha ELSE 0 END), 0)::float as wo_ha,
      
      -- Material Supplied (Invoiced)
      SUM(CASE WHEN is_invoiced = 1 THEN 1 ELSE 0 END)::integer as invoiced_count,
      COALESCE(SUM(CASE WHEN is_invoiced = 1 THEN applied_area_ha ELSE 0 END), 0)::float as invoiced_ha,
      
      -- Work Completed
      SUM(CASE WHEN is_work_completed = 1 THEN 1 ELSE 0 END)::integer as wc_count,
      COALESCE(SUM(CASE WHEN is_work_completed = 1 THEN applied_area_ha ELSE 0 END), 0)::float as wc_ha,

      -- First Fund Credited
      SUM(CASE WHEN is_fund1_credited = 1 THEN 1 ELSE 0 END)::integer as fund1_count,
      COALESCE(SUM(CASE WHEN is_fund1_credited = 1 THEN applied_area_ha ELSE 0 END), 0)::float as fund1_ha,

      -- Joint Verification Completed
      SUM(CASE WHEN is_jv_completed = 1 THEN 1 ELSE 0 END)::integer as jv_count,
      COALESCE(SUM(CASE WHEN is_jv_completed = 1 THEN applied_area_ha ELSE 0 END), 0)::float as jv_ha
      
    FROM categorized
    GROUP BY category, year
    ORDER BY category, year
  `;

  const rows = await db.query(query, {
    replacements,
    type: QueryTypes.SELECT,
  });

  // Query all available distinct financial years strictly from actual Application IDs in database
  const distinctYearsRows = await db.query(
    `
      SELECT DISTINCT (${FINANCIAL_YEAR_SQL_EXPRESSION}) as year
      FROM government_projects gp
      WHERE gp.application_id IS NOT NULL
      ORDER BY year DESC
    `,
    { type: QueryTypes.SELECT }
  );

  const availableYears = distinctYearsRows
    .map((r) => r.year)
    .filter((y) => y && y !== "Unknown");

  // Calculate pendencies and build Category structure
  const categoriesMap = {
    Agriculture: { name: "Agriculture", prefix: "A / AK", years: [], totals: null },
    Horticulture: { name: "Horticulture", prefix: "H / HK", years: [], totals: null },
    Sugarcane: { name: "Sugarcane", prefix: "S", years: [], totals: null },
  };

  // Load manual Material Supplied user inputs
  const overrides = await MaterialSuppliedOverride.findAll({ raw: true });
  const overridesMap = {};
  for (const o of overrides) {
    overridesMap[`${o.category}_${o.financial_year}`] = o;
  }

  const grandTotals = {
    total_projects: 0,
    total_ha: 0,
    wo_count: 0,
    wo_ha: 0,
    invoiced_count: 0,
    invoiced_ha: 0,
    mat_pendency_count: 0,
    mat_pendency_ha: 0,
    wc_count: 0,
    wc_ha: 0,
    wc_pendency_count: 0,
    wc_pendency_ha: 0,
    fund1_count: 0,
    fund1_ha: 0,
    jv_count: 0,
    jv_ha: 0,
    jvr_pendency_count: 0,
    jvr_pendency_ha: 0,
  };

  // Helper to init empty total accumulator
  const createEmptyTotal = () => ({
    total_projects: 0,
    total_ha: 0,
    wo_count: 0,
    wo_ha: 0,
    invoiced_count: 0,
    invoiced_ha: 0,
    mat_pendency_count: 0,
    mat_pendency_ha: 0,
    wc_count: 0,
    wc_ha: 0,
    wc_pendency_count: 0,
    wc_pendency_ha: 0,
    fund1_count: 0,
    fund1_ha: 0,
    jv_count: 0,
    jv_ha: 0,
    jvr_pendency_count: 0,
    jvr_pendency_ha: 0,
  });

  Object.keys(categoriesMap).forEach((catKey) => {
    categoriesMap[catKey].totals = createEmptyTotal();
  });

  for (const row of rows) {
    const catKey = categoriesMap[row.category] ? row.category : "Sugarcane";

    const woCount = parseInt(row.wo_count, 10) || 0;
    const woHa = parseFloat(row.wo_ha) || 0;

    // Look up manual Material Supplied input for this category and financial year
    const overrideKey = `${catKey}_${row.year}`;
    const manualOverride = overridesMap[overrideKey];

    const invCount = manualOverride ? parseInt(manualOverride.supplied_count, 10) || 0 : 0;
    const invHa = manualOverride ? parseFloat(manualOverride.supplied_ha) || 0 : 0.0;

    const wcCount = parseInt(row.wc_count, 10) || 0;
    const wcHa = parseFloat(row.wc_ha) || 0;
    const fund1Count = parseInt(row.fund1_count, 10) || 0;
    const fund1Ha = parseFloat(row.fund1_ha) || 0;
    const jvCount = parseInt(row.jv_count, 10) || 0;
    const jvHa = parseFloat(row.jv_ha) || 0;

    // Material supply pendency = Work Orders Issued - Material Supplied
    const matPendCount = Math.max(0, woCount - invCount);
    const matPendHa = Math.max(0, parseFloat((woHa - invHa).toFixed(4)));

    // Work completion pendency = Material Supplied - Work Completed
    const wcPendCount = Math.max(0, invCount - wcCount);
    const wcPendHa = Math.max(0, parseFloat((invHa - wcHa).toFixed(4)));

    // Joint verification pendency = Fund1 Credited - JV Completed
    const jvrPendCount = Math.max(0, fund1Count - jvCount);
    const jvrPendHa = Math.max(0, parseFloat((fund1Ha - jvHa).toFixed(4)));

    const yearSummary = {
      year: row.year,
      total_projects: parseInt(row.total_projects, 10) || 0,
      total_ha: parseFloat(parseFloat(row.total_ha).toFixed(2)),
      wo_count: woCount,
      wo_ha: parseFloat(woHa.toFixed(2)),
      invoiced_count: invCount,
      invoiced_ha: parseFloat(invHa.toFixed(2)),
      mat_pendency_count: matPendCount,
      mat_pendency_ha: parseFloat(matPendHa.toFixed(2)),
      wc_count: wcCount,
      wc_ha: parseFloat(wcHa.toFixed(2)),
      wc_pendency_count: wcPendCount,
      wc_pendency_ha: parseFloat(wcPendHa.toFixed(2)),
      fund1_count: fund1Count,
      fund1_ha: parseFloat(fund1Ha.toFixed(2)),
      jv_count: jvCount,
      jv_ha: parseFloat(jvHa.toFixed(2)),
      jvr_pendency_count: jvrPendCount,
      jvr_pendency_ha: parseFloat(jvrPendHa.toFixed(2)),
      has_manual_override: !!manualOverride,
      manual_override_remarks: manualOverride?.remarks || null,
    };

    categoriesMap[catKey].years.push(yearSummary);

    // Accumulate Category Subtotals
    const catTot = categoriesMap[catKey].totals;
    catTot.total_projects += yearSummary.total_projects;
    catTot.total_ha += yearSummary.total_ha;
    catTot.wo_count += yearSummary.wo_count;
    catTot.wo_ha += yearSummary.wo_ha;
    catTot.invoiced_count += yearSummary.invoiced_count;
    catTot.invoiced_ha += yearSummary.invoiced_ha;
    catTot.mat_pendency_count += yearSummary.mat_pendency_count;
    catTot.mat_pendency_ha += yearSummary.mat_pendency_ha;
    catTot.wc_count += yearSummary.wc_count;
    catTot.wc_ha += yearSummary.wc_ha;
    catTot.wc_pendency_count += yearSummary.wc_pendency_count;
    catTot.wc_pendency_ha += yearSummary.wc_pendency_ha;
    catTot.fund1_count += yearSummary.fund1_count;
    catTot.fund1_ha += yearSummary.fund1_ha;
    catTot.jv_count += yearSummary.jv_count;
    catTot.jv_ha += yearSummary.jv_ha;
    catTot.jvr_pendency_count += yearSummary.jvr_pendency_count;
    catTot.jvr_pendency_ha += yearSummary.jvr_pendency_ha;

    // Accumulate Grand Totals
    grandTotals.total_projects += yearSummary.total_projects;
    grandTotals.total_ha += yearSummary.total_ha;
    grandTotals.wo_count += yearSummary.wo_count;
    grandTotals.wo_ha += yearSummary.wo_ha;
    grandTotals.invoiced_count += yearSummary.invoiced_count;
    grandTotals.invoiced_ha += yearSummary.invoiced_ha;
    grandTotals.mat_pendency_count += yearSummary.mat_pendency_count;
    grandTotals.mat_pendency_ha += yearSummary.mat_pendency_ha;
    grandTotals.wc_count += yearSummary.wc_count;
    grandTotals.wc_ha += yearSummary.wc_ha;
    grandTotals.wc_pendency_count += yearSummary.wc_pendency_count;
    grandTotals.wc_pendency_ha += yearSummary.wc_pendency_ha;
    grandTotals.fund1_count += yearSummary.fund1_count;
    grandTotals.fund1_ha += yearSummary.fund1_ha;
    grandTotals.jv_count += yearSummary.jv_count;
    grandTotals.jv_ha += yearSummary.jv_ha;
    grandTotals.jvr_pendency_count += yearSummary.jvr_pendency_count;
    grandTotals.jvr_pendency_ha += yearSummary.jvr_pendency_ha;
  }

  // Format category totals and pendencies
  Object.keys(categoriesMap).forEach((catKey) => {
    const t = categoriesMap[catKey].totals;
    t.total_ha = parseFloat(t.total_ha.toFixed(2));
    t.wo_ha = parseFloat(t.wo_ha.toFixed(2));
    t.invoiced_ha = parseFloat(t.invoiced_ha.toFixed(2));
    t.mat_pendency_ha = Math.max(0, parseFloat((t.wo_ha - t.invoiced_ha).toFixed(2)));
    t.mat_pendency_count = Math.max(0, t.wo_count - t.invoiced_count);
    t.wc_ha = parseFloat(t.wc_ha.toFixed(2));
    t.wc_pendency_ha = Math.max(0, parseFloat((t.invoiced_ha - t.wc_ha).toFixed(2)));
    t.wc_pendency_count = Math.max(0, t.invoiced_count - t.wc_count);
    t.fund1_ha = parseFloat(t.fund1_ha.toFixed(2));
    t.jv_ha = parseFloat(t.jv_ha.toFixed(2));
    t.jvr_pendency_ha = parseFloat(t.jvr_pendency_ha.toFixed(2));
  });

  // Format grand totals and pendencies
  grandTotals.total_ha = parseFloat(grandTotals.total_ha.toFixed(2));
  grandTotals.wo_ha = parseFloat(grandTotals.wo_ha.toFixed(2));
  grandTotals.invoiced_ha = parseFloat(grandTotals.invoiced_ha.toFixed(2));
  grandTotals.mat_pendency_ha = Math.max(0, parseFloat((grandTotals.wo_ha - grandTotals.invoiced_ha).toFixed(2)));
  grandTotals.mat_pendency_count = Math.max(0, grandTotals.wo_count - grandTotals.invoiced_count);
  grandTotals.wc_ha = parseFloat(grandTotals.wc_ha.toFixed(2));
  grandTotals.wc_pendency_ha = Math.max(0, parseFloat((grandTotals.invoiced_ha - grandTotals.wc_ha).toFixed(2)));
  grandTotals.wc_pendency_count = Math.max(0, grandTotals.invoiced_count - grandTotals.wc_count);
  grandTotals.fund1_ha = parseFloat(grandTotals.fund1_ha.toFixed(2));
  grandTotals.jv_ha = parseFloat(grandTotals.jv_ha.toFixed(2));
  grandTotals.jvr_pendency_ha = parseFloat(grandTotals.jvr_pendency_ha.toFixed(2));

  // Extract all-categories direct overrides if any
  const allOverrides = {};
  for (const o of overrides) {
    if (o.category === "ALL") {
      allOverrides[o.financial_year] = o;
    }
  }

  return {
    grandTotals,
    categories: categoriesMap,
    available_years: availableYears,
    all_overrides: allOverrides,
  };
}

/**
 * Upsert manual Material Supplied user input for a specific Category and Financial Year
 */
export async function upsertMaterialSuppliedOverride({
  category,
  financial_year,
  supplied_ha,
  supplied_count,
  remarks,
}) {
  if (!category || !financial_year) {
    throw new Error("Category and financial_year are required");
  }

  const cleanHa = Math.max(0, parseFloat(supplied_ha) || 0);
  const cleanCount = Math.max(0, parseInt(supplied_count, 10) || 0);

  const [record, created] = await MaterialSuppliedOverride.findOrCreate({
    where: { category, financial_year },
    defaults: {
      category,
      financial_year,
      supplied_ha: cleanHa,
      supplied_count: cleanCount,
      remarks: remarks || null,
    },
  });

  if (!created) {
    record.supplied_ha = cleanHa;
    record.supplied_count = cleanCount;
    if (remarks !== undefined) record.remarks = remarks;
    await record.save();
  }

  return record;
}

/**
 * Get all manual Material Supplied user inputs
 */
export async function getMaterialSuppliedOverrides() {
  return MaterialSuppliedOverride.findAll({
    order: [
      ["category", "ASC"],
      ["financial_year", "DESC"],
    ],
  });
}

/**
 * 2. Get Detailed List of Pending Projects (with search, pagination, filter by category/year/days pending)
 */
export async function getPendingProjectsList(filters = {}) {
  const {
    category,
    year,
    dealer_id,
    district,
    pendency_type = "PENDING_WORK_COMPLETION", // 'PENDING_WORK_COMPLETION' | 'PENDING_MATERIAL_SUPPLY' | 'ALL_PENDING'
    min_days_pending,
    search,
    page = 1,
    limit = 25,
    sort_by = "days_pending",
    sort_order = "DESC",
  } = filters;

  const whereConditions = [];
  const replacements = {};

  // Category filter
  if (category && category !== "ALL") {
    if (category === "Agriculture") {
      whereConditions.push("gp.application_id ILIKE 'A%'");
    } else if (category === "Horticulture") {
      whereConditions.push("gp.application_id ILIKE 'H%'");
    } else if (category === "Sugarcane" || category === "Others") {
      whereConditions.push("(gp.application_id ILIKE 'S%' OR (NOT gp.application_id ILIKE 'A%' AND NOT gp.application_id ILIKE 'H%'))");
    }
  }

  // Financial Year filter (using calculated year expression)
  if (year && year !== "ALL") {
    whereConditions.push(`(${FINANCIAL_YEAR_SQL_EXPRESSION}) = :year`);
    replacements.year = year;
  }

  // Dealer filter
  if (dealer_id && dealer_id !== "ALL") {
    if (dealer_id === "UNASSIGNED") {
      whereConditions.push("gp.dealer_id IS NULL");
    } else {
      whereConditions.push("gp.dealer_id = :dealer_id");
      replacements.dealer_id = dealer_id;
    }
  }

  // District filter
  if (district && district !== "ALL") {
    whereConditions.push("gp.district ILIKE :district");
    replacements.district = `%${district}%`;
  }

  // Search filter
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    whereConditions.push(`(
      gp.application_id ILIKE :search OR
      gp.farmer_name ILIKE :search OR
      gp.mobile ILIKE :search OR
      gp.village ILIKE :search OR
      gp.block ILIKE :search OR
      gp.district ILIKE :search OR
      gp.invoice_number ILIKE :search OR
      gp.work_order_no ILIKE :search
    )`);
    replacements.search = q;
  }

  // Pendency Type Logic
  if (pendency_type === "PENDING_WORK_COMPLETION") {
    // Invoiced (Material Supplied) but Dealer has NOT completed work (sequence < 26)
    whereConditions.push(`(
      (gp.invoice_date IS NOT NULL OR gp.invoice_number IS NOT NULL OR gp.current_status = 'INVOICED')
      AND COALESCE(gs.sequence_order, 0) < 26
    )`);
  } else if (pendency_type === "PENDING_MATERIAL_SUPPLY") {
    // Work Order Issued but Material NOT supplied (sequence < 26)
    whereConditions.push(`(
      (gp.work_order_date IS NOT NULL OR gp.work_order_no IS NOT NULL OR gp.current_status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') OR COALESCE(gs.sequence_order, 0) >= 21)
      AND COALESCE(gs.sequence_order, 0) < 26
    )`);
  } else if (pendency_type === "PENDING_JVR_COMPLETION") {
    // First Fund Credited but Dealer has NOT completed Joint Verification (sequence < 52)
    whereConditions.push(`(
      (gp.first_fund_utr_date IS NOT NULL OR COALESCE(gs.sequence_order, 0) >= 48 OR gp.current_status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)', 'First Fund Proceeding Completed'))
      AND (COALESCE(gs.sequence_order, 0) < 52 AND gp.current_status NOT IN ('Joint Verification Completed', 'Earlier JV Completed'))
    )`);
  } else if (pendency_type === "ALL_PENDING") {
    whereConditions.push(`(
      ((gp.work_order_date IS NOT NULL OR gp.work_order_no IS NOT NULL OR gp.current_status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') OR COALESCE(gs.sequence_order, 0) >= 21) AND COALESCE(gs.sequence_order, 0) < 26)
      OR
      ((gp.first_fund_utr_date IS NOT NULL OR COALESCE(gs.sequence_order, 0) >= 48 OR gp.current_status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)', 'First Fund Proceeding Completed')) AND (COALESCE(gs.sequence_order, 0) < 52 AND gp.current_status NOT IN ('Joint Verification Completed', 'Earlier JV Completed')))
    )`);
  }

  // Days Pending filter
  if (min_days_pending !== undefined && min_days_pending !== null && min_days_pending !== "" && !isNaN(parseInt(min_days_pending, 10))) {
    const minDays = parseInt(min_days_pending, 10);
    if (minDays >= 0) {
      whereConditions.push(`(
        CASE 
          WHEN (gp.first_fund_utr_date IS NOT NULL OR COALESCE(gs.sequence_order, 0) >= 48 OR gp.current_status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)', 'First Fund Proceeding Completed')) AND (COALESCE(gs.sequence_order, 0) < 52 AND gp.current_status NOT IN ('Joint Verification Completed', 'Earlier JV Completed'))
            THEN (CURRENT_DATE - COALESCE(gp.first_fund_utr_date, gp.current_status_date))
          WHEN (gp.invoice_date IS NOT NULL OR gp.invoice_number IS NOT NULL OR gp.current_status = 'INVOICED') AND COALESCE(gs.sequence_order, 0) < 26 
            THEN (CURRENT_DATE - COALESCE(gp.invoice_date, gp.current_status_date))
          WHEN (gp.work_order_date IS NOT NULL OR gp.work_order_no IS NOT NULL OR gp.current_status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') OR COALESCE(gs.sequence_order, 0) >= 21) 
            THEN (CURRENT_DATE - COALESCE(gp.work_order_date, gp.current_status_date))
          ELSE (CURRENT_DATE - gp.current_status_date)
        END
      ) >= :minDays`);
      replacements.minDays = minDays;
    }
  }

  const whereSql = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : "";

  // Count Query
  const countQuery = `
    SELECT COUNT(*)::integer as total
    FROM government_projects gp
    LEFT JOIN government_statuses gs ON gp.current_status = gs.name
    ${whereSql}
  `;
  const [countRes] = await db.query(countQuery, { replacements, type: QueryTypes.SELECT });
  const totalRecords = countRes?.total || 0;

  // Sorting
  let orderClause = "ORDER BY days_pending DESC, gp.id DESC";
  const validSortMap = {
    days_pending: "days_pending",
    applied_area_ha: "gp.applied_area_ha",
    invoice_date: "gp.invoice_date",
    work_order_date: "gp.work_order_date",
    farmer_name: "gp.farmer_name",
    application_id: "gp.application_id",
    current_status: "gp.current_status",
  };

  const safeOrderField = validSortMap[sort_by] || "days_pending";
  const safeDirection = sort_order?.toUpperCase() === "ASC" ? "ASC" : "DESC";
  if (sort_by === "application_id") {
    orderClause = `ORDER BY gp.application_id ${safeDirection}`;
  } else if (sort_by === "farmer_name") {
    orderClause = `ORDER BY gp.farmer_name ${safeDirection}`;
  } else if (sort_by === "work_order_date") {
    orderClause = `ORDER BY gp.work_order_date ${safeDirection}`;
  } else if (sort_by === "invoice_date") {
    orderClause = `ORDER BY gp.invoice_date ${safeDirection}`;
  } else {
    orderClause = `ORDER BY ${safeOrderField} ${safeDirection}`;
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50000, parseInt(limit, 10) || 25));
  const offsetNum = (pageNum - 1) * limitNum;
  replacements.limit = limitNum;
  replacements.offset = offsetNum;

  // Main Data Query
  const dataQuery = `
    SELECT 
      gp.id,
      gp.application_id,
      (${FINANCIAL_YEAR_SQL_EXPRESSION}) as financial_year,
      gp.year as stored_year,
      ${CATEGORY_SQL_EXPRESSION} as category,
      gp.farmer_name,
      gp.father_name,
      gp.mobile,
      gp.district,
      gp.block,
      gp.village,
      gp.survey_no_subdivision_no,
      COALESCE(gp.applied_area_ha, 0)::float as applied_area_ha,
      COALESCE(gp.total_area_ha, 0)::float as total_area_ha,
      gp.crop,
      gp.work_order_no,
      gp.work_order_date,
      gp.invoice_number,
      gp.invoice_date,
      COALESCE(gp.invoice_amount, 0)::float as invoice_amount,
      gp.first_fund_utr_date,
      gp.first_fund_amount,
      gp.current_status,
      gp.current_status_date,
      gp.current_status_remarks,
      d.id as dealer_id,
      d.name as dealer_name,
      CASE 
        WHEN (gp.first_fund_utr_date IS NOT NULL OR COALESCE(gs.sequence_order, 0) >= 48 OR gp.current_status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)', 'First Fund Proceeding Completed')) AND (COALESCE(gs.sequence_order, 0) < 52 AND gp.current_status NOT IN ('Joint Verification Completed', 'Earlier JV Completed'))
          THEN (CURRENT_DATE - COALESCE(gp.first_fund_utr_date, gp.current_status_date))
        WHEN (gp.invoice_date IS NOT NULL OR gp.invoice_number IS NOT NULL OR gp.current_status = 'INVOICED') AND COALESCE(gs.sequence_order, 0) < 26 
          THEN (CURRENT_DATE - COALESCE(gp.invoice_date, gp.current_status_date))
        WHEN (gp.work_order_date IS NOT NULL OR gp.work_order_no IS NOT NULL OR gp.current_status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') OR COALESCE(gs.sequence_order, 0) >= 21) 
          THEN (CURRENT_DATE - COALESCE(gp.work_order_date, gp.current_status_date))
        ELSE (CURRENT_DATE - gp.current_status_date)
      END::integer as days_pending,
      CASE 
        WHEN (gp.first_fund_utr_date IS NOT NULL OR COALESCE(gs.sequence_order, 0) >= 48 OR gp.current_status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)', 'First Fund Proceeding Completed')) AND (COALESCE(gs.sequence_order, 0) < 52 AND gp.current_status NOT IN ('Joint Verification Completed', 'Earlier JV Completed'))
          THEN 'PENDING_JVR_COMPLETION'
        WHEN (gp.invoice_date IS NOT NULL OR gp.invoice_number IS NOT NULL OR gp.current_status = 'INVOICED') AND COALESCE(gs.sequence_order, 0) < 26 
          THEN 'PENDING_WORK_COMPLETION'
        WHEN (gp.work_order_date IS NOT NULL OR gp.work_order_no IS NOT NULL OR gp.current_status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') OR COALESCE(gs.sequence_order, 0) >= 21) AND COALESCE(gs.sequence_order, 0) < 26 
          THEN 'PENDING_MATERIAL_SUPPLY'
        ELSE 'OTHER'
      END as pendency_stage
    FROM government_projects gp
    LEFT JOIN government_statuses gs ON gp.current_status = gs.name
    LEFT JOIN dealers d ON gp.dealer_id = d.id
    ${whereSql}
    ${orderClause}
    LIMIT :limit OFFSET :offset
  `;

  const projects = await db.query(dataQuery, {
    replacements,
    type: QueryTypes.SELECT,
  });

  return {
    projects,
    pagination: {
      total: totalRecords,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalRecords / limitNum),
    },
  };
}
