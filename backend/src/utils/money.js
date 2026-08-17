/**
 * Sanitizes and parses financial / numeric amounts into valid strings for Postgres DECIMAL/NUMERIC.
 * Returns null if empty, blank, or "-" (unless specifically 0).
 */
export function parseDecimal(val) {
  if (val === null || val === undefined) return null;

  if (typeof val === "number") {
    if (isNaN(val)) return null;
    return val.toFixed(2);
  }

  const str = String(val).trim();
  if (str === "" || str === "-" || str.toLowerCase() === "null" || str.toLowerCase() === "na" || str.toLowerCase() === "n/a") {
    return null;
  }

  // Remove commas, spaces, currency symbols (₹, $, Rs., etc.)
  const cleanStr = str.replace(/[₹\$Rs\.\,\s]/g, (match) => (match === "." ? "." : ""));
  
  // Extract clean decimal pattern
  const matched = cleanStr.match(/^-?\d+(\.\d+)?$/);
  if (!matched) {
    // Try float parsing
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return null;
    return num.toFixed(2);
  }

  return cleanStr;
}

/**
 * Sanitizes integer quantities (like no_of_days_pending).
 */
export function parseIntSafe(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return Math.round(val);
  const str = String(val).trim().replace(/[,\s]/g, "");
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}
