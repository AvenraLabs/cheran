import * as proceedingService from "./proceeding.service.js";
import AppError from "../../shared/appError.js";

/**
 * POST /api/proceedings/preview-excel
 * Accepts multipart/form-data with `file`
 */
export async function previewProceedingExcel(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError("Please upload a valid Excel file (.xls or .xlsx)", 400);
    }

    const originalFilename = req.file.originalname || "proceeding.xls";
    const includeFittingsParam =
      req.body.include_fittings !== undefined
        ? req.body.include_fittings
        : req.query.include_fittings;

    const preview = await proceedingService.previewProceedingExcel(
      req.file.buffer,
      originalFilename,
      includeFittingsParam !== undefined ? includeFittingsParam === "true" || includeFittingsParam === true : null
    );

    res.json({
      status: "success",
      preview,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/proceedings/import-excel
 * Accepts multipart/form-data with `file` and optional fields
 */
export async function importProceedingExcel(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      throw new AppError("Please upload a valid Excel file (.xls or .xlsx)", 400);
    }

    const {
      proceeding_no,
      proceeding_date,
      fund_percentage_value,
      include_fittings,
      skip_unmatched,
      payment_received_date,
      payment_received_ref,
      notes,
    } = req.body;

    const originalFilename = req.file.originalname || "proceeding.xls";
    const batch = await proceedingService.importProceedingBatch({
      file_buffer: req.file.buffer,
      original_filename: originalFilename,
      proceeding_no,
      proceeding_date,
      fund_percentage_value,
      include_fittings: include_fittings !== undefined ? include_fittings === "true" || include_fittings === true : null,
      skip_unmatched: skip_unmatched === "true" || skip_unmatched === true,
      payment_received_date,
      payment_received_ref,
      notes,
    });

    res.status(201).json({
      status: "success",
      batch,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/proceedings
 */
export async function listProceedingBatches(req, res, next) {
  try {
    const result = await proceedingService.listProceedingBatches(req.query);
    res.json({
      status: "success",
      batches: result.batches,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/proceedings/:id
 */
export async function getProceedingBatchById(req, res, next) {
  try {
    const result = await proceedingService.getProceedingBatchById(req.params.id);
    res.json({
      status: "success",
      batch: result.batch,
      dealer_summaries: result.dealer_summaries,
      unmatched_in_db_count: result.unmatched_in_db_count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/proceedings/:id/recalculate
 */
export async function recalculateProceedingBatch(req, res, next) {
  try {
    const result = await proceedingService.recalculateProceedingBatch(req.params.id);
    res.json({
      status: "success",
      batch: result.batch,
      dealer_summaries: result.dealer_summaries,
      unmatched_in_db_count: result.unmatched_in_db_count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/proceedings/:id/proceeding-date
 */
export async function updateProceedingDate(req, res, next) {
  try {
    const batch = await proceedingService.updateProceedingDate(req.params.id, req.body);
    res.json({ status: "success", batch });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/proceedings/:id/bank-receipt
 */
export async function updateBankPaymentReceipt(req, res, next) {
  try {
    const batch = await proceedingService.updateBankPaymentReceipt(req.params.id, req.body);
    res.json({ status: "success", batch });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/proceedings/:id/mark-dealer-paid
 */
export async function markDealerPayout(req, res, next) {
  try {
    const result = await proceedingService.markDealerPayout(req.params.id, req.body);
    res.json({
      status: "success",
      batch: result.batch,
      dealer_summaries: result.dealer_summaries,
      unmatched_in_db_count: result.unmatched_in_db_count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/proceedings/:id/projects/:projectRecordId/penalty
 */
export async function updateProjectPenalty(req, res, next) {
  try {
    const result = await proceedingService.updateProjectPenalty(
      req.params.id,
      req.params.projectRecordId,
      req.body
    );
    res.json({
      status: "success",
      batch: result.batch,
      dealer_summaries: result.dealer_summaries,
      unmatched_in_db_count: result.unmatched_in_db_count,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/proceedings/:id
 */
export async function deleteProceedingBatch(req, res, next) {
  try {
    await proceedingService.deleteProceedingBatch(req.params.id);
    res.json({ status: "success", message: "Proceeding batch deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/proceedings/dealer-statement
 */
export async function getDealerCommissionStatement(req, res, next) {
  try {
    const result = await proceedingService.getDealerCommissionStatement(req.query);
    res.json({
      status: "success",
      projects: result.projects,
      summary: result.summary,
      selectedDealer: result.selectedDealer,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}
