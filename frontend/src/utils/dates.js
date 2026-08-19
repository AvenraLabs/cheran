/**
 * Standardized Date Formatting Utility (DD/MM/YYYY)
 */

/**
 * Formats any date / ISO string to DD/MM/YYYY
 * @param {string|Date|number|null} val
 * @returns {string} e.g. "19/08/2026" or "—"
 */
export function formatDate(val) {
  if (!val) return "—";

  if (typeof val === "string") {
    const clean = val.trim();
    // YYYY-MM-DD
    const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dmyMatch) {
      return `${dmyMatch[1].padStart(2, "0")}/${dmyMatch[2].padStart(2, "0")}/${dmyMatch[3]}`;
    }
  }

  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats date and time to DD/MM/YYYY, HH:MM
 */
export function formatDateTime(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime())) return formatDate(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${mins}`;
}

export default formatDate;
