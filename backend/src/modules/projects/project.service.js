import { Op } from "sequelize";
import db from "../../config/db.js";
import GovernmentProject from "./project.model.js";
import GovernmentProjectStatusHistory from "./project-history.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentImport from "../imports/import.model.js";
import AppError from "../../shared/appError.js";
import { calculateDaysBetween } from "../../utils/dates.js";
import { normalizeApplicationId } from "../../utils/normalization.js";

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
    min_status_days,
    orphan_only,
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
  if (dealer_id) {
    if (dealer_id === "UNASSIGNED" || dealer_id === "NONE" || dealer_id === "null") {
      where.dealer_id = null;
    } else {
      where.dealer_id = dealer_id;
    }
  }
  if (year) where.year = year;
  if (farmer_name) where.farmer_name = { [Op.iLike]: `%${farmer_name}%` };
  if (application_id) where.application_id = { [Op.iLike]: `%${application_id}%` };

  // Orphan invoice filter (created from invoice.json without matched annexure details)
  if (orphan_only === "true" || orphan_only === true) {
    where[Op.and] = [
      { [Op.or]: [{ farmer_name: null }, { farmer_name: "" }] },
      { [Op.or]: [{ invoice_date: { [Op.ne]: null } }, { invoice_number: { [Op.ne]: null } }] },
    ];
  }

  if (min_status_days !== undefined && min_status_days !== null && min_status_days !== "") {
    const days = parseInt(min_status_days, 10);
    if (!isNaN(days) && days >= 0) {
      const today = new Date();
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split("T")[0];

      where.current_status_date = {
        [Op.ne]: null,
        [Op.lte]: cutoffStr,
      };
    }
  }

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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const include = [
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
  ];
  const order = [[{ model: GovernmentProjectStatusHistory, as: "status_history" }, "observed_at", "ASC"]];

  let project = null;
  if (isUuid) {
    project = await GovernmentProject.findByPk(id, { include, order });
  }
  if (!project) {
    project = await GovernmentProject.findOne({
      where: db.where(db.fn("UPPER", db.col("application_id")), String(id).trim().toUpperCase()),
      include,
      order,
    });
  }

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

  // Ensure INVOICED status is sorted first as baseline stage
  const sortedHistories = [...histories].sort((a, b) => {
    if (a.status === "INVOICED" && b.status !== "INVOICED") return -1;
    if (b.status === "INVOICED" && a.status !== "INVOICED") return 1;
    return new Date(a.status_date || 0) - new Date(b.status_date || 0);
  });

  // Calculate days between consecutive observed statuses
  const historyWithIntervals = sortedHistories.map((entry, index) => {
    const json = entry.toJSON ? entry.toJSON() : entry;
    if (index === 0) {
      json.days_since_previous = 0;
      json.previous_status = null;
    } else {
      const prev = sortedHistories[index - 1];
      json.previous_status = prev.status;
      json.days_since_previous = calculateDaysBetween(prev.status_date, entry.status_date);
    }
    return json;
  });

  return {
    project,
    total_stages_observed: sortedHistories.length,
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

/**
 * Live search projects for autocomplete (by application_id or farmer_name)
 */
export async function searchProjects(query, limit = 10) {
  if (!query || !query.trim()) return [];

  const cleanQ = query.trim();
  const projects = await GovernmentProject.findAll({
    where: {
      [Op.or]: [
        { application_id: { [Op.iLike]: `%${cleanQ}%` } },
        { farmer_name: { [Op.iLike]: `%${cleanQ}%` } },
      ],
    },
    attributes: [
      "id",
      "application_id",
      "farmer_name",
      "district",
      "block",
      "village",
      "current_status",
      "current_status_date",
      "quotation_subsidy_amount",
      "invoice_number",
      "invoice_date",
    ],
    limit,
    order: [["created_at", "DESC"]],
  });

  return projects;
}

/**
 * Rename or Merge an orphan / mistyped Government Project
 */
export async function renameOrMergeProject(projectId, targetApplicationId) {
  if (!targetApplicationId || !targetApplicationId.trim()) {
    throw new AppError("Target Application ID is required", 400);
  }

  const cleanTargetId = normalizeApplicationId(targetApplicationId);
  const sourceProject = await GovernmentProject.findByPk(projectId);
  if (!sourceProject) {
    throw new AppError("Source project not found", 404);
  }

  const cleanSourceId = normalizeApplicationId(sourceProject.application_id);
  if (cleanSourceId === cleanTargetId) {
    throw new AppError("Target Application ID is identical to current Application ID", 400);
  }

  // Check if a target project already exists with cleanTargetId
  const targetProject = await GovernmentProject.findOne({
    where: {
      application_id: cleanTargetId,
    },
  });

  const transaction = await db.transaction();
  try {
    if (!targetProject) {
      // MODE A: RENAME (No target project exists, just update application_id)
      await sourceProject.update({ application_id: cleanTargetId }, { transaction });
      await transaction.commit();

      return {
        action: "RENAMED",
        projectId: sourceProject.id,
        applicationId: cleanTargetId,
        message: `Application ID successfully updated to ${cleanTargetId}`,
      };
    } else {
      // MODE B: MERGE sourceProject INTO targetProject
      // 1. Transfer invoice data to target project
      const updatePayload = {};
      if (sourceProject.invoice_number && !targetProject.invoice_number) {
        updatePayload.invoice_number = sourceProject.invoice_number;
      }
      if (sourceProject.invoice_date) {
        updatePayload.invoice_date = sourceProject.invoice_date;
      }

      if (Object.keys(updatePayload).length > 0) {
        await targetProject.update(updatePayload, { transaction });
      }

      // 2. Transfer or ensure INVOICED milestone history exists on target project
      if (sourceProject.invoice_date) {
        const existingInvoicedHist = await GovernmentProjectStatusHistory.findOne({
          where: {
            project_id: targetProject.id,
            status: "INVOICED",
          },
          transaction,
        });

        if (!existingInvoicedHist) {
          await GovernmentProjectStatusHistory.create(
            {
              project_id: targetProject.id,
              status: "INVOICED",
              status_date: sourceProject.invoice_date,
              remarks: sourceProject.invoice_number
                ? `Transferred from merged invoice (Invoice #${sourceProject.invoice_number})`
                : "Transferred from merged invoice record",
              observed_at: new Date(),
            },
            { transaction }
          );
        } else if (!existingInvoicedHist.status_date || existingInvoicedHist.status_date !== sourceProject.invoice_date) {
          await existingInvoicedHist.update(
            {
              status_date: sourceProject.invoice_date,
              remarks: sourceProject.invoice_number
                ? `Transferred from merged invoice (Invoice #${sourceProject.invoice_number})`
                : existingInvoicedHist.remarks,
            },
            { transaction }
          );
        }
      }

      // 3. Remove source project history
      await GovernmentProjectStatusHistory.destroy({
        where: { project_id: sourceProject.id },
        transaction,
      });

      // 4. Delete source duplicate project
      await sourceProject.destroy({ transaction });

      await transaction.commit();

      // Recalculate target project dealer commission
      try {
        const { calculateProjectDealerCommission } = await import("../dealers/dealer-commission.service.js");
        await calculateProjectDealerCommission(targetProject.id);
      } catch (_) {}

      return {
        action: "MERGED",
        targetProjectId: targetProject.id,
        mergedIntoApplicationId: targetProject.application_id,
        farmerName: targetProject.farmer_name,
        message: `Successfully merged invoice into ${targetProject.application_id} (${targetProject.farmer_name || "Government Scheme"})`,
      };
    }
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
