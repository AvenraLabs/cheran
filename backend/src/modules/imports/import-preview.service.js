import { Op } from "sequelize";
import db from "../../config/db.js";
import GovernmentImport from "./import.model.js";
import GovernmentImportRow from "./import-row.model.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import { parseExcelBuffer } from "./excel-parser.service.js";
import { validateImportHeaders, getValidStatusesMap } from "./import-validator.service.js";
import { calculateSha256 } from "../../utils/hashing.js";
import { normalizeDealerName, normalizeApplicationId } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

export async function processImportPreview({ fileBuffer, fileName, uploadedBy = "System" }) {
  const fileHash = calculateSha256(fileBuffer);

  // Check if identical completed file was already processed
  const completedImport = await GovernmentImport.findOne({
    where: { file_hash: fileHash, status: "COMPLETED" },
  });
  if (completedImport) {
    throw new AppError(
      `Duplicate file upload: An identical file '${completedImport.file_name}' was already imported on ${new Date(
        completedImport.uploaded_at
      ).toLocaleString()}.`,
      400,
      { previousImportId: completedImport.id, fileHash }
    );
  }

  // 1. Parse Excel buffer
  const { headers, fieldMapping, rows } = parseExcelBuffer(fileBuffer, fileName);

  if (rows.length === 0) {
    throw new AppError("No data rows found in the uploaded file", 400);
  }

  // 2. Validate required headers
  await validateImportHeaders(fieldMapping);

  // 3. Fetch reference sets for high performance in-memory lookups
  const validStatuses = await getValidStatusesMap();

  const allDealers = await Dealer.findAll({
    attributes: ["id", "name", "normalized_name", "commission_percentage"],
  });
  const dealerMap = new Map();
  allDealers.forEach((d) => dealerMap.set(d.normalized_name, d));

  // Extract all non-empty application IDs normalized to uppercase
  const appIds = rows.map((r) => normalizeApplicationId(r.application_id)).filter(Boolean);
  const existingProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("application_id")), {
      [Op.in]: appIds,
    }),
    attributes: ["id", "application_id", "current_status", "current_status_date", "dealer_id"],
  });
  const projectMap = new Map();
  existingProjects.forEach((p) => {
    projectMap.set(p.application_id, p);
    projectMap.set(p.application_id.toUpperCase(), p);
  });

  // 4. Staging calculation
  const stagedRows = [];
  const seenAppIdsInFile = new Set();

  let newProjectsCount = 0;
  let updatedProjectsCount = 0;
  let statusChangesCount = 0;
  let unchangedCount = 0;
  let duplicateRowsCount = 0;
  let errorRowsCount = 0;
  let dealerResolutionsCount = 0;

  for (const row of rows) {
    const rowNumber = row._rowNumber;
    const appId = normalizeApplicationId(row.application_id);
    const importedStatus = row.current_status;
    const importedStatusDate = row.current_status_date;
    const dealerName = row.dealer_name;

    let action = "NEW_PROJECT";
    let resolutionStatus = "RESOLVED";
    let errorMessage = null;
    let matchedProjectId = null;
    let matchedDealerId = null;

    // Rule 1: Application ID must exist
    if (!appId || appId === "") {
      action = "ERROR";
      resolutionStatus = "REJECTED";
      errorMessage = "Application ID is missing or empty";
      errorRowsCount++;
    }
    // Rule 2: Check in-file duplicates
    else if (seenAppIdsInFile.has(appId)) {
      action = "DUPLICATE_SOURCE_ROW";
      resolutionStatus = "REJECTED";
      errorMessage = `Duplicate Application ID '${appId}' found within the same file`;
      duplicateRowsCount++;
    }
    // Rule 3: Validate status string
    else if (!importedStatus || !importedStatus.trim()) {
      action = "ERROR";
      resolutionStatus = "REJECTED";
      errorMessage = "Current Status is missing or empty";
      errorRowsCount++;
      seenAppIdsInFile.add(appId);
    }
    // Valid row processing
    else {
      seenAppIdsInFile.add(appId);

      // Dealer matching
      let dealerResolved = true;
      if (dealerName && dealerName.trim() !== "") {
        const normDealer = normalizeDealerName(dealerName);
        const existingDealer = dealerMap.get(normDealer);
        if (existingDealer) {
          matchedDealerId = existingDealer.id;
        } else {
          dealerResolved = false;
        }
      }

      // Check if project exists in database
      const existingProj = projectMap.get(appId);
      if (existingProj) {
        matchedProjectId = existingProj.id;
        const statusDiffers = existingProj.current_status !== importedStatus;

        if (statusDiffers) {
          action = "STATUS_CHANGE";
          statusChangesCount++;
        } else {
          action = "UNCHANGED";
          unchangedCount++;
        }
        updatedProjectsCount++;
      } else {
        action = "NEW_PROJECT";
        newProjectsCount++;
      }

      // If dealer resolution is required, override action for human resolution
      if (!dealerResolved) {
        action = "DEALER_RESOLUTION_REQUIRED";
        resolutionStatus = "PENDING";
        errorMessage = `Unmatched dealer: '${dealerName}'. Human verification or dealer creation required.`;
        dealerResolutionsCount++;
      }
    }

    stagedRows.push({
      row_number: rowNumber,
      application_id: appId || null,
      imported_status: importedStatus || null,
      imported_status_date: importedStatusDate || null,
      dealer_name: dealerName || null,
      action,
      error_message: errorMessage,
      matched_project_id: matchedProjectId,
      matched_dealer_id: matchedDealerId,
      resolution_status: resolutionStatus,
      raw_data: row,
    });
  }

  // 5. Store import in database under transaction
  const transaction = await db.transaction();
  let importRecord;

  try {
    importRecord = await GovernmentImport.create(
      {
        file_name: fileName,
        file_hash: fileHash,
        uploaded_at: new Date(),
        uploaded_by: uploadedBy,
        total_rows: rows.length,
        new_projects_count: newProjectsCount,
        updated_projects_count: updatedProjectsCount,
        status_changes_count: statusChangesCount,
        unchanged_count: unchangedCount,
        duplicate_rows_count: duplicateRowsCount,
        error_rows_count: errorRowsCount,
        dealer_resolutions_count: dealerResolutionsCount,
        status: "PREVIEW",
      },
      { transaction }
    );

    const rowsWithImportId = stagedRows.map((r) => ({
      ...r,
      import_id: importRecord.id,
    }));

    await GovernmentImportRow.bulkCreate(rowsWithImportId, { transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  return {
    importId: importRecord.id,
    fileName,
    fileHash,
    summary: {
      totalRows: rows.length,
      newProjects: newProjectsCount,
      existingProjects: updatedProjectsCount,
      statusChanges: statusChangesCount,
      unchanged: unchangedCount,
      duplicateRows: duplicateRowsCount,
      errors: errorRowsCount,
      dealerResolutionsRequired: dealerResolutionsCount,
    },
    samplePreviewRows: stagedRows.slice(0, 15),
  };
}
