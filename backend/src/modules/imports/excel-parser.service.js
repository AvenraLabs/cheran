import * as XLSX from "xlsx";
import { normalizeColumnHeader, normalizeApplicationId, cleanString } from "../../utils/normalization.js";
import { parseExcelDate } from "../../utils/dates.js";
import { parseDecimal, parseIntSafe } from "../../utils/money.js";
import AppError from "../../shared/appError.js";

// Column mapping synonyms to accommodate variations in Tamil Nadu horticulture exports & Annexure sheets
const COLUMN_SYNONYMS = {
  application_id: ["application_id", "application_no", "app_id", "application_number", "application_sl_no"],
  year: ["year", "financial_year", "fin_year", "scheme_year"],
  farmer_name: ["farmer_name", "beneficiary_name", "farmer", "name_of_farmer"],
  father_name: ["father_name", "father_husband_name", "father_s_name", "husband_name"],
  mobile: ["mobile", "mobile_no", "contact_no", "phone_no", "cell_no", "mobile_number"],
  gender: ["gender", "sex"],
  caste: ["caste", "category", "community", "social_status"],
  farmer_type: ["farmer_type", "type_of_farmer", "category_of_farmer", "farmer_category"],
  district: ["district", "district_name", "dist_name"],
  block: ["block", "block_name", "taluk", "block_taluk"],
  village: ["village", "village_name", "revenue_village"],
  survey_no_subdivision_no: [
    "survey_no_subdivision_no",
    "survey_no_sub_division_no",
    "survey_no",
    "survey_number",
    "sf_no",
    "survey_subdivision_no",
  ],
  crop: ["crop", "crop_name", "crop_type"],
  spacing: ["spacing", "plant_spacing", "crop_spacing"],
  total_area_ha: ["total_area_ha", "total_area", "total_area_in_ha", "total_extent_ha", "total_area_hectare"],
  applied_area_ha: ["applied_area_ha", "applied_area", "applied_area_in_ha", "subsidy_area_ha", "eligible_area_ha"],
  department: ["department", "dept_name", "department_name"],
  scheme: ["scheme", "scheme_name", "sub_scheme"],
  irrigation_type: ["irrigation_type", "mi_type", "type_of_irrigation", "system_type"],
  sprinkler_type: ["sprinkler_type", "type_of_sprinkler"],
  sprinkler_spacing: ["sprinkler_spacing"],
  sugar_mill: ["sugar_mill", "sugar_mill_name", "mill_name"],
  sugar_drip_type: ["sugar_drip_type"],
  sugar_well_type: ["sugar_well_type"],
  mi_company: ["mi_company", "company_name", "firm_name", "manufacturer_name"],
  mi_reference_no: ["mi_reference_no", "mi_referrence_no", "company_ref_no", "firm_reference_no"],
  dealer_name: ["dealer_name", "dealer", "distributor", "agent_name", "dealer_firm_name"],
  quotation_subsidy_amount: [
    "quotation_subsidy_amount_rs_100",
    "quotation_subsidy_amount_rs",
    "quotation_subsidy_amount_100",
    "quotation_subsidy_amount",
    "subsidy_amount",
    "gov_subsidy",
    "quotation_subsidy",
    "subsidy_eligible",
  ],
  quotation_saca_subsidy_amount: [
    "quotation_saca_subsidy_amount",
    "saca_subsidy_amount",
    "saca_subsidy",
    "saca_amount",
  ],
  farmer_contribution: [
    "farmer_contribution_rs_25",
    "farmer_contribution_rs",
    "farmer_contribution",
    "farmer_share",
    "beneficiary_contribution",
    "farmer_share_amount",
  ],
  invoice_amount: [
    "invoice_amount_rs_100",
    "invoice_amount_rs",
    "invoice_amount",
    "total_invoice_amount",
    "inv_amount",
    "invoice_value",
  ],
  invoice_number: ["invoice_number", "invoice_no", "inv_no", "bill_no", "voucher_no"],
  invoice_date: ["invoice_date", "inv_date", "date_of_invoice"],
  state_restricted_amount: [
    "state_restricted_amount_rs_100",
    "state_restricted_amount_rs",
    "state_restricted_amount",
    "state_restriction_amount",
    "state_restricted",
  ],
  work_order_date: ["work_order_date", "wo_date", "work_order_issued_date", "issued_work_order_date"],
  work_order_no: ["work_order_no", "wo_no", "work_order_number"],
  supply_date: ["supply_date", "material_supply_date", "date_of_supply"],
  application_received_date: ["application_received_date", "app_received_date", "received_date"],
  quotation_date: ["quotation_date", "quote_date", "date_of_quotation"],
  first_fund_amount: [
    "first_fund_amount_lakhs",
    "first_fund_amount_in_lakhs",
    "first_fund_amount",
    "1st_fund_amount",
    "first_installment_amount",
  ],
  goi_share_amount: ["goi_share_amount", "goi_share", "central_share_amount", "central_share"],
  state_share_amount: ["state_share_amount", "state_share", "tn_share_amount"],
  first_fund_proceeding_no: ["first_fund_proceeding_no", "1st_fund_proceeding_no", "first_proceeding_no"],
  first_fund_utr_no: ["first_fund_utr_no", "1st_fund_utr_no", "first_utr_no", "first_fund_utr"],
  first_fund_utr_date: ["first_fund_utr_date", "1st_fund_utr_date", "first_utr_date"],
  joint_verification_recommended_amount: [
    "joint_verification_recommended_amount",
    "jv_recommended_amount",
    "jv_amount",
    "joint_verification_amount",
  ],
  earlier_jv_completed_date: ["earlier_jv_completed_date", "earlier_jv_date", "previous_jv_date"],
  jv_recommended_date: ["jv_recommended_date", "jv_date", "joint_verification_date", "joint_verification_completed_date"],
  second_fund_amount: [
    "second_fund_amount_lakhs",
    "second_fund_amount_in_lakhs",
    "second_fund_amount",
    "2nd_fund_amount",
    "second_installment_amount",
  ],
  additional_state_share_amount: ["additional_state_share_amount", "addl_state_share_amount", "additional_state_share"],
  gst_amount: ["gst_amount", "gst", "total_gst_amount"],
  second_fund_proceeding_no: ["second_fund_proceeding_no", "2nd_fund_proceeding_no", "second_proceeding_no"],
  final_fund_utr_no: ["final_fund_utr_no", "final_utr_no", "final_fund_utr", "2nd_fund_utr_no"],
  treasury_fund_utr_no: ["treasury_fund_utr_no", "treasury_utr_no", "treasury_utr"],
  final_fund_utr_date: ["final_fund_utr_date", "final_utr_date", "final_fund_date"],
  treasury_fund_utr_date: ["treasury_fund_utr_date", "treasury_utr_date"],
  total_fund_released: [
    "total_fund_released_lakhs",
    "total_fund_released_in_lakhs",
    "total_fund_released",
    "total_released_amount",
    "fund_released_amount",
    "total_fund_amount",
  ],
  ae_restricted_amount: [
    "ae_restricted_amount_rs_100",
    "ae_restricted_amount_rs",
    "ae_restricted_amount",
    "ae_restriction_amount",
  ],
  bank_guarantee_deducted_pct: [
    "bank_gaurantee_deducted",
    "bank_guarantee_deducted",
    "bank_gaurantee_deducted_pct",
    "bank_guarantee_deducted_pct",
    "bank_gaurantee_deducted_percentage",
    "bank_guarantee_deducted_percentage",
  ],
  bank_guarantee_deducted_amount: [
    "bank_gaurantee_deducted_amount",
    "bank_guarantee_deducted_amount",
    "bg_deducted_amount",
    "bank_guarantee_amount",
  ],
  current_status: ["current_status", "status", "project_status", "present_status", "stage", "current_stage"],
  current_status_date: ["current_status_date", "status_date", "present_status_date", "stage_date", "last_status_date"],
  current_status_remarks: ["current_status_remarks", "remarks", "status_remarks", "comment", "remarks_if_any"],
  no_of_days_pending: ["7yc_renewal_days", "no_of_days_pending", "days_pending", "pending_days", "no_of_pending_days"],
  fund_type: ["fund_type", "type_of_fund"],
  proceeding_status: ["proceeding_status", "proceedings_status"],
  fra_act: ["fra_act", "fra", "forest_rights_act"],
};

export function parseExcelBuffer(fileBuffer, fileName = "import.xlsx") {
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

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new AppError(`Sheet '${sheetName}' is empty or invalid`, 400);
  }

  // Convert sheet to array of row arrays
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  });

  if (rawRows.length === 0) {
    throw new AppError("The Excel sheet is completely empty", 400);
  }

  // Find header row (usually row 0, but check first 5 rows in case of top banner/title rows)
  let headerRowIndex = 0;
  let headers = [];

  for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
    const row = rawRows[i];
    if (Array.isArray(row)) {
      const normalizedRow = row.map((c) => normalizeColumnHeader(c));
      // Check if this row contains essential keywords like application_id or farmer_name or status
      const matchCount = normalizedRow.filter((h) =>
        Object.values(COLUMN_SYNONYMS).some((synonyms) => synonyms.includes(h))
      ).length;

      if (matchCount >= 2) {
        headerRowIndex = i;
        headers = normalizedRow;
        break;
      }
    }
  }

  if (headers.length === 0 && rawRows[0]) {
    headers = rawRows[0].map((c) => normalizeColumnHeader(c));
  }

  // Build field mapping from normalized headers to model fields
  const fieldMapping = {};
  headers.forEach((header, colIndex) => {
    if (!header) return;
    for (const [modelKey, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
      if (synonyms.includes(header) && !fieldMapping[modelKey]) {
        fieldMapping[modelKey] = colIndex;
        break;
      }
    }
  });

  // Extract and transform data rows
  const parsedRows = [];
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const rawRow = rawRows[r];
    if (!rawRow || rawRow.length === 0) continue;

    // Check if entire row is empty
    const hasData = rawRow.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "");
    if (!hasData) continue;

    const rowObj = {
      _rowNumber: r + 1, // 1-indexed row number in the Excel sheet
      _raw: {},
    };

    // Store raw row values mapped to original header names for audit trail
    headers.forEach((h, idx) => {
      if (h) {
        rowObj._raw[h] = rawRow[idx];
      }
    });

    // Map extracted fields
    const getVal = (field) => {
      const idx = fieldMapping[field];
      return idx !== undefined && rawRow[idx] !== undefined ? rawRow[idx] : null;
    };

    rowObj.application_id = normalizeApplicationId(getVal("application_id"));
    rowObj.year = cleanString(getVal("year"));
    rowObj.farmer_name = cleanString(getVal("farmer_name"));
    rowObj.father_name = cleanString(getVal("father_name"));
    rowObj.mobile = cleanString(getVal("mobile"));
    rowObj.gender = cleanString(getVal("gender"));
    rowObj.caste = cleanString(getVal("caste"));
    rowObj.farmer_type = cleanString(getVal("farmer_type"));
    rowObj.district = cleanString(getVal("district"));
    rowObj.block = cleanString(getVal("block"));
    rowObj.village = cleanString(getVal("village"));
    rowObj.survey_no_subdivision_no = cleanString(getVal("survey_no_subdivision_no"));
    rowObj.crop = cleanString(getVal("crop"));
    rowObj.spacing = cleanString(getVal("spacing"));
    rowObj.total_area_ha = parseDecimal(getVal("total_area_ha"));
    rowObj.applied_area_ha = parseDecimal(getVal("applied_area_ha"));
    rowObj.department = cleanString(getVal("department"));
    rowObj.scheme = cleanString(getVal("scheme"));
    rowObj.irrigation_type = cleanString(getVal("irrigation_type"));
    rowObj.sprinkler_type = cleanString(getVal("sprinkler_type"));
    rowObj.sprinkler_spacing = cleanString(getVal("sprinkler_spacing"));
    rowObj.sugar_mill = cleanString(getVal("sugar_mill"));
    rowObj.sugar_drip_type = cleanString(getVal("sugar_drip_type"));
    rowObj.sugar_well_type = cleanString(getVal("sugar_well_type"));
    rowObj.mi_company = cleanString(getVal("mi_company"));
    rowObj.mi_reference_no = cleanString(getVal("mi_reference_no"));
    rowObj.dealer_name = cleanString(getVal("dealer_name"));

    // Financials
    rowObj.quotation_subsidy_amount = parseDecimal(getVal("quotation_subsidy_amount"));
    rowObj.quotation_saca_subsidy_amount = parseDecimal(getVal("quotation_saca_subsidy_amount"));
    rowObj.farmer_contribution = parseDecimal(getVal("farmer_contribution"));
    rowObj.invoice_amount = parseDecimal(getVal("invoice_amount"));
    rowObj.invoice_date = parseExcelDate(getVal("invoice_date"));
    rowObj.state_restricted_amount = parseDecimal(getVal("state_restricted_amount"));
    rowObj.work_order_date = parseExcelDate(getVal("work_order_date"));
    rowObj.work_order_no = cleanString(getVal("work_order_no"));
    rowObj.supply_date = parseExcelDate(getVal("supply_date"));
    rowObj.application_received_date = parseExcelDate(getVal("application_received_date"));
    rowObj.quotation_date = parseExcelDate(getVal("quotation_date"));

    // Fund Releases
    rowObj.first_fund_amount = parseDecimal(getVal("first_fund_amount"));
    rowObj.goi_share_amount = parseDecimal(getVal("goi_share_amount"));
    rowObj.state_share_amount = parseDecimal(getVal("state_share_amount"));
    rowObj.first_fund_proceeding_no = cleanString(getVal("first_fund_proceeding_no"));
    rowObj.first_fund_utr_no = cleanString(getVal("first_fund_utr_no"));
    rowObj.first_fund_utr_date = parseExcelDate(getVal("first_fund_utr_date"));
    rowObj.joint_verification_recommended_amount = parseDecimal(getVal("joint_verification_recommended_amount"));
    rowObj.earlier_jv_completed_date = parseExcelDate(getVal("earlier_jv_completed_date"));
    rowObj.jv_recommended_date = parseExcelDate(getVal("jv_recommended_date"));
    rowObj.second_fund_amount = parseDecimal(getVal("second_fund_amount"));
    rowObj.additional_state_share_amount = parseDecimal(getVal("additional_state_share_amount"));
    rowObj.gst_amount = parseDecimal(getVal("gst_amount"));
    rowObj.second_fund_proceeding_no = cleanString(getVal("second_fund_proceeding_no"));
    rowObj.final_fund_utr_no = cleanString(getVal("final_fund_utr_no"));
    rowObj.treasury_fund_utr_no = cleanString(getVal("treasury_fund_utr_no"));
    rowObj.final_fund_utr_date = parseExcelDate(getVal("final_fund_utr_date"));
    rowObj.treasury_fund_utr_date = parseExcelDate(getVal("treasury_fund_utr_date"));
    rowObj.total_fund_released = parseDecimal(getVal("total_fund_released"));
    rowObj.ae_restricted_amount = parseDecimal(getVal("ae_restricted_amount"));
    rowObj.bank_guarantee_deducted_pct = parseDecimal(getVal("bank_guarantee_deducted_pct"));
    rowObj.bank_guarantee_deducted_amount = parseDecimal(getVal("bank_guarantee_deducted_amount"));

    // Current Status
    rowObj.current_status = cleanString(getVal("current_status"));
    rowObj.current_status_date = parseExcelDate(getVal("current_status_date"));
    rowObj.current_status_remarks = cleanString(getVal("current_status_remarks"));
    rowObj.no_of_days_pending = parseIntSafe(getVal("no_of_days_pending"));
    rowObj.fund_type = cleanString(getVal("fund_type"));
    rowObj.proceeding_status = cleanString(getVal("proceeding_status"));
    rowObj.fra_act = cleanString(getVal("fra_act"));

    parsedRows.push(rowObj);
  }

  return {
    sheetName,
    headers,
    fieldMapping,
    rows: parsedRows,
  };
}
