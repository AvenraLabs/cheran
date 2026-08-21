import { Op } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import { parseExcelDate } from "../../utils/dates.js";
import { normalizeApplicationId } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

/**
 * Bulk import historical invoice.json data
 * Directly ingests already-parsed data from invoice.json:
 * [{ government_project_id: "...", invoice_date: "YYYY-MM-DD" }, ...]
 * or { records: [ { government_project_id: "...", invoice_date: "YYYY-MM-DD" }, ... ] }
 */
export async function importHistoricalInvoiceJson(jsonData) {
  let records = [];

  if (Array.isArray(jsonData)) {
    records = jsonData;
  } else if (jsonData && Array.isArray(jsonData.records)) {
    records = jsonData.records;
  } else if (jsonData && Array.isArray(jsonData.data)) {
    records = jsonData.data;
  } else {
    throw new AppError("Invalid JSON format. Expected an array or an object with 'records' array.", 400);
  }

  if (records.length === 0) {
    throw new AppError("The uploaded JSON contains 0 invoice records.", 400);
  }

  // Deduplicate and group by government_project_id, keeping the earliest invoice_date and paired invoice_number
  const projectMap = new Map();
  let duplicateCount = 0;

  for (const rec of records) {
    const rawId =
      rec.government_project_id ||
      rec.government_application_id ||
      rec.application_id ||
      rec.project_id ||
      rec.id;

    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      continue;
    }

    const cleanAppId = normalizeApplicationId(rawId);
    if (!cleanAppId) continue;

    const rawDate =
      rec.invoice_date ||
      rec.inv_date ||
      rec.date_of_invoice ||
      rec.invoiceDate ||
      rec.date ||
      rec["Invoice Date"];

    const cleanDate = parseExcelDate(rawDate);

    const rawInvNo =
      rec.invoice_number ||
      rec.invoice_no ||
      rec.inv_no ||
      rec.bill_no ||
      rec.voucher_no ||
      rec.invoiceNumber ||
      rec["Invoice Number"];

    const cleanInvNo = rawInvNo !== undefined && rawInvNo !== null ? String(rawInvNo).trim() : null;

    if (projectMap.has(cleanAppId)) {
      duplicateCount++;
      const existing = projectMap.get(cleanAppId);

      // If this record has a cleaner/earlier date, update both date and its paired invoice number
      if (cleanDate && (!existing.invoice_date || cleanDate < existing.invoice_date)) {
        existing.invoice_date = cleanDate;
        if (cleanInvNo) {
          existing.invoice_number = cleanInvNo;
        }
      } else if (!existing.invoice_number && cleanInvNo) {
        existing.invoice_number = cleanInvNo;
      }
    } else {
      projectMap.set(cleanAppId, {
        application_id: cleanAppId,
        invoice_date: cleanDate,
        invoice_number: cleanInvNo,
      });
    }
  }

  const uniqueProjects = Array.from(projectMap.values());
  let newProjectsCreated = 0;
  let existingProjectsLinked = 0;

  // Process in fast transactional batches of 250
  const batchSize = 250;
  for (let i = 0; i < uniqueProjects.length; i += batchSize) {
    const batch = uniqueProjects.slice(i, i + batchSize);
    const transaction = await db.transaction();

    try {
      const batchAppIds = batch.map((b) => b.application_id);

      // Preload all existing projects in 1 single query for this batch
      const existingProjects = await GovernmentProject.findAll({
        where: {
          application_id: {
            [Op.in]: batchAppIds,
          },
        },
        transaction,
      });

      const existingProjectMap = new Map();
      existingProjects.forEach((p) => {
        existingProjectMap.set(normalizeApplicationId(p.application_id), p);
      });

      // Preload all existing INVOICED status history records in 1 single query
      const existingProjectIds = existingProjects.map((p) => p.id);
      const existingHistories =
        existingProjectIds.length > 0
          ? await GovernmentProjectStatusHistory.findAll({
              where: {
                project_id: {
                  [Op.in]: existingProjectIds,
                },
                status: "INVOICED",
              },
              transaction,
            })
          : [];

      const historyMap = new Map();
      existingHistories.forEach((h) => {
        historyMap.set(h.project_id, h);
      });

      for (const item of batch) {
        let project = existingProjectMap.get(item.application_id);

        if (!project) {
          // Create new Government Project with status INVOICED
          project = await GovernmentProject.create(
            {
              application_id: item.application_id,
              current_status: "INVOICED",
              current_status_date: item.invoice_date || null,
              invoice_date: item.invoice_date || null,
              invoice_number: item.invoice_number || null,
            },
            { transaction }
          );

          // Create baseline status history entry
          await GovernmentProjectStatusHistory.create(
            {
              project_id: project.id,
              status: "INVOICED",
              status_date: item.invoice_date || null,
              remarks: item.invoice_number
                ? `Historical invoice import (Invoice #${item.invoice_number})`
                : "Historical invoice import",
              observed_at: new Date(),
            },
            { transaction }
          );

          newProjectsCreated++;
        } else {
          // Update invoice details on existing project authoritatively
          const updatePayload = {};
          if (item.invoice_number) {
            updatePayload.invoice_number = item.invoice_number;
          }
          if (item.invoice_date) {
            updatePayload.invoice_date = item.invoice_date;
          }
          if (project.current_status === "INVOICED" && item.invoice_date) {
            updatePayload.current_status_date = item.invoice_date;
          }

          if (Object.keys(updatePayload).length > 0) {
            await project.update(updatePayload, { transaction });
          }

          // Ensure INVOICED status history exists and matches authoritative invoice date
          const existingInvoicedHistory = historyMap.get(project.id);

          if (!existingInvoicedHistory) {
            const newH = await GovernmentProjectStatusHistory.create(
              {
                project_id: project.id,
                status: "INVOICED",
                status_date: item.invoice_date || null,
                remarks: item.invoice_number
                  ? `Historical invoice import (Invoice #${item.invoice_number})`
                  : "Historical invoice import",
                observed_at: new Date(),
              },
              { transaction }
            );
            historyMap.set(project.id, newH);
          } else if (item.invoice_date && existingInvoicedHistory.status_date !== item.invoice_date) {
            await existingInvoicedHistory.update(
              {
                status_date: item.invoice_date,
                remarks: item.invoice_number
                  ? `Historical invoice import (Invoice #${item.invoice_number})`
                  : existingInvoicedHistory.remarks,
              },
              { transaction }
            );
          }

          existingProjectsLinked++;
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  return {
    totalRecords: records.length,
    uniqueProjectsCount: uniqueProjects.length,
    newProjectsCreated,
    existingProjectsLinked,
    duplicatesHandled: duplicateCount,
  };
}
