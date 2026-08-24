import { Op } from "sequelize";
import SchemeTaxSlab from "./scheme-tax-slab.model.js";
import AppError from "../../shared/appError.js";

/**
 * List all Scheme Tax Slabs ordered by effective_from ascending
 */
export async function listTaxSlabs() {
  const slabs = await SchemeTaxSlab.findAll({
    order: [["effective_from", "ASC"]],
  });
  return slabs;
}

/**
 * Get effective GST rate and Fittings rate for a given project date
 */
export async function getEffectiveSchemeTaxSlab(projectDate) {
  const targetDate = projectDate
    ? String(projectDate).trim().slice(0, 10)
    : new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

  const slab = await SchemeTaxSlab.findOne({
    where: {
      effective_from: { [Op.lte]: targetDate },
      [Op.or]: [
        { effective_to: null },
        { effective_to: { [Op.gte]: targetDate } },
      ],
    },
    order: [["effective_from", "DESC"]],
  });

  if (slab) {
    return {
      gst_percentage: parseFloat(slab.gst_percentage),
      fittings_percentage: parseFloat(slab.fittings_percentage),
      description: slab.description,
      effective_from: slab.effective_from,
      effective_to: slab.effective_to,
      matched_date: targetDate,
    };
  }

  // Fallback if no matching DB record (22-09-2025 boundary)
  const isPreSep2025 = targetDate < "2025-09-22";
  return {
    gst_percentage: isPreSep2025 ? 12.0 : 5.0,
    fittings_percentage: 5.0,
    description: isPreSep2025
      ? "Pre-Sep 2025 Scheme Rate (12% GST)"
      : "Post-Sep 2025 Scheme Rate (5% GST)",
    effective_from: isPreSep2025 ? "2000-01-01" : "2025-09-22",
    effective_to: isPreSep2025 ? "2025-09-21" : null,
    matched_date: targetDate,
  };
}

/**
 * Helper to check date range conflicts against existing slabs
 */
async function validateNoDateRangeOverlap(cleanFrom, cleanTo, excludeId = null) {
  const allSlabs = await SchemeTaxSlab.findAll();
  const newEnd = cleanTo || "9999-12-31";

  for (const existing of allSlabs) {
    if (excludeId && existing.id === excludeId) continue;

    const existingFrom = existing.effective_from;
    const existingTo = existing.effective_to || "9999-12-31";

    // Two intervals [A, B] and [C, D] overlap if A <= D and B >= C
    if (cleanFrom <= existingTo && newEnd >= existingFrom) {
      const label = existing.description || `${existing.gst_percentage}% GST`;
      const fromStr = existing.effective_from;
      const toStr = existing.effective_to ? existing.effective_to : "Ongoing";
      const newToStr = cleanTo ? cleanTo : "Ongoing";
      throw new AppError(
        `Date conflict: The date range (${cleanFrom} to ${newToStr}) clashes with existing tax slab '${label}' (${fromStr} to ${toStr}). Tax slabs cannot have overlapping date ranges.`,
        400
      );
    }
  }
}

/**
 * Create a new Scheme Tax Slab
 */
export async function createTaxSlab({
  effective_from,
  effective_to = null,
  gst_percentage,
  fittings_percentage = 5.0,
  description = null,
}) {
  if (!effective_from) {
    throw new AppError("Effective from date is required", 400);
  }
  if (gst_percentage === undefined || gst_percentage === null) {
    throw new AppError("GST percentage is required", 400);
  }

  const cleanFrom = String(effective_from).trim().slice(0, 10);
  const cleanTo = effective_to ? String(effective_to).trim().slice(0, 10) : null;

  if (cleanTo && cleanTo < cleanFrom) {
    throw new AppError("Effective to date cannot be earlier than effective from date", 400);
  }

  // Prevent date clashing/overlapping with existing tax slabs
  await validateNoDateRangeOverlap(cleanFrom, cleanTo);

  const slab = await SchemeTaxSlab.create({
    effective_from: cleanFrom,
    effective_to: cleanTo,
    gst_percentage: parseFloat(gst_percentage),
    fittings_percentage: parseFloat(fittings_percentage) || 5.0,
    description: description ? description.trim() : null,
  });

  return slab;
}

/**
 * Update an existing Scheme Tax Slab
 */
export async function updateTaxSlab(id, data) {
  const slab = await SchemeTaxSlab.findByPk(id);
  if (!slab) {
    throw new AppError(`Tax Slab with ID ${id} not found`, 404);
  }

  const cleanFrom = data.effective_from !== undefined
    ? String(data.effective_from).trim().slice(0, 10)
    : slab.effective_from;

  const cleanTo = data.effective_to !== undefined
    ? (data.effective_to ? String(data.effective_to).trim().slice(0, 10) : null)
    : slab.effective_to;

  if (cleanTo && cleanTo < cleanFrom) {
    throw new AppError("Effective to date cannot be earlier than effective from date", 400);
  }

  // Prevent date clashing/overlapping with existing tax slabs
  await validateNoDateRangeOverlap(cleanFrom, cleanTo, id);

  const updatePayload = {
    effective_from: cleanFrom,
    effective_to: cleanTo,
  };

  if (data.gst_percentage !== undefined) {
    updatePayload.gst_percentage = parseFloat(data.gst_percentage);
  }
  if (data.fittings_percentage !== undefined) {
    updatePayload.fittings_percentage = parseFloat(data.fittings_percentage);
  }
  if (data.description !== undefined) {
    updatePayload.description = data.description ? data.description.trim() : null;
  }

  await slab.update(updatePayload);
  return slab;
}

/**
 * Delete a Scheme Tax Slab
 */
export async function deleteTaxSlab(id) {
  const slab = await SchemeTaxSlab.findByPk(id);
  if (!slab) {
    throw new AppError(`Tax Slab with ID ${id} not found`, 404);
  }

  await slab.destroy();
  return { message: "Tax slab deleted successfully" };
}
