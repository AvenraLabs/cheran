import * as XLSX from "xlsx";
import { parseExcelDate } from "../../utils/dates.js";
import AppError from "../../shared/appError.js";

/**
 * Parses government proceeding Excel files (.xls, .xlsx)
 * Supports 40%, 45%, and 55% proceeding structures.
 */
export function parseProceedingExcel(buffer, originalFilename = "proceeding.xls", overrideFundPercentage = null) {
  if (!buffer || buffer.length === 0) {
    throw new AppError("Uploaded Excel file is empty", 400);
  }

  let wb;
  try {
    wb = XLSX.read(buffer, { type: "buffer" });
  } catch (err) {
    throw new AppError(`Failed to parse Excel file: ${err.message}`, 400);
  }

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new AppError("No sheets found in Excel file", 400);
  }

  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: null });

  if (!rawRows || rawRows.length === 0) {
    throw new AppError("No data rows found in Excel sheet", 400);
  }

  const headers = Object.keys(rawRows[0] || {});

  // Helper to normalize header string for fuzzy matching
  const cleanHeader = (str) =>
    (str || "")
      .toLowerCase()
      .replace(/[_\-\.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // Pattern-first column matcher: ensures patterns listed earlier take strict precedence
  const findCol = (patterns) => {
    for (const p of patterns) {
      const target = cleanHeader(p);
      for (const h of headers) {
        const norm = cleanHeader(h);
        if (norm.includes(target)) return h;
      }
    }
    return null;
  };

  // Tranche release column patterns
  const balanceFundPatterns = [
    "balance fund subsidy amount now to be released",
    "balance fund subsidy amount in rs",
    "balance fund subsidy amount",
    "balance fund now to be released",
    "balance fund amount",
    "balance fund",
    "balance 45",
    "balance 40",
    "45% released",
    "40% released",
    "45%",
    "40%",
  ];

  const firstFundPatterns = [
    "first fund subsidy amount now to be released",
    "first fund subsidy amount in rs",
    "first fund subsidy amount",
    "first fund now to be released",
    "first fund amount",
    "first fund",
    "first 55",
    "first 60",
    "55% released",
    "60% released",
    "55%",
    "60%",
  ];

  // 1. Detect Fund Percentage and the "Now to be Released" column
  let detectedPercentage = null;
  let releasedCol = null;

  if (overrideFundPercentage) {
    detectedPercentage = parseFloat(overrideFundPercentage);
    if (detectedPercentage <= 50) {
      releasedCol = findCol(balanceFundPatterns);
    } else {
      releasedCol = findCol(firstFundPatterns);
    }
  } else {
    // 1a. Detect from filename if present
    const fname = (originalFilename || "").toLowerCase();
    if (fname.includes("60%") || fname.includes("60pct") || fname.includes("60_") || fname.includes("60-") || fname.includes("60.")) {
      detectedPercentage = 60.0;
    } else if (fname.includes("40%") || fname.includes("40pct") || fname.includes("40_") || fname.includes("40-") || fname.includes("40.")) {
      detectedPercentage = 40.0;
    } else if (fname.includes("45%") || fname.includes("45pct") || fname.includes("45_") || fname.includes("45-") || fname.includes("45.")) {
      detectedPercentage = 45.0;
    } else if (fname.includes("55%") || fname.includes("55pct") || fname.includes("55_") || fname.includes("55-") || fname.includes("55.")) {
      detectedPercentage = 55.0;
    }

    if (detectedPercentage) {
      if (detectedPercentage <= 50) {
        releasedCol = findCol(balanceFundPatterns);
      } else {
        releasedCol = findCol(firstFundPatterns);
      }
    } else {
      // 1b. Content/Header detection:
      // If a Balance Fund column exists in the sheet, this proceeding is releasing the balance fund (45% or 40%)
      const balanceCol = findCol(balanceFundPatterns);
      const firstCol = findCol(firstFundPatterns);

      if (balanceCol) {
        detectedPercentage = 45.0;
        releasedCol = balanceCol;
        for (const h of headers) {
          const norm = cleanHeader(h);
          if (norm.includes("40%") || norm.includes("40 %") || norm.includes("40 percent") || norm.includes("sparsh 40")) {
            detectedPercentage = 40.0;
            break;
          }
        }
      } else if (firstCol) {
        detectedPercentage = 55.0;
        releasedCol = firstCol;
        for (const h of headers) {
          const norm = cleanHeader(h);
          if (norm.includes("60%") || norm.includes("60 %") || norm.includes("60 percent") || norm.includes("sparsh 60")) {
            detectedPercentage = 60.0;
            break;
          }
        }
      }
    }
  }

  // 1c. Generic fallback for released column if not matched above
  if (!releasedCol) {
    releasedCol = findCol([
      "now to be released in rs",
      "amount now to be released",
      "now to be released",
      "released in rs",
      "subsidy released",
      "now released",
      "amount released",
    ]);
  }

  if (!detectedPercentage) {
    detectedPercentage = 55.0;
  }

  // 2. Identify remaining column mappings dynamically with robust normalization
  const appIdCol = findCol(["application id", "app id", "appl id", "application number", "application no"]);
  if (!appIdCol) {
    throw new AppError(
      "Missing mandatory column: 'Application ID' not found in uploaded Excel file headers.",
      400
    );
  }

  const farmerNameCol = findCol(["name of the farmer", "farmer name", "beneficiary name", "farmer", "beneficiary"]);
  const districtCol = findCol(["district", "district name"]);
  const blockCol = findCol(["block", "taluk", "block name"]);
  const villageCol = findCol(["village", "revenue village", "village name"]);
  const invoiceDateCol = findCol(["invoice date", "inv date", "date of invoice"]);
  const invoiceNoCol = findCol(["invoice no", "invoice number", "inv no", "bill no"]);

  const stateRestrictedCol = findCol([
    "state restricted amount (in rs)",
    "state restricted amount in rs",
    "state restricted amount",
    "state restricted",
  ]);

  const invoiceAmtCol = findCol([
    "invoice amount (in rs)",
    "invoice amount in rs",
    "invoice amount",
    "total invoice amount",
    "inv amount",
    "invoice value",
  ]);

  // Subsidy Eligible: Prioritize State Restricted Amount as per Cheran business rules, then subsidy eligible headers, then quotation subsidy, fallback invoice amount
  const subsidyEligibleCol =
    stateRestrictedCol ||
    findCol([
      "subsidy eligible amount (in rs)",
      "subsidy eligible amount in rs",
      "subsidy eligible amount",
      "subsidy eligible",
      "quotation subsidy amount",
      "quotation subsidy",
      "total subsidy amount",
    ]) ||
    invoiceAmtCol;

  const gstAmtCol = findCol([
    "gst amount",
    "adll state share gst amount",
    "addl state share gst amount",
    "gst amount in rs",
    "gst amount rs",
  ]);
  const goiShareCol = findCol(["goi share amount", "goi share", "central share amount", "central share"]);
  const stateShareCol = findCol(["state share amount", "state share", "tn share amount"]);
  const addlStateShareCol = findCol(["addl state share amount", "addl state share", "additional state share"]);
  const proceedingNoCol = findCol(["proceeding no.", "proceeding no", "proceeding number", "proceedings no"]);
  const utrNoCol = findCol(["utr no", "utr number", "treasury utr no", "first fund utr no"]);
  const utrDateCol = findCol(["utr date", "first fund utr date", "treasury utr date"]);
  const farmerContribCol = findCol([
    "farmer contribution (in rs)",
    "farmer contribution in rs",
    "farmer contribution rs 25",
    "farmer contribution rs",
    "farmer contribution 25",
    "farmer contribution",
    "farmer share amount",
    "farmer share in rs",
    "farmer share rs",
    "farmer share",
    "beneficiary contribution",
    "beneficiary share",
    "fc amount (in rs)",
    "fc amount in rs",
    "fc amount rs",
    "fc amount",
    "fc amt",
    "fc rs",
    "fc",
  ]);

  let firstProceedingNo = null;

  const parsedRows = rawRows.map((r, idx) => {
    const rawAppId = r[appIdCol] ? String(r[appIdCol]).trim() : null;
    const farmerName = farmerNameCol && r[farmerNameCol] ? String(r[farmerNameCol]).trim() : null;
    const district = districtCol && r[districtCol] ? String(r[districtCol]).trim() : null;
    const block = blockCol && r[blockCol] ? String(r[blockCol]).trim() : null;
    const village = villageCol && r[villageCol] ? String(r[villageCol]).trim() : null;
    const invoiceNo = invoiceNoCol && r[invoiceNoCol] && r[invoiceNoCol] !== "-" ? String(r[invoiceNoCol]).trim() : null;
    
    // Parse Date
    const rawInvDate = invoiceDateCol ? r[invoiceDateCol] : null;
    const parsedInvDate = parseExcelDate(rawInvDate);

    // Financial Values
    const releasedAmt = releasedCol ? parseFloat(r[releasedCol]) || 0 : 0;
    const stateRestrictedAmt = stateRestrictedCol ? parseFloat(r[stateRestrictedCol]) || 0 : 0;
    const subsidyEligibleAmt = subsidyEligibleCol ? parseFloat(r[subsidyEligibleCol]) || 0 : 0;
    const invoiceAmt = invoiceAmtCol ? parseFloat(r[invoiceAmtCol]) || 0 : 0;
    const farmerContribAmt = farmerContribCol ? parseFloat(r[farmerContribCol]) || 0 : 0;
    const gstAmt = gstAmtCol ? parseFloat(r[gstAmtCol]) || 0 : 0;
    const goiShare = goiShareCol ? parseFloat(r[goiShareCol]) || 0 : 0;
    const stateShare = stateShareCol ? parseFloat(r[stateShareCol]) || 0 : 0;
    const addlStateShare = addlStateShareCol ? parseFloat(r[addlStateShareCol]) || 0 : 0;

    const procNo = proceedingNoCol && r[proceedingNoCol] && r[proceedingNoCol] !== "-" ? String(r[proceedingNoCol]).trim() : null;
    if (procNo && !firstProceedingNo) {
      firstProceedingNo = procNo;
    }

    const utrNo = utrNoCol && r[utrNoCol] && r[utrNoCol] !== "-" ? String(r[utrNoCol]).trim() : null;
    const rawUtrDate = utrDateCol ? r[utrDateCol] : null;
    const parsedUtrDate = parseExcelDate(rawUtrDate);

    return {
      row_index: idx + 1,
      application_id: rawAppId,
      farmer_name: farmerName,
      district,
      block,
      village,
      invoice_number: invoiceNo,
      invoice_date: parsedInvDate,
      subsidy_eligible_amount: Math.round((stateRestrictedAmt || subsidyEligibleAmt) * 100) / 100,
      state_restricted_amount: Math.round((stateRestrictedAmt || subsidyEligibleAmt) * 100) / 100,
      invoice_amount: Math.round(invoiceAmt * 100) / 100,
      farmer_contribution: Math.round(farmerContribAmt * 100) / 100,
      now_to_be_released_amount: Math.round(releasedAmt * 100) / 100,
      excel_gst_amount: Math.round(gstAmt * 100) / 100,
      goi_share_amount: Math.round(goiShare * 100) / 100,
      state_share_amount: Math.round(stateShare * 100) / 100,
      addl_state_share_amount: Math.round(addlStateShare * 100) / 100,
      proceeding_no: procNo,
      utr_no: utrNo,
      utr_date: parsedUtrDate,
    };
  }).filter((r) => r.application_id && r.application_id.length > 0);

  return {
    file_name: originalFilename,
    detected_fund_percentage: detectedPercentage,
    released_column_name: releasedCol || "Now to be Released",
    proceeding_no: firstProceedingNo,
    total_rows_count: parsedRows.length,
    rows: parsedRows,
  };
}
