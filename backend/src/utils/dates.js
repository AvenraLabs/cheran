/**
 * Robust date parser for government Excel files.
 * Handles:
 * - Excel serial date numbers (e.g. 44561)
 * - Strings in DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, etc.
 * - JS Date objects
 * Returns ISO date string 'YYYY-MM-DD' or null if blank/invalid.
 */
export function parseExcelDate(val) {
  if (val === null || val === undefined || val === "") {
    return null;
  }

  // If already a JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split("T")[0];
  }

  // If numeric Excel serial date number
  if (typeof val === "number" || (!isNaN(val) && typeof val === "string" && !isNaN(parseFloat(val)) && !val.includes("/") && !val.includes("-"))) {
    const num = parseFloat(val);
    if (num <= 0) return null;
    
    // Excel 1900 date system (serial 1 is 1899-12-31 / 1900-01-01)
    // There is a known 1900 leap year bug in Excel (day 60 is phantom 1900-02-29)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 86400000;
    const dateObj = new Date(excelEpoch.getTime() + num * msPerDay);

    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toISOString().split("T")[0];
  }

  const str = String(val).trim();
  if (!str || str === "-" || str.toLowerCase() === "null" || str.toLowerCase() === "na" || str.toLowerCase() === "n/a") {
    return null;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  // Fallback to standard Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return null;
}

/**
 * Calculates the number of days between two YYYY-MM-DD date strings.
 */
export function calculateDaysBetween(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return null;
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;

  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
