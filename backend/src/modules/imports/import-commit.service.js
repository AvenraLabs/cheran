import { Op } from "sequelize";
import db from "../../config/db.js";
import GovernmentImport from "./import.model.js";
import GovernmentImportRow from "./import-row.model.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import GovernmentStatus from "../statuses/status.model.js";
import { normalizeApplicationId } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

export async function commitImport(importId) {
  const importRecord = await GovernmentImport.findByPk(importId);
  if (!importRecord) {
    throw new AppError(`Import with ID ${importId} not found`, 404);
  }

  if (importRecord.status === "COMPLETED") {
    throw new AppError(`Import ${importId} has already been committed and completed`, 400);
  }

  if (importRecord.status === "PROCESSING") {
    throw new AppError(`Import ${importId} is currently being processed`, 400);
  }

  // Check if any rows are pending dealer resolution
  const pendingResolutions = await GovernmentImportRow.count({
    where: {
      import_id: importId,
      action: "DEALER_RESOLUTION_REQUIRED",
      resolution_status: "PENDING",
    },
  });

  if (pendingResolutions > 0) {
    throw new AppError(
      `Cannot commit import: ${pendingResolutions} rows require dealer resolution before commit. Please resolve all dealers first.`,
      400,
      { pendingResolutionsCount: pendingResolutions }
    );
  }

  // Fetch all valid staged rows
  const stagedRows = await GovernmentImportRow.findAll({
    where: {
      import_id: importId,
    },
    order: [["row_number", "ASC"]],
  });

  // Filter out rejected or error rows
  const validRows = stagedRows.filter(
    (row) =>
      row.action !== "ERROR" &&
      row.action !== "DUPLICATE_SOURCE_ROW" &&
      row.resolution_status !== "REJECTED" &&
      row.application_id &&
      String(row.application_id).trim()
  );

  if (validRows.length === 0) {
    throw new AppError("No valid staged rows found to commit.", 400);
  }

  // Mark import as PROCESSING
  await importRecord.update({ status: "PROCESSING" });

  let createdCount = 0;
  let updatedCount = 0;
  let historyCreatedCount = 0;

  try {
    // 1. Ensure all distinct imported statuses exist in master table in 1 pass
    const distinctStatuses = new Set();
    for (const row of validRows) {
      const st = row.imported_status || row.raw_data?.current_status;
      if (st && typeof st === "string" && st.trim()) {
        distinctStatuses.add(st.trim());
      }
    }

    if (distinctStatuses.size > 0) {
      const existingStatusRecords = await GovernmentStatus.findAll({
        attributes: ["name"],
      });
      const existingNames = new Set(existingStatusRecords.map((s) => s.name.trim().toUpperCase()));

      for (const stName of distinctStatuses) {
        if (!existingNames.has(stName.toUpperCase())) {
          await GovernmentStatus.create({
            name: stName,
            is_active: true,
            sequence_order: 999,
          }).catch(() => {});
          existingNames.add(stName.toUpperCase());
        }
      }
    }

    // Helper for non-destructive updates (preserves existing DB value if Excel cell is null/undefined)
    const updateVal = (newVal, existingVal) => (newVal !== null && newVal !== undefined ? newVal : existingVal);

    // 2. Process in fast transactional batches of 250 rows to prevent statement timeout
    const batchSize = 250;

    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const transaction = await db.transaction();

      try {
        // Collect all normalized application IDs for this batch
        const batchAppIds = batch.map((r) => normalizeApplicationId(r.application_id)).filter(Boolean);

        // Preload existing projects in 1 single query for this batch
        const existingProjects = await GovernmentProject.findAll({
          where: {
            application_id: {
              [Op.in]: batchAppIds,
            },
          },
          transaction,
        });

        const projectMap = new Map();
        existingProjects.forEach((p) => {
          projectMap.set(normalizeApplicationId(p.application_id), p);
        });

        // Preload existing status histories for these projects in 1 single query
        const existingProjectIds = existingProjects.map((p) => p.id);
        const existingHistories =
          existingProjectIds.length > 0
            ? await GovernmentProjectStatusHistory.findAll({
                where: {
                  project_id: {
                    [Op.in]: existingProjectIds,
                  },
                },
                transaction,
              })
            : [];

        // Group history by "project_id:STATUS"
        const historyMap = new Map();
        existingHistories.forEach((h) => {
          const key = `${h.project_id}:${(h.status || "").trim().toUpperCase()}`;
          historyMap.set(key, h);
        });

        for (const stagedRow of batch) {
          const { raw_data, application_id, matched_dealer_id } = stagedRow;
          const rowData = raw_data || {};
          const importedStatus = stagedRow.imported_status || rowData.current_status;
          const importedStatusDate = stagedRow.imported_status_date || rowData.current_status_date;

          const cleanAppId = normalizeApplicationId(application_id);
          if (!cleanAppId) continue;

          let project = projectMap.get(cleanAppId);

          const cleanImportedInvoiceNo =
            rowData.invoice_number && String(rowData.invoice_number).trim().toUpperCase() !== "SALES"
              ? String(rowData.invoice_number).trim()
              : null;

          if (!project) {
            // Create new project
            const projectPayload = {
              application_id,
              year: rowData.year || null,
              farmer_name: rowData.farmer_name || null,
              father_name: rowData.father_name || null,
              mobile: rowData.mobile || null,
              gender: rowData.gender || null,
              caste: rowData.caste || null,
              farmer_type: rowData.farmer_type || null,
              district: rowData.district || null,
              block: rowData.block || null,
              village: rowData.village || null,
              survey_no_subdivision_no: rowData.survey_no_subdivision_no || null,
              crop: rowData.crop || null,
              spacing: rowData.spacing || null,
              total_area_ha: rowData.total_area_ha || null,
              applied_area_ha: rowData.applied_area_ha || null,
              department: rowData.department || null,
              scheme: rowData.scheme || null,
              irrigation_type: rowData.irrigation_type || null,
              sprinkler_type: rowData.sprinkler_type || null,
              sprinkler_spacing: rowData.sprinkler_spacing || null,
              sugar_mill: rowData.sugar_mill || null,
              sugar_drip_type: rowData.sugar_drip_type || null,
              sugar_well_type: rowData.sugar_well_type || null,
              mi_company: rowData.mi_company || null,
              mi_reference_no: rowData.mi_reference_no || null,
              dealer_id: matched_dealer_id || null,
              quotation_subsidy_amount: rowData.quotation_subsidy_amount || null,
              quotation_saca_subsidy_amount: rowData.quotation_saca_subsidy_amount || null,
              farmer_contribution: rowData.farmer_contribution || null,
              invoice_number: cleanImportedInvoiceNo,
              invoice_amount: rowData.invoice_amount || null,
              invoice_date: rowData.invoice_date || null,
              state_restricted_amount: rowData.state_restricted_amount || null,
              work_order_date: rowData.work_order_date || null,
              work_order_no: rowData.work_order_no || null,
              supply_date: rowData.supply_date || null,
              application_received_date: rowData.application_received_date || null,
              quotation_date: rowData.quotation_date || null,
              first_fund_amount: rowData.first_fund_amount || null,
              goi_share_amount: rowData.goi_share_amount || null,
              state_share_amount: rowData.state_share_amount || null,
              first_fund_proceeding_no: rowData.first_fund_proceeding_no || null,
              first_fund_utr_no: rowData.first_fund_utr_no || null,
              first_fund_utr_date: rowData.first_fund_utr_date || null,
              joint_verification_recommended_amount: rowData.joint_verification_recommended_amount || null,
              earlier_jv_completed_date: rowData.earlier_jv_completed_date || null,
              jv_recommended_date: rowData.jv_recommended_date || null,
              second_fund_amount: rowData.second_fund_amount || null,
              additional_state_share_amount: rowData.additional_state_share_amount || null,
              gst_amount: rowData.gst_amount || null,
              second_fund_proceeding_no: rowData.second_fund_proceeding_no || null,
              final_fund_utr_no: rowData.final_fund_utr_no || null,
              treasury_fund_utr_no: rowData.treasury_fund_utr_no || null,
              final_fund_utr_date: rowData.final_fund_utr_date || null,
              treasury_fund_utr_date: rowData.treasury_fund_utr_date || null,
              total_fund_released: rowData.total_fund_released || null,
              ae_restricted_amount: rowData.ae_restricted_amount || null,
              bank_guarantee_deducted_pct: rowData.bank_guarantee_deducted_pct || null,
              bank_guarantee_deducted_amount: rowData.bank_guarantee_deducted_amount || null,
              current_status: importedStatus || "Application Received",
              current_status_date: importedStatusDate || rowData.application_received_date || null,
              current_status_remarks: rowData.current_status_remarks || "Created via Government Annexure Import",
              no_of_days_pending: rowData.no_of_days_pending || null,
              fund_type: rowData.fund_type || null,
              proceeding_status: rowData.proceeding_status || null,
              fra_act: rowData.fra_act || null,
            };

            project = await GovernmentProject.create(projectPayload, { transaction });
            projectMap.set(cleanAppId, project);
            createdCount++;

            // Backfill milestone status history records from available date columns
            const milestoneDates = [
              { field: "application_received_date", status: "Application Received" },
              { field: "quotation_date", status: "Quotation Prepared by MI Company" },
              { field: "work_order_date", status: "Issued Work Order" },
              { field: "invoice_date", status: "INVOICED" },
              { field: "earlier_jv_completed_date", status: "Earlier JV Completed" },
              { field: "first_fund_utr_date", status: "First Fund Credited (UTR Updated)" },
              { field: "treasury_fund_utr_date", status: "Iamwarm Fund Credited (UTR Updated)" },
              { field: "final_fund_utr_date", status: "Final Fund Credited (UTR Updated)" },
            ];

            for (const m of milestoneDates) {
              const mDate = rowData[m.field];
              if (mDate && m.status.toUpperCase() !== importedStatus?.toUpperCase()) {
                await GovernmentProjectStatusHistory.create(
                  {
                    project_id: project.id,
                    status: m.status,
                    status_date: mDate,
                    remarks: `Milestone recorded from Annexure (${m.field})`,
                    source_import_id: importRecord.id,
                    observed_at: new Date(),
                  },
                  { transaction }
                );
                historyCreatedCount++;
              }
            }

            // Create baseline current status history
            if (importedStatus) {
              await GovernmentProjectStatusHistory.create(
                {
                  project_id: project.id,
                  status: importedStatus,
                  status_date: importedStatusDate || null,
                  remarks: rowData.current_status_remarks || "Initial status from Annexure Import",
                  source_import_id: importRecord.id,
                  observed_at: new Date(),
                },
                { transaction }
              );
              historyCreatedCount++;
            }
          } else {
            // Project exists: Authoritative status update from latest Excel
            const statusDiffers = project.current_status !== importedStatus;
            const shouldUpdateStatus = statusDiffers && !(importedStatus === "INVOICED" && project.current_status !== "INVOICED");

            // Preserve existing verified invoice_number and invoice_date
            const targetInvoiceNo = project.invoice_number || cleanImportedInvoiceNo;
            const targetInvoiceDate = project.invoice_date || updateVal(rowData.invoice_date, project.invoice_date);

            const updatePayload = {
              year: updateVal(rowData.year, project.year),
              farmer_name: updateVal(rowData.farmer_name, project.farmer_name),
              father_name: updateVal(rowData.father_name, project.father_name),
              mobile: updateVal(rowData.mobile, project.mobile),
              gender: updateVal(rowData.gender, project.gender),
              caste: updateVal(rowData.caste, project.caste),
              farmer_type: updateVal(rowData.farmer_type, project.farmer_type),
              district: updateVal(rowData.district, project.district),
              block: updateVal(rowData.block, project.block),
              village: updateVal(rowData.village, project.village),
              survey_no_subdivision_no: updateVal(rowData.survey_no_subdivision_no, project.survey_no_subdivision_no),
              crop: updateVal(rowData.crop, project.crop),
              spacing: updateVal(rowData.spacing, project.spacing),
              total_area_ha: updateVal(rowData.total_area_ha, project.total_area_ha),
              applied_area_ha: updateVal(rowData.applied_area_ha, project.applied_area_ha),
              department: updateVal(rowData.department, project.department),
              scheme: updateVal(rowData.scheme, project.scheme),
              irrigation_type: updateVal(rowData.irrigation_type, project.irrigation_type),
              sprinkler_type: updateVal(rowData.sprinkler_type, project.sprinkler_type),
              sprinkler_spacing: updateVal(rowData.sprinkler_spacing, project.sprinkler_spacing),
              sugar_mill: updateVal(rowData.sugar_mill, project.sugar_mill),
              sugar_drip_type: updateVal(rowData.sugar_drip_type, project.sugar_drip_type),
              sugar_well_type: updateVal(rowData.sugar_well_type, project.sugar_well_type),
              mi_company: updateVal(rowData.mi_company, project.mi_company),
              mi_reference_no: updateVal(rowData.mi_reference_no, project.mi_reference_no),
              dealer_id: matched_dealer_id || project.dealer_id,
              quotation_subsidy_amount: updateVal(rowData.quotation_subsidy_amount, project.quotation_subsidy_amount),
              quotation_saca_subsidy_amount: updateVal(rowData.quotation_saca_subsidy_amount, project.quotation_saca_subsidy_amount),
              farmer_contribution: updateVal(rowData.farmer_contribution, project.farmer_contribution),
              invoice_number: targetInvoiceNo,
              invoice_amount: updateVal(rowData.invoice_amount, project.invoice_amount),
              invoice_date: targetInvoiceDate,
              state_restricted_amount: updateVal(rowData.state_restricted_amount, project.state_restricted_amount),
              work_order_date: updateVal(rowData.work_order_date, project.work_order_date),
              work_order_no: updateVal(rowData.work_order_no, project.work_order_no),
              supply_date: updateVal(rowData.supply_date, project.supply_date),
              application_received_date: updateVal(rowData.application_received_date, project.application_received_date),
              quotation_date: updateVal(rowData.quotation_date, project.quotation_date),
              first_fund_amount: updateVal(rowData.first_fund_amount, project.first_fund_amount),
              goi_share_amount: updateVal(rowData.goi_share_amount, project.goi_share_amount),
              state_share_amount: updateVal(rowData.state_share_amount, project.state_share_amount),
              first_fund_proceeding_no: updateVal(rowData.first_fund_proceeding_no, project.first_fund_proceeding_no),
              first_fund_utr_no: updateVal(rowData.first_fund_utr_no, project.first_fund_utr_no),
              first_fund_utr_date: updateVal(rowData.first_fund_utr_date, project.first_fund_utr_date),
              joint_verification_recommended_amount: updateVal(rowData.joint_verification_recommended_amount, project.joint_verification_recommended_amount),
              earlier_jv_completed_date: updateVal(rowData.earlier_jv_completed_date, project.earlier_jv_completed_date),
              jv_recommended_date: updateVal(rowData.jv_recommended_date, project.jv_recommended_date),
              second_fund_amount: updateVal(rowData.second_fund_amount, project.second_fund_amount),
              additional_state_share_amount: updateVal(rowData.additional_state_share_amount, project.additional_state_share_amount),
              gst_amount: updateVal(rowData.gst_amount, project.gst_amount),
              second_fund_proceeding_no: updateVal(rowData.second_fund_proceeding_no, project.second_fund_proceeding_no),
              final_fund_utr_no: updateVal(rowData.final_fund_utr_no, project.final_fund_utr_no),
              treasury_fund_utr_no: updateVal(rowData.treasury_fund_utr_no, project.treasury_fund_utr_no),
              final_fund_utr_date: updateVal(rowData.final_fund_utr_date, project.final_fund_utr_date),
              treasury_fund_utr_date: updateVal(rowData.treasury_fund_utr_date, project.treasury_fund_utr_date),
              total_fund_released: updateVal(rowData.total_fund_released, project.total_fund_released),
              ae_restricted_amount: updateVal(rowData.ae_restricted_amount, project.ae_restricted_amount),
              bank_guarantee_deducted_pct: updateVal(rowData.bank_guarantee_deducted_pct, project.bank_guarantee_deducted_pct),
              bank_guarantee_deducted_amount: updateVal(rowData.bank_guarantee_deducted_amount, project.bank_guarantee_deducted_amount),
              current_status: shouldUpdateStatus ? importedStatus : project.current_status,
              current_status_date: shouldUpdateStatus ? (importedStatusDate || project.current_status_date) : (importedStatusDate || project.current_status_date),
              current_status_remarks: updateVal(rowData.current_status_remarks, project.current_status_remarks),
              no_of_days_pending: updateVal(rowData.no_of_days_pending, project.no_of_days_pending),
              fund_type: updateVal(rowData.fund_type, project.fund_type),
              proceeding_status: updateVal(rowData.proceeding_status, project.proceeding_status),
              fra_act: updateVal(rowData.fra_act, project.fra_act),
            };

            await project.update(updatePayload, { transaction });
            updatedCount++;

            // Backfill/sync milestone status history
            const milestoneDates = [
              { field: "application_received_date", status: "Application Received" },
              { field: "quotation_date", status: "Quotation Prepared by MI Company" },
              { field: "work_order_date", status: "Issued Work Order" },
              { field: "invoice_date", status: "INVOICED" },
              { field: "earlier_jv_completed_date", status: "Earlier JV Completed" },
              { field: "first_fund_utr_date", status: "First Fund Credited (UTR Updated)" },
              { field: "treasury_fund_utr_date", status: "Iamwarm Fund Credited (UTR Updated)" },
              { field: "final_fund_utr_date", status: "Final Fund Credited (UTR Updated)" },
            ];

            for (const m of milestoneDates) {
              const mDate = rowData[m.field];
              if (mDate && m.status.toUpperCase() !== importedStatus?.toUpperCase()) {
                const histKey = `${project.id}:${m.status.trim().toUpperCase()}`;
                const existingHist = historyMap.get(histKey);

                if (!existingHist) {
                  const newH = await GovernmentProjectStatusHistory.create(
                    {
                      project_id: project.id,
                      status: m.status,
                      status_date: mDate,
                      remarks: `Milestone recorded from Annexure (${m.field})`,
                      source_import_id: importRecord.id,
                      observed_at: new Date(),
                    },
                    { transaction }
                  );
                  historyMap.set(histKey, newH);
                  historyCreatedCount++;
                } else if (m.status !== "INVOICED" && (!existingHist.status_date || existingHist.status_date !== mDate)) {
                  await existingHist.update({ status_date: mDate }, { transaction });
                }
              }
            }

            // Authoritative current status: ensure history entry exists and holds latest current_status_date
            if (importedStatus) {
              const currentHistKey = `${project.id}:${importedStatus.trim().toUpperCase()}`;
              const existingCurrentHist = historyMap.get(currentHistKey);

              if (!existingCurrentHist) {
                const newCurrH = await GovernmentProjectStatusHistory.create(
                  {
                    project_id: project.id,
                    status: importedStatus,
                    status_date: importedStatusDate || null,
                    remarks: rowData.current_status_remarks || "Updated from latest Annexure import",
                    source_import_id: importRecord.id,
                    observed_at: new Date(),
                  },
                  { transaction }
                );
                historyMap.set(currentHistKey, newCurrH);
                historyCreatedCount++;
              } else if (importedStatusDate && existingCurrentHist.status_date !== importedStatusDate) {
                await existingCurrentHist.update(
                  {
                    status_date: importedStatusDate,
                    remarks: rowData.current_status_remarks || existingCurrentHist.remarks,
                  },
                  { transaction }
                );
              }
            }
          }
        }

        await transaction.commit();
      } catch (batchErr) {
        await transaction.rollback();
        throw batchErr;
      }
    }

    // Finalize import record
    await importRecord.update({
      status: "COMPLETED",
      completed_at: new Date(),
    });

    return {
      importId: importRecord.id,
      status: "COMPLETED",
      summary: {
        newProjectsCreated: createdCount,
        existingProjectsUpdated: updatedCount,
        statusHistoryEntriesCreated: historyCreatedCount,
      },
    };
  } catch (err) {
    // Mark import as FAILED outside the transaction
    await importRecord.update({
      status: "FAILED",
      error_message: err.message,
    }).catch(() => {});

    throw err;
  }
}
