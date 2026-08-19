import db from "../../config/db.js";
import GovernmentImport from "./import.model.js";
import GovernmentImportRow from "./import-row.model.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
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

  const transaction = await db.transaction();
  let createdCount = 0;
  let updatedCount = 0;
  let historyCreatedCount = 0;

  try {
    // Set status to processing
    await importRecord.update({ status: "PROCESSING" }, { transaction });

    for (const stagedRow of stagedRows) {
      const { action, resolution_status, raw_data, application_id, matched_dealer_id } = stagedRow;

      // Skip rejected or error rows
      if (action === "ERROR" || action === "DUPLICATE_SOURCE_ROW" || resolution_status === "REJECTED") {
        continue;
      }

      const rowData = raw_data || {};
      const importedStatus = stagedRow.imported_status || rowData.current_status;
      const importedStatusDate = stagedRow.imported_status_date || rowData.current_status_date;

      // Check if project exists in database
      let project = await GovernmentProject.findOne({
        where: { application_id },
        transaction,
      });

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
          current_status: importedStatus,
          current_status_date: importedStatusDate || null,
          current_status_remarks: rowData.current_status_remarks || null,
          no_of_days_pending: rowData.no_of_days_pending || null,
          fund_type: rowData.fund_type || null,
          proceeding_status: rowData.proceeding_status || null,
          fra_act: rowData.fra_act || null,
        };

        project = await GovernmentProject.create(projectPayload, { transaction });
        createdCount++;

        // Create initial status history entry
        await GovernmentProjectStatusHistory.create(
          {
            project_id: project.id,
            status: importedStatus,
            status_date: importedStatusDate || null,
            remarks: rowData.current_status_remarks || "Initial Import",
            source_import_id: importRecord.id,
            observed_at: new Date(),
          },
          { transaction }
        );
        historyCreatedCount++;
      } else {
        // Project exists: check if status changed
        const statusDiffers = project.current_status !== importedStatus;
        const shouldUpdateStatus = statusDiffers && !(importedStatus === "INVOICED" && project.current_status !== "INVOICED");

        // Build updated fields payload from latest Excel
        const updatePayload = {
          year: rowData.year !== undefined ? rowData.year : project.year,
          farmer_name: rowData.farmer_name || project.farmer_name,
          father_name: rowData.father_name || project.father_name,
          mobile: rowData.mobile || project.mobile,
          gender: rowData.gender || project.gender,
          caste: rowData.caste || project.caste,
          farmer_type: rowData.farmer_type || project.farmer_type,
          district: rowData.district || project.district,
          block: rowData.block || project.block,
          village: rowData.village || project.village,
          survey_no_subdivision_no: rowData.survey_no_subdivision_no || project.survey_no_subdivision_no,
          crop: rowData.crop || project.crop,
          spacing: rowData.spacing || project.spacing,
          total_area_ha: rowData.total_area_ha !== null ? rowData.total_area_ha : project.total_area_ha,
          applied_area_ha: rowData.applied_area_ha !== null ? rowData.applied_area_ha : project.applied_area_ha,
          department: rowData.department || project.department,
          scheme: rowData.scheme || project.scheme,
          irrigation_type: rowData.irrigation_type || project.irrigation_type,
          sprinkler_type: rowData.sprinkler_type || project.sprinkler_type,
          sprinkler_spacing: rowData.sprinkler_spacing || project.sprinkler_spacing,
          sugar_mill: rowData.sugar_mill || project.sugar_mill,
          sugar_drip_type: rowData.sugar_drip_type || project.sugar_drip_type,
          sugar_well_type: rowData.sugar_well_type || project.sugar_well_type,
          mi_company: rowData.mi_company || project.mi_company,
          mi_reference_no: rowData.mi_reference_no || project.mi_reference_no,
          dealer_id: matched_dealer_id || project.dealer_id,
          quotation_subsidy_amount:
            rowData.quotation_subsidy_amount !== null ? rowData.quotation_subsidy_amount : project.quotation_subsidy_amount,
          quotation_saca_subsidy_amount:
            rowData.quotation_saca_subsidy_amount !== null
              ? rowData.quotation_saca_subsidy_amount
              : project.quotation_saca_subsidy_amount,
          farmer_contribution:
            rowData.farmer_contribution !== null ? rowData.farmer_contribution : project.farmer_contribution,
          invoice_amount: rowData.invoice_amount !== null ? rowData.invoice_amount : project.invoice_amount,
          invoice_date: rowData.invoice_date || project.invoice_date,
          state_restricted_amount:
            rowData.state_restricted_amount !== null ? rowData.state_restricted_amount : project.state_restricted_amount,
          work_order_date: rowData.work_order_date || project.work_order_date,
          work_order_no: rowData.work_order_no || project.work_order_no,
          supply_date: rowData.supply_date || project.supply_date,
          application_received_date: rowData.application_received_date || project.application_received_date,
          quotation_date: rowData.quotation_date || project.quotation_date,
          first_fund_amount: rowData.first_fund_amount !== null ? rowData.first_fund_amount : project.first_fund_amount,
          goi_share_amount: rowData.goi_share_amount !== null ? rowData.goi_share_amount : project.goi_share_amount,
          state_share_amount: rowData.state_share_amount !== null ? rowData.state_share_amount : project.state_share_amount,
          first_fund_proceeding_no: rowData.first_fund_proceeding_no || project.first_fund_proceeding_no,
          first_fund_utr_no: rowData.first_fund_utr_no || project.first_fund_utr_no,
          first_fund_utr_date: rowData.first_fund_utr_date || project.first_fund_utr_date,
          joint_verification_recommended_amount:
            rowData.joint_verification_recommended_amount !== null
              ? rowData.joint_verification_recommended_amount
              : project.joint_verification_recommended_amount,
          earlier_jv_completed_date: rowData.earlier_jv_completed_date || project.earlier_jv_completed_date,
          jv_recommended_date: rowData.jv_recommended_date || project.jv_recommended_date,
          second_fund_amount:
            rowData.second_fund_amount !== null ? rowData.second_fund_amount : project.second_fund_amount,
          additional_state_share_amount:
            rowData.additional_state_share_amount !== null
              ? rowData.additional_state_share_amount
              : project.additional_state_share_amount,
          gst_amount: rowData.gst_amount !== null ? rowData.gst_amount : project.gst_amount,
          second_fund_proceeding_no: rowData.second_fund_proceeding_no || project.second_fund_proceeding_no,
          final_fund_utr_no: rowData.final_fund_utr_no || project.final_fund_utr_no,
          treasury_fund_utr_no: rowData.treasury_fund_utr_no || project.treasury_fund_utr_no,
          final_fund_utr_date: rowData.final_fund_utr_date || project.final_fund_utr_date,
          treasury_fund_utr_date: rowData.treasury_fund_utr_date || project.treasury_fund_utr_date,
          total_fund_released:
            rowData.total_fund_released !== null ? rowData.total_fund_released : project.total_fund_released,
          ae_restricted_amount:
            rowData.ae_restricted_amount !== null ? rowData.ae_restricted_amount : project.ae_restricted_amount,
          current_status: shouldUpdateStatus ? importedStatus : project.current_status,
          current_status_date: shouldUpdateStatus ? (importedStatusDate || project.current_status_date) : project.current_status_date,
          current_status_remarks: rowData.current_status_remarks || project.current_status_remarks,
          no_of_days_pending:
            rowData.no_of_days_pending !== null ? rowData.no_of_days_pending : project.no_of_days_pending,
          fund_type: rowData.fund_type || project.fund_type,
          proceeding_status: rowData.proceeding_status || project.proceeding_status,
          fra_act: rowData.fra_act || project.fra_act,
        };

        await project.update(updatePayload, { transaction });
        updatedCount++;

        // If status differs and is advancing, insert new status history record
        if (shouldUpdateStatus) {
          await GovernmentProjectStatusHistory.create(
            {
              project_id: project.id,
              status: importedStatus,
              status_date: importedStatusDate || null,
              remarks: rowData.current_status_remarks || null,
              source_import_id: importRecord.id,
              observed_at: new Date(),
            },
            { transaction }
          );
          historyCreatedCount++;
        }
      }
    }

    // Finalize import record
    await importRecord.update(
      {
        status: "COMPLETED",
        completed_at: new Date(),
      },
      { transaction }
    );

    await transaction.commit();

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
    await transaction.rollback();

    // Mark import as FAILED outside the transaction
    await importRecord.update({
      status: "FAILED",
      error_message: err.message,
    }).catch(() => {});

    throw err;
  }
}
