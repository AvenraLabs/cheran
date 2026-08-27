import * as XLSX from "xlsx";
import { Op } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import InventoryStock from "../inventory/inventory-stock.model.js";
import AppError from "../../shared/appError.js";

/**
 * Robustly extract Application IDs from any Load Order Excel buffer
 * Handles variations in sheet names, header spellings, and positions.
 */
export async function parseLoadOrderBuffer(fileBuffer) {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new AppError("Uploaded file buffer is empty", 400);
  }

  let workbook;
  try {
    workbook = XLSX.read(fileBuffer, {
      type: "buffer",
      cellDates: true,
      raw: true,
    });
  } catch (err) {
    throw new AppError(`Failed to parse Excel workbook: ${err.message}`, 400);
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new AppError("Excel workbook contains no sheets", 400);
  }

  const extractedAppIds = new Set();
  const rawProjectDetails = new Map();
  let overallDetectedDate = null;

  // Pattern for typical Govt Project / Application IDs (e.g. H-DPR-dpr-..., A-DPR-..., H-KGI-...)
  const appIdRegex = /([A-Za-z]-[A-Za-z0-9]{2,6}-[A-Za-z0-9]+-\d+-\d{2,4}-\d{2,4})/i;

  // Scan all sheets in the workbook
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    if (rows.length === 0) continue;

    // Find column index for Application Id if explicit header exists
    let appIdColIndex = -1;
    let farmerNameColIndex = -1;
    let villageColIndex = -1;
    let blockColIndex = -1;
    let areaColIndex = -1;
    let sheetDetectedDate = null;

    // Check top 10 rows for date and column headers
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      // Check if any cell in row has date format
      for (const cell of row) {
        if (!sheetDetectedDate && cell) {
          if (cell instanceof Date && !isNaN(cell.getTime())) {
            sheetDetectedDate = cell.toISOString().split("T")[0];
          } else if (typeof cell === "string") {
            const dateMatch = cell.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
            if (dateMatch) {
              const p1 = parseInt(dateMatch[1], 10);
              const p2 = parseInt(dateMatch[2], 10);
              const yr = parseInt(dateMatch[3], 10) < 100 ? 2000 + parseInt(dateMatch[3], 10) : parseInt(dateMatch[3], 10);
              const mm = p2 <= 12 ? String(p2).padStart(2, "0") : String(p1).padStart(2, "0");
              const dd = p2 <= 12 ? String(p1).padStart(2, "0") : String(p2).padStart(2, "0");
              sheetDetectedDate = `${yr}-${mm}-${dd}`;
            }
          }
        }
      }

      row.forEach((cell, colIdx) => {
        if (!cell || typeof cell !== "string") return;
        const norm = cell.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (norm.includes("applicationid") || norm.includes("applicationno") || norm.includes("appid") || norm.includes("projectid")) {
          appIdColIndex = colIdx;
        }
        if (norm.includes("farmername") || norm === "farmer" || norm === "nameoffarmer") {
          farmerNameColIndex = colIdx;
        }
        if (norm.includes("village")) {
          villageColIndex = colIdx;
        }
        if (norm.includes("block") || norm.includes("taluk")) {
          blockColIndex = colIdx;
        }
        if (norm.includes("area") || norm.includes("areaha")) {
          areaColIndex = colIdx;
        }
      });

      if (sheetDetectedDate && !overallDetectedDate) {
        overallDetectedDate = sheetDetectedDate;
      }
      if (appIdColIndex !== -1) break;
    }

    // Iterate through all data rows
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      // Helper to check if string looks like an application ID or junk/header
      const isValidAppId = (str) => {
        if (!str || typeof str !== "string") return false;
        const clean = str.trim();
        if (clean.length < 6) return false;
        if (/^(load|material|component|s\.no|sno|sl|farmer|total|gst|fitting)/i.test(clean)) return false;
        // Must contain at least one hyphen and digits
        if (!/-/.test(clean) || !/\d/.test(clean)) return false;
        return true;
      };

      // 1. If explicit appIdColIndex found, check that column
      if (appIdColIndex !== -1 && row[appIdColIndex]) {
        const val = String(row[appIdColIndex]).trim().toUpperCase();
        if (isValidAppId(val)) {
          extractedAppIds.add(val);
          if (!rawProjectDetails.has(val)) {
            rawProjectDetails.set(val, {
              farmer_name: farmerNameColIndex !== -1 && row[farmerNameColIndex] ? String(row[farmerNameColIndex]).trim() : null,
              village: villageColIndex !== -1 && row[villageColIndex] ? String(row[villageColIndex]).trim() : null,
              block: blockColIndex !== -1 && row[blockColIndex] ? String(row[blockColIndex]).trim() : null,
              area: areaColIndex !== -1 && row[areaColIndex] ? parseFloat(row[areaColIndex]) || null : null,
            });
          }
        }
      } else {
        // 2. Scan all cells with regex pattern
        for (let c = 0; c < row.length; c++) {
          const cell = row[c];
          if (!cell || typeof cell !== "string") continue;
          const match = cell.trim().match(appIdRegex);
          if (match && match[1]) {
            const appId = match[1].trim().toUpperCase();
            if (isValidAppId(appId)) {
              extractedAppIds.add(appId);
              if (!rawProjectDetails.has(appId)) {
                rawProjectDetails.set(appId, {
                  farmer_name: row[c + 1] && typeof row[c + 1] === "string" ? String(row[c + 1]).trim() : null,
                  village: null,
                  block: null,
                  area: null,
                });
              }
            }
          }
        }
      }
    }
  }

  if (extractedAppIds.size === 0) {
    throw new AppError("No Government Application / Project IDs found in the uploaded Load Order sheet.", 400);
  }

  const appIdsList = Array.from(extractedAppIds);

  // Check each Application ID in the database (case-insensitive)
  const existingProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("application_id")), {
      [Op.in]: appIdsList,
    }),
    attributes: ["id", "application_id", "farmer_name", "district", "block", "village", "current_status", "current_status_date", "invoice_date"],
  });

  const existingMap = new Map();
  existingProjects.forEach((p) => {
    existingMap.set(p.application_id, p);
    existingMap.set(p.application_id.toUpperCase(), p);
  });

  const projectsSummary = appIdsList.map((appId) => {
    const dbProj = existingMap.get(appId);
    const rawDetails = rawProjectDetails.get(appId) || {};
    return {
      application_id: appId,
      exists_in_db: Boolean(dbProj),
      project_id: dbProj ? dbProj.id : null,
      farmer_name: dbProj?.farmer_name || rawDetails.farmer_name || "Farmer",
      district: dbProj?.district || null,
      block: dbProj?.block || rawDetails.block || null,
      village: dbProj?.village || rawDetails.village || null,
      area_ha: rawDetails.area || null,
      current_status: dbProj ? dbProj.current_status : "NEW_PROJECT",
      current_status_date: dbProj?.current_status_date || null,
      existing_invoice_date: dbProj?.invoice_date || null,
    };
  });

  // Fetch all active Finished Goods from Item Master with on-hand stock
  const finishedGoods = await Item.findAll({
    where: {
      item_type: "FINISHED_GOOD",
      is_active: true,
    },
    include: [
      { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
      { model: InventoryStock, as: "stock", attributes: ["quantity_on_hand"] },
    ],
    order: [["name", "ASC"]],
  });

  const formattedFinishedGoods = finishedGoods.map((fg) => ({
    id: fg.id,
    code: fg.code,
    name: fg.name,
    category: fg.category,
    unit_id: fg.unit_id,
    unit_symbol: fg.unit?.symbol || "NOS",
    unit_price: parseFloat(fg.unit_price) || 0.0,
    available_stock: fg.stock ? parseFloat(fg.stock.quantity_on_hand) : 0,
    default_quantity: 0,
  }));

  // Default date in Asia/Kolkata timezone
  const todayKolkata = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return {
    totalProjectsFound: appIdsList.length,
    existingProjectsCount: existingProjects.length,
    newProjectsCount: appIdsList.length - existingProjects.length,
    defaultInvoiceDate: overallDetectedDate || todayKolkata,
    projects: projectsSummary,
    availableFinishedGoods: formattedFinishedGoods,
  };
}

/**
 * Parse multi-line or comma-separated pasted Application IDs
 */
export async function parseLoadOrderAppIdsText(applicationIdsText, customDate = null) {
  if (!applicationIdsText || typeof applicationIdsText !== "string" || !applicationIdsText.trim()) {
    throw new AppError("Please provide at least one Government Project / Application ID", 400);
  }

  // Parse lines or comma/space separated strings
  const lines = applicationIdsText
    .split(/[\r\n,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const uniqueAppIds = [...new Set(lines)];

  if (uniqueAppIds.length === 0) {
    throw new AppError("No valid Application IDs found in input", 400);
  }

  // Check each Application ID in database (case-insensitive)
  const existingProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("application_id")), {
      [Op.in]: uniqueAppIds,
    }),
    attributes: [
      "id",
      "application_id",
      "farmer_name",
      "district",
      "block",
      "village",
      "current_status",
      "current_status_date",
      "invoice_date",
    ],
  });

  const existingMap = new Map();
  existingProjects.forEach((p) => {
    existingMap.set(p.application_id, p);
    existingMap.set(p.application_id.toUpperCase(), p);
  });

  const projectsSummary = uniqueAppIds.map((appId) => {
    const dbProj = existingMap.get(appId);
    return {
      application_id: appId,
      exists_in_db: Boolean(dbProj),
      project_id: dbProj ? dbProj.id : null,
      farmer_name: dbProj?.farmer_name || "Farmer",
      district: dbProj?.district || null,
      block: dbProj?.block || null,
      village: dbProj?.village || null,
      area_ha: null,
      current_status: dbProj ? dbProj.current_status : "NEW_PROJECT",
      current_status_date: dbProj?.current_status_date || null,
      existing_invoice_date: dbProj?.invoice_date || null,
    };
  });

  // Fetch all active Finished Goods from Item Master with on-hand stock
  const finishedGoods = await Item.findAll({
    where: {
      item_type: "FINISHED_GOOD",
      is_active: true,
    },
    include: [
      { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
      { model: InventoryStock, as: "stock", attributes: ["quantity_on_hand"] },
    ],
    order: [["name", "ASC"]],
  });

  const formattedFinishedGoods = finishedGoods.map((fg) => ({
    id: fg.id,
    code: fg.code,
    name: fg.name,
    category: fg.category,
    unit_id: fg.unit_id,
    unit_symbol: fg.unit?.symbol || "NOS",
    unit_price: parseFloat(fg.unit_price) || 0.0,
    available_stock: fg.stock ? parseFloat(fg.stock.quantity_on_hand) : 0,
    default_quantity: 0,
  }));

  const todayKolkata = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return {
    totalProjectsFound: uniqueAppIds.length,
    existingProjectsCount: existingProjects.length,
    newProjectsCount: uniqueAppIds.length - existingProjects.length,
    defaultInvoiceDate: customDate || todayKolkata,
    projects: projectsSummary,
    availableFinishedGoods: formattedFinishedGoods,
  };
}
