import * as proceedingService from "./proceeding.service.js";

/**
 * GET /api/proceedings/fund-percentages
 */
export async function getFundPercentages(req, res, next) {
  try {
    const slabs = await proceedingService.listFundPercentages();
    res.json({ status: "success", fund_percentages: slabs });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/proceedings/fund-percentages
 */
export async function createFundPercentage(req, res, next) {
  try {
    const slab = await proceedingService.createFundPercentage(req.body);
    res.status(201).json({ status: "success", fund_percentage: slab });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/proceedings/fund-percentages/:id
 */
export async function deleteFundPercentage(req, res, next) {
  try {
    await proceedingService.deleteFundPercentage(req.params.id);
    res.json({ status: "success", message: "Fund percentage slab deactivated" });
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
 * POST /api/proceedings/preview-ids
 */
export async function previewProceedingIds(req, res, next) {
  try {
    const result = await proceedingService.previewProceedingIds(req.body);
    res.json({ status: "success", preview: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/proceedings
 */
export async function createProceedingBatch(req, res, next) {
  try {
    const batch = await proceedingService.createProceedingBatch(req.body);
    res.status(201).json({ status: "success", batch });
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
    });
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
