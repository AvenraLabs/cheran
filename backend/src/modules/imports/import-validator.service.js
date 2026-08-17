import GovernmentStatus from "../statuses/status.model.js";
import AppError from "../../shared/appError.js";

export const REQUIRED_FIELDS = [
  "application_id",
  "current_status",
  "farmer_name",
  "district",
  "block",
  "village",
];

export async function validateImportHeaders(fieldMapping) {
  const missing = [];
  for (const field of REQUIRED_FIELDS) {
    if (fieldMapping[field] === undefined) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new AppError(
      `Excel validation failed: Missing required columns: [${missing.join(", ")}]. Please ensure all required columns are present.`,
      400,
      { missingColumns: missing }
    );
  }
}

export async function getValidStatusesMap() {
  const statuses = await GovernmentStatus.findAll({
    where: { is_active: true },
    attributes: ["name"],
  });

  const validMap = new Set();
  statuses.forEach((s) => validMap.add(s.name.trim()));
  return validMap;
}
