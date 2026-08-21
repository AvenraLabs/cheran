/**
 * Financial calculation utilities for Cheran ERP
 * Uses explicit 2-decimal rounded arithmetic for all invoice & commission operations.
 */

/**
 * Calculate complete invoice breakdown from line items:
 * 1. ITEM NET TOTAL = sum(quantity * unit_price)
 * 2. FITTINGS COST = 5% of ITEM NET TOTAL
 * 3. SUBTOTAL = ITEM NET TOTAL + FITTINGS COST
 * 4. GST = 5% of SUBTOTAL (calculated AFTER fittings)
 * 5. FINAL INVOICE AMOUNT = SUBTOTAL + GST
 */
export function calculateInvoiceTotals(items = [], fittingsPct = 5.0, gstPct = 5.0) {
  const effectiveFittingsPct = parseFloat(fittingsPct) || 5.0;
  const effectiveGstPct = parseFloat(gstPct) || 5.0;

  let itemNetTotal = 0;
  const processedItems = (items || []).map((item) => {
    const qty = parseFloat(item.quantity || 0) || 0;
    const price = parseFloat(item.unit_price !== undefined ? item.unit_price : item.rate || 0) || 0;
    const lineTotal = Math.round(qty * price * 100) / 100;
    itemNetTotal += lineTotal;
    return {
      ...item,
      quantity: qty,
      unit_price: price,
      line_total: lineTotal,
    };
  });

  itemNetTotal = Math.round(itemNetTotal * 100) / 100;
  const fittingsAmount = Math.round(((itemNetTotal * effectiveFittingsPct) / 100.0) * 100) / 100;
  const subtotalBeforeGst = Math.round((itemNetTotal + fittingsAmount) * 100) / 100;
  const gstAmount = Math.round(((subtotalBeforeGst * effectiveGstPct) / 100.0) * 100) / 100;
  const grandTotal = Math.round((subtotalBeforeGst + gstAmount) * 100) / 100;

  return {
    items: processedItems,
    item_net_total: itemNetTotal,
    fittings_percentage: effectiveFittingsPct,
    fittings_amount: fittingsAmount,
    subtotal_before_gst: subtotalBeforeGst,
    gst_percentage: effectiveGstPct,
    gst_amount: gstAmount,
    grand_total: grandTotal,
  };
}

/**
 * Calculate Commission Base from Quotation Subsidy Amount:
 * Quotation Subsidy Amount in Government Excel includes +Fittings % and +GST % added sequentially.
 * Formula:
 * Base = Quotation Subsidy Amount / (1 + GST% / 100) / (1 + Fittings% / 100)
 */
export function calculateCommissionBase(quotationSubsidyAmount, gstPercentage = 5.0, fittingsPercentage = 5.0) {
  const amount = parseFloat(quotationSubsidyAmount) || 0;
  if (amount <= 0) return 0.0;
  const gstFactor = 1 + (parseFloat(gstPercentage) || 0) / 100.0;
  const fittingsFactor = 1 + (parseFloat(fittingsPercentage) || 0) / 100.0;
  const base = amount / gstFactor / fittingsFactor;
  return Math.round(base * 100) / 100;
}

/**
 * Calculate full breakdown of Quotation Subsidy:
 * - Amount Before GST = Subsidy / (1 + GST%)
 * - Net Base = Amount Before GST / (1 + Fittings%)
 * - Fittings Amount = Amount Before GST - Net Base
 * - GST Amount = Subsidy - Amount Before GST
 */
export function calculateCommissionAndFittingsBreakdown(quotationSubsidyAmount, gstPercentage = 5.0, fittingsPercentage = 5.0) {
  const amount = parseFloat(quotationSubsidyAmount) || 0;
  if (amount <= 0) {
    return {
      subsidy_amount: 0.0,
      amount_before_gst: 0.0,
      base_amount: 0.0,
      fittings_amount: 0.0,
      gst_amount: 0.0,
      gst_percentage: parseFloat(gstPercentage) || 5.0,
      fittings_percentage: parseFloat(fittingsPercentage) || 5.0,
    };
  }

  const effectiveGstPct = parseFloat(gstPercentage) || 5.0;
  const effectiveFittingsPct = parseFloat(fittingsPercentage) || 5.0;

  const gstFactor = 1 + effectiveGstPct / 100.0;
  const fittingsFactor = 1 + effectiveFittingsPct / 100.0;

  const amountBeforeGst = amount / gstFactor;
  const netBase = Math.round((amountBeforeGst / fittingsFactor) * 100) / 100;
  const fittingsAmount = Math.round((amountBeforeGst - netBase) * 100) / 100;
  const gstAmount = Math.round((amount - amountBeforeGst) * 100) / 100;

  return {
    subsidy_amount: Math.round(amount * 100) / 100,
    amount_before_gst: Math.round(amountBeforeGst * 100) / 100,
    base_amount: netBase,
    fittings_amount: fittingsAmount,
    gst_amount: gstAmount,
    gst_percentage: effectiveGstPct,
    fittings_percentage: effectiveFittingsPct,
  };
}

/**
 * Calculate Dealer Commission from Quotation Subsidy Amount and Dealer Commission %
 */
export function calculateDealerCommission(quotationSubsidyAmount, commissionPercentage, gstPercentage = 5.0, fittingsPercentage = 5.0) {
  const base = calculateCommissionBase(quotationSubsidyAmount, gstPercentage, fittingsPercentage);
  const pct = parseFloat(commissionPercentage) || 0;
  if (base <= 0 || pct <= 0) return 0.0;
  return Math.round(((base * pct) / 100.0) * 100) / 100;
}
