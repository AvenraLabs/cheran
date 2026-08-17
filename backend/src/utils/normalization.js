/**
 * Normalizes dealer names for deterministic exact matching.
 * "  ABC Irrigation  Pvt Ltd " -> "abc irrigation pvt ltd"
 */
export function normalizeDealerName(name) {
  if (!name) return "";
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\s\t\n\r]+/g, " ")
    .replace(/[^\w\s\.\,\-\&]/g, "");
}

/**
 * Normalizes Excel column header names.
 * "Application Id", "Application ID", "application_id", " Application  ID " -> "application_id"
 */
export function normalizeColumnHeader(header) {
  if (!header) return "";
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Normalizes Application IDs as deterministic strings.
 * Prevents scientific notation or accidental truncation.
 */
export function normalizeApplicationId(appId) {
  if (appId === null || appId === undefined) return "";
  return String(appId).trim();
}

/**
 * Generic string trimmer that returns null if empty.
 */
export function cleanString(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  return str.length > 0 ? str : null;
}
