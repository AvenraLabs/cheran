import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
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

  // Deduplicate and group by government_project_id, keeping the earliest invoice_date
  const projectMap = new Map();
  let duplicateCount = 0;

  for (const rec of records) {
    const rawId = rec.government_project_id || rec.application_id || rec.project_id || rec.id;
    if (!rawId || typeof rawId !== "string" || !rawId.trim()) {
      continue;
    }

    const cleanAppId = rawId.trim().toUpperCase();
    const rawDate = rec.invoice_date || rec.date || new Date().toISOString().split("T")[0];
    const cleanDate = String(rawDate).trim().slice(0, 10);

    if (projectMap.has(cleanAppId)) {
      duplicateCount++;
      const existing = projectMap.get(cleanAppId);
      if (cleanDate && (!existing.invoice_date || cleanDate < existing.invoice_date)) {
        existing.invoice_date = cleanDate;
      }
    } else {
      projectMap.set(cleanAppId, {
        application_id: cleanAppId,
        invoice_date: cleanDate,
      });
    }
  }

  const uniqueProjects = Array.from(projectMap.values());
  let newProjectsCreated = 0;
  let existingProjectsLinked = 0;

  // Process in transactional batches of 500
  const batchSize = 500;
  for (let i = 0; i < uniqueProjects.length; i += batchSize) {
    const batch = uniqueProjects.slice(i, i + batchSize);
    const transaction = await db.transaction();

    try {
      for (const item of batch) {
        let project = await GovernmentProject.findOne({
          where: db.where(db.fn("UPPER", db.col("application_id")), item.application_id),
          transaction,
        });

        if (!project) {
          // Create new Government Project with status INVOICED
          project = await GovernmentProject.create(
            {
              application_id: item.application_id,
              current_status: "INVOICED",
              current_status_date: item.invoice_date || null,
              invoice_date: item.invoice_date || null,
            },
            { transaction }
          );

          // Create baseline status history entry
          await GovernmentProjectStatusHistory.create(
            {
              project_id: project.id,
              status: "INVOICED",
              status_date: item.invoice_date || null,
              remarks: "Historical invoice import",
              observed_at: new Date(),
            },
            { transaction }
          );

          newProjectsCreated++;
        } else {
          // Project exists: ensure INVOICED status history exists
          const existingInvoicedHistory = await GovernmentProjectStatusHistory.findOne({
            where: {
              project_id: project.id,
              status: "INVOICED",
            },
            transaction,
          });

          if (!existingInvoicedHistory) {
            await GovernmentProjectStatusHistory.create(
              {
                project_id: project.id,
                status: "INVOICED",
                status_date: item.invoice_date || null,
                remarks: "Historical invoice import",
                observed_at: new Date(),
              },
              { transaction }
            );
          } else if (
            item.invoice_date &&
            (!existingInvoicedHistory.status_date || item.invoice_date < existingInvoicedHistory.status_date)
          ) {
            await existingInvoicedHistory.update(
              { status_date: item.invoice_date },
              { transaction }
            );
          }

          // Preserve earliest invoice date on project
          if (!project.invoice_date || (item.invoice_date && item.invoice_date < project.invoice_date)) {
            await project.update(
              { invoice_date: item.invoice_date },
              { transaction }
            );
          }

          // If project was created with INVOICED status, also preserve earliest current_status_date
          if (project.current_status === "INVOICED") {
            if (!project.current_status_date || (item.invoice_date && item.invoice_date < project.current_status_date)) {
              await project.update(
                { current_status_date: item.invoice_date },
                { transaction }
              );
            }
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
