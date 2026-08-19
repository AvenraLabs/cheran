import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import Invoice from "../invoices/invoice.model.js";
import InvoiceItem from "../invoices/invoice-item.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import TallyItemMapping from "./tally-item-mapping.model.js";
import AppError from "../../shared/appError.js";

/**
 * Robustly extract government project ID from Tally address and basicbuyeraddress arrays
 */
export function extractGovernmentProjectId(addressArray = [], buyerAddressArray = []) {
  const combined = [...(addressArray || []), ...(buyerAddressArray || [])];
  const stringLines = [];

  for (const item of combined) {
    if (typeof item === "string" && item.trim()) {
      stringLines.push(item.trim());
    }
  }

  // Regex patterns for Government Application / Project IDs
  // Examples:
  // H-DPR-mpr-4218321819-2025-26
  // A-DPR-krm-2507740317-2026-27
  // H-KGI-kvpm-6061544423-2026-27
  // H-DPR-dpr-3471796534-2025-26
  // H-DPR-mpr-187638309-2026-27
  const projectRegex = /([A-Za-z]-[A-Za-z0-9]{2,6}-[A-Za-z0-9]+-\d+-\d{2,4}-\d{2,4})/i;
  const genericGovRegex = /([A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-\d{4,}-\d{2,4}-\d{2,4})/i;

  for (const line of stringLines) {
    const cleanLine = line.replace(/[\t\r\n]/g, " ").trim();
    const match = cleanLine.match(projectRegex) || cleanLine.match(genericGovRegex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Format Tally date 'YYYYMMDD' or 'YYYY-MM-DD' to ISO standard 'YYYY-MM-DD'
 */
export function parseTallyDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const cleaned = String(dateStr).trim();
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

/**
 * Parse numeric quantity and unit symbol from Tally string like "72 MTS" or numeric 72
 */
export function parseQuantityAndUnit(qtyVal) {
  if (qtyVal === undefined || qtyVal === null) return { quantity: 0, unit: "NOS" };
  if (typeof qtyVal === "number") return { quantity: qtyVal, unit: "NOS" };

  const str = String(qtyVal).trim();
  const match = str.match(/^([+-]?\d+(?:\.\d+)?)\s*(.*)$/);
  if (match) {
    const quantity = parseFloat(match[1]) || 0;
    const unit = match[2] ? match[2].trim() : "NOS";
    return { quantity, unit };
  }

  const num = parseFloat(str);
  return { quantity: isNaN(num) ? 0 : num, unit: "NOS" };
}

/**
 * Parse numeric rate from Tally rate string like "80.00/MTS"
 */
export function parseRate(rateVal) {
  if (rateVal === undefined || rateVal === null) return 0;
  if (typeof rateVal === "number") return rateVal;
  const str = String(rateVal).trim();
  const match = str.match(/^([+-]?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) || 0 : 0;
}

/**
 * Parse Tally inventory entries from allinventoryentries (handles array, object, or nested)
 */
export function parseInventoryEntries(entries = []) {
  if (!entries) return [];

  let rawList = entries;
  if (typeof entries === "object" && !Array.isArray(entries)) {
    if (Array.isArray(entries.list)) {
      rawList = entries.list;
    } else if (Array.isArray(entries.allinventoryentries)) {
      rawList = entries.allinventoryentries;
    } else {
      rawList = [entries];
    }
  }

  if (!Array.isArray(rawList)) return [];
  const results = [];

  for (const entry of rawList) {
    if (!entry || typeof entry !== "object") continue;

    const stockitemname = entry.stockitemname || entry.itemname || entry.item || "Standard Item";
    const { quantity: actualQty, unit: actualUnit } = parseQuantityAndUnit(entry.actualqty || entry.billedqty || entry.qty || 1);
    const { quantity: billedQty } = parseQuantityAndUnit(entry.billedqty || entry.actualqty || entry.qty || 1);
    const rate = parseRate(entry.rate);
    const amount =
      entry.amount !== undefined && entry.amount !== null
        ? Math.abs(parseFloat(entry.amount) || 0)
        : actualQty * rate;
    const hsn_code = entry.gsthsnname || entry.hsncode || null;

    results.push({
      stockitemname: String(stockitemname).trim(),
      quantity: actualQty,
      billed_quantity: billedQty,
      unit: actualUnit,
      rate,
      amount,
      hsn_code,
    });
  }

  return results;
}

/**
 * Parse Tally ledger entries to extract Tax, Rounding, and Party Grand Total
 */
export function parseLedgerEntries(voucher) {
  let ledgers =
    voucher.allledgerentries ||
    voucher.ledgerentries ||
    voucher.ledgerentrieslist ||
    [];

  if (ledgers && typeof ledgers === "object" && !Array.isArray(ledgers)) {
    if (Array.isArray(ledgers.list)) {
      ledgers = ledgers.list;
    } else if (Array.isArray(ledgers.allledgerentries)) {
      ledgers = ledgers.allledgerentries;
    } else {
      ledgers = [ledgers];
    }
  }

  if (!Array.isArray(ledgers)) ledgers = [];

  let taxAmount = 0;
  let roundingAmount = 0;
  let partyAmount = 0;
  let otherCharges = 0;

  const partyNameLower = String(voucher.partyname || voucher.partyledgername || "").toLowerCase().trim();
  const partyMailingLower = String(voucher.partymailingname || "").toLowerCase().trim();

  for (const entry of ledgers) {
    if (!entry || typeof entry !== "object") continue;

    const ledgerName = String(entry.ledgername || entry.ledger || "").trim();
    const ledgerLower = ledgerName.toLowerCase();
    const rawAmount = parseFloat(entry.amount) || 0;
    const absAmount = Math.abs(rawAmount);

    // Is this a GST / Tax ledger?
    if (/gst|cgst|sgst|igst|output\s*tax|vat|tax\s*ledger/i.test(ledgerLower)) {
      taxAmount += absAmount;
    }
    // Is this a Round Off ledger?
    else if (/round\s*off|rounding|round/i.test(ledgerLower)) {
      roundingAmount += rawAmount;
    }
    // Is this the Party Ledger (Grand Total)?
    else if (
      (partyNameLower && ledgerLower.includes(partyNameLower)) ||
      (partyMailingLower && ledgerLower.includes(partyMailingLower)) ||
      entry.isdeemedpositive === "Yes" ||
      entry.isdeemedpositive === true
    ) {
      partyAmount = absAmount;
    }
    // Other freight / delivery / service charge ledgers
    else if (!/sales|revenue|income/i.test(ledgerLower)) {
      otherCharges += absAmount;
    }
  }

  return {
    taxAmount,
    roundingAmount,
    partyAmount,
    otherCharges,
  };
}

/**
 * Find or create a unit matching a symbol or name
 */
export async function getOrCreateUnit(unitSymbol = "NOS", transaction = null) {
  const cleanSymbol = String(unitSymbol || "NOS").trim().toUpperCase();
  let unit = await Unit.findOne({
    where: db.Sequelize.where(
      db.Sequelize.fn("UPPER", db.Sequelize.col("symbol")),
      cleanSymbol
    ),
    transaction,
  });

  if (!unit) {
    unit = await Unit.findOne({
      where: db.Sequelize.where(
        db.Sequelize.fn("UPPER", db.Sequelize.col("name")),
        cleanSymbol
      ),
      transaction,
    });
  }

  if (!unit) {
    unit = await Unit.create(
      {
        name: cleanSymbol,
        symbol: cleanSymbol,
        is_active: true,
      },
      { transaction }
    );
  }

  return unit;
}

/**
 * Process and import Tally Sales Vouchers (Government Invoices only)
 */
export async function importTallyGovernmentInvoices(jsonData, options = {}) {
  let vouchers = [];

  if (Array.isArray(jsonData)) {
    vouchers = jsonData;
  } else if (jsonData && Array.isArray(jsonData.tallymessage)) {
    vouchers = jsonData.tallymessage;
  } else if (jsonData && Array.isArray(jsonData.body?.tallymessage)) {
    vouchers = jsonData.body.tallymessage;
  } else {
    throw new AppError("Invalid Tally JSON format. Expected tallymessage array.", 400);
  }

  // Load existing item mappings for fast in-memory lookup
  const mappings = await TallyItemMapping.findAll({
    include: [
      {
        model: Item,
        as: "item",
        include: [{ model: Unit, as: "unit" }],
      },
    ],
  });

  const mappingMap = new Map();
  for (const m of mappings) {
    if (m.tally_item_name && m.item) {
      mappingMap.set(m.tally_item_name.toLowerCase().trim(), m.item);
    }
  }

  // Summary statistics
  const summary = {
    totalVouchers: vouchers.length,
    salesVouchers: 0,
    ignoredNonSales: 0,
    ignoredDirectSales: 0,
    importedInvoices: 0,
    skippedInvoices: 0,
    newProjects: 0,
    existingProjectsLinked: 0,
    unmappedItemsCount: 0,
    unmappedItems: [],
    failed: 0,
    importedInvoiceList: [],
    errors: [],
  };

  const unmappedSet = new Set();

  for (let i = 0; i < vouchers.length; i++) {
    const voucher = vouchers[i];
    const metadata = voucher.metadata || {};

    // 1. Filter Sales vouchers ONLY
    const isSales =
      metadata.vchtype === "Sales" ||
      voucher.vouchertypename === "Sales" ||
      metadata.vchtype?.toLowerCase() === "sales" ||
      voucher.vouchertypename?.toLowerCase() === "sales";

    if (!isSales) {
      summary.ignoredNonSales++;
      continue;
    }

    summary.salesVouchers++;

    // 2. Extract Government Project ID from address
    const projectId = extractGovernmentProjectId(voucher.address, voucher.basicbuyeraddress);
    if (!projectId) {
      // Non-government direct sale -> safely ignored as per direct sales separation requirement
      summary.ignoredDirectSales++;
      continue;
    }

    // Extract core Tally identifiers & dates
    const guid = voucher.guid || metadata.guid || metadata.remoteid || `${voucher.vouchernumber}_${voucher.date}`;
    const invoiceNumber = String(voucher.vouchernumber || guid).trim();
    const invoiceDate = parseTallyDate(voucher.date || voucher.vchstatusdate);
    const remoteId = metadata.remoteid || null;
    const vchKey = metadata.vchkey || null;
    const partyName = voucher.partyname ? String(voucher.partyname).trim() : null;
    const partyMailingName = voucher.partymailingname ? String(voucher.partymailingname).trim() : null;

    // Check duplicate invoice by Tally GUID or Invoice Number
    const existing = await Invoice.findOne({
      where: db.Sequelize.or(
        ...(guid ? [{ source: "TALLY", tally_guid: guid }] : []),
        { invoice_number: invoiceNumber, invoice_type: "GOVERNMENT" }
      ),
    });

    if (existing) {
      summary.skippedInvoices++;
      continue;
    }

    // Parse inventory line items & ledger financial breakdown
    const parsedItems = parseInventoryEntries(voucher.allinventoryentries || []);
    const netItemAmount = parsedItems.reduce((sum, it) => sum + it.amount, 0);

    const { taxAmount, roundingAmount, partyAmount } = parseLedgerEntries(voucher);

    // Calculate genuine Tally financial totals
    const tallySubtotal = netItemAmount;
    const tallyTaxAmount = taxAmount;
    const tallyRounding = roundingAmount;
    const tallyGrandTotal =
      partyAmount > 0
        ? partyAmount
        : voucher.totalamount
        ? Math.abs(parseFloat(voucher.totalamount) || 0)
        : Math.round((tallySubtotal + tallyTaxAmount + tallyRounding) * 100) / 100;

    // Atomic transaction per invoice
    const transaction = await db.transaction();
    try {
      // 3. Find or Create Government Project
      let project = await GovernmentProject.findOne({
        where: { application_id: projectId },
        transaction,
      });

      let isNewProject = false;
      if (!project) {
        // Create new project with initial status INVOICED
        project = await GovernmentProject.create(
          {
            application_id: projectId,
            farmer_name: partyMailingName || partyName || "Farmer",
            current_status: "INVOICED",
            current_status_date: invoiceDate,
            invoice_date: invoiceDate,
            invoice_amount: tallyGrandTotal,
          },
          { transaction }
        );

        // Record initial status history
        await GovernmentProjectStatusHistory.create(
          {
            project_id: project.id,
            status: "INVOICED",
            status_date: invoiceDate,
            remarks: `Automatically created from Tally Sales invoice #${invoiceNumber}`,
          },
          { transaction }
        );

        isNewProject = true;
      } else {
        // Project exists: update invoice date and amount
        const updateFields = {};
        if (!project.invoice_date || new Date(invoiceDate) < new Date(project.invoice_date)) {
          updateFields.invoice_date = invoiceDate;
        }
        if (!project.invoice_amount || parseFloat(project.invoice_amount) === 0) {
          updateFields.invoice_amount = tallyGrandTotal;
        }
        if (project.current_status === "INVOICED") {
          if (!project.current_status_date || new Date(invoiceDate) < new Date(project.current_status_date)) {
            updateFields.current_status_date = invoiceDate;
          }
        }
        if (Object.keys(updateFields).length > 0) {
          await project.update(updateFields, { transaction });
        }

        // Ensure INVOICED status exists in status history as baseline
        const existingInvoicedHistory = await GovernmentProjectStatusHistory.findOne({
          where: {
            project_id: project.id,
            status: "INVOICED",
          },
          transaction,
        });

        if (!existingInvoicedHistory) {
          await GovernmentProjectStatusHistory.create(
            {
              project_id: project.id,
              status: "INVOICED",
              status_date: invoiceDate,
              remarks: `Initial invoice stage linked from Tally Sales invoice #${invoiceNumber}`,
            },
            { transaction }
          );
        } else if (!existingInvoicedHistory.status_date || new Date(invoiceDate) < new Date(existingInvoicedHistory.status_date)) {
          await existingInvoicedHistory.update({ status_date: invoiceDate }, { transaction });
        }
      }

      // 4. Create Invoice Record with explicit Tally financials
      const newInvoice = await Invoice.create(
        {
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          customer_name: partyMailingName || partyName || "Government Project Farmer",
          government_project_id: project.id,
          dealer_id: project.dealer_id || null,
          net_item_amount: tallySubtotal,
          taxable_amount: tallySubtotal,
          fittings_percentage: 0.0,
          fittings_amount: 0.0,
          gst_amount: tallyTaxAmount,
          total_amount: tallyGrandTotal,
          tally_subtotal: tallySubtotal,
          tally_tax_amount: tallyTaxAmount,
          tally_rounding: tallyRounding,
          tally_grand_total: tallyGrandTotal,
          invoice_type: "GOVERNMENT",
          status: "POSTED",
          source: "TALLY",
          tally_guid: guid,
          tally_remote_id: remoteId,
          tally_vch_key: vchKey,
          tally_voucher_number: invoiceNumber,
          party_name: partyName,
          party_mailing_name: partyMailingName,
          tally_raw_data: {
            guid,
            projectId,
            date: voucher.date,
            address: voucher.address,
            partyname: voucher.partyname,
            partymailingname: voucher.partymailingname,
            financials: {
              subtotal: tallySubtotal,
              tax: tallyTaxAmount,
              rounding: tallyRounding,
              grandTotal: tallyGrandTotal,
            },
          },
        },
        { transaction }
      );

      // 5. Create Invoice Line Items (Preserving original Tally item and leaving item_id null if unmapped - Rule 19)
      for (const it of parsedItems) {
        const lookupKey = it.stockitemname.toLowerCase().trim();
        let mappedItem = mappingMap.get(lookupKey);

        if (!mappedItem) {
          // Check if an existing item in Cheran item master matches by exact name or normalized name
          const normalized = lookupKey.replace(/[^a-z0-9]/g, "");
          const existingItem = await Item.findOne({
            where: db.Sequelize.or(
              db.Sequelize.where(
                db.Sequelize.fn("LOWER", db.Sequelize.col("name")),
                lookupKey
              ),
              { normalized_name: normalized }
            ),
            include: [{ model: Unit, as: "unit" }],
            transaction,
          });

          if (existingItem) {
            mappedItem = existingItem;
            mappingMap.set(lookupKey, mappedItem);

            // Save permanent mapping for this exact name
            await TallyItemMapping.upsert(
              {
                tally_item_name: it.stockitemname.trim(),
                item_id: existingItem.id,
              },
              { transaction }
            );
          } else {
            // Rule 19: NEVER auto-create finished goods from Tally. Leave item_id null and mark as unmapped.
            unmappedSet.add(it.stockitemname.trim());
          }
        }

        await InvoiceItem.create(
          {
            invoice_id: newInvoice.id,
            item_id: mappedItem ? mappedItem.id : null,
            item_name_snapshot: mappedItem ? mappedItem.name : it.stockitemname,
            unit_id: mappedItem ? mappedItem.unit_id : null,
            unit_snapshot: mappedItem?.unit?.symbol || it.unit || "NOS",
            tally_item_name: it.stockitemname,
            quantity: it.quantity,
            billed_quantity: it.billed_quantity,
            unit_price: it.rate,
            rate: it.rate,
            line_total: it.amount,
            hsn_code: it.hsn_code,
          },
          { transaction }
        );
      }

      await transaction.commit();

      // Only increment success counters after commit succeeds
      summary.importedInvoices++;
      if (isNewProject) {
        summary.newProjects++;
      } else {
        summary.existingProjectsLinked++;
      }

      summary.importedInvoiceList.push({
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        project_id: projectId,
        is_new_project: isNewProject,
        subtotal: tallySubtotal,
        tax_amount: tallyTaxAmount,
        rounding: tallyRounding,
        total_amount: tallyGrandTotal,
        item_count: parsedItems.length,
      });
    } catch (err) {
      await transaction.rollback();
      summary.failed++;
      summary.errors.push({
        voucher_index: i + 1,
        invoice_number: invoiceNumber,
        project_id: projectId,
        error: err.message,
      });
    }
  }

  summary.unmappedItems = Array.from(unmappedSet);
  summary.unmappedItemsCount = unmappedSet.size;

  return summary;
}

/**
 * List all Tally item mappings and any currently unmapped Tally item names from invoices
 */
export async function getTallyItemMappings() {
  const mappings = await TallyItemMapping.findAll({
    include: [
      {
        model: Item,
        as: "item",
        include: [{ model: Unit, as: "unit" }],
      },
    ],
    order: [["tally_item_name", "ASC"]],
  });

  // Find any unmapped Tally items currently present in invoice_items
  const [unmappedRows] = await db.query(`
    SELECT DISTINCT tally_item_name 
    FROM invoice_items 
    WHERE item_id IS NULL AND tally_item_name IS NOT NULL AND tally_item_name != ''
    ORDER BY tally_item_name ASC
  `);

  return {
    mappings,
    unmappedItems: unmappedRows.map((r) => r.tally_item_name),
  };
}

/**
 * Save or update a Tally item mapping and backfill existing unmapped invoice items
 */
export async function saveTallyItemMapping(tally_item_name, item_id) {
  if (!tally_item_name || !tally_item_name.trim()) {
    throw new AppError("Tally item name is required", 400);
  }
  if (!item_id) {
    throw new AppError("Cheran Item ID is required", 400);
  }

  const cleanName = tally_item_name.trim();

  const item = await Item.findByPk(item_id, {
    include: [{ model: Unit, as: "unit" }],
  });

  if (!item) {
    throw new AppError("Cheran Item not found", 404);
  }

  const [mapping] = await TallyItemMapping.upsert({
    tally_item_name: cleanName,
    item_id: item.id,
  });

  // Backfill unmapped invoice items that match this tally_item_name
  await InvoiceItem.update(
    {
      item_id: item.id,
      item_name_snapshot: item.name,
      unit_id: item.unit_id,
      unit_snapshot: item.unit?.symbol || "NOS",
    },
    {
      where: {
        tally_item_name: cleanName,
        item_id: null,
      },
    }
  );

  return mapping;
}

/**
 * Create a new Finished Good item from a Tally item name, save the mapping, and backfill
 */
export async function createFinishedGoodFromTallyItem(tally_item_name, unit_symbol = "NOS", unit_price = 0) {
  if (!tally_item_name || !tally_item_name.trim()) {
    throw new AppError("Tally item name is required", 400);
  }

  const cleanName = tally_item_name.trim();
  const normalized = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");

  const transaction = await db.transaction();
  try {
    const unit = await getOrCreateUnit(unit_symbol || "NOS", transaction);
    let item = await Item.findOne({
      where: db.Sequelize.or(
        db.Sequelize.where(db.Sequelize.fn("LOWER", db.Sequelize.col("name")), cleanName.toLowerCase()),
        { normalized_name: normalized }
      ),
      transaction,
    });

    if (!item) {
      item = await Item.create(
        {
          name: cleanName,
          normalized_name: normalized || cleanName.toLowerCase(),
          item_type: "FINISHED_GOOD",
          unit_id: unit.id,
          category: "Finished Goods",
          unit_price: parseFloat(unit_price) || 0,
          is_active: true,
        },
        { transaction }
      );
    }

    const [mapping] = await TallyItemMapping.upsert(
      {
        tally_item_name: cleanName,
        item_id: item.id,
      },
      { transaction }
    );

    // Backfill any invoice items
    await InvoiceItem.update(
      {
        item_id: item.id,
        item_name_snapshot: item.name,
        unit_id: item.unit_id,
        unit_snapshot: unit.symbol || "NOS",
      },
      {
        where: {
          tally_item_name: cleanName,
          item_id: null,
        },
        transaction,
      }
    );

    await transaction.commit();
    return { item, mapping };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
