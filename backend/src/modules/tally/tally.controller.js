import * as tallyService from "./tally.service.js";
import { parseTallyJsonBuffer } from "./tally-json-parser.js";
import AppError from "../../shared/appError.js";

export async function importTallySales(req, res, next) {
  try {
    let jsonData = null;

    if (req.file) {
      try {
        jsonData = parseTallyJsonBuffer(req.file.buffer);
      } catch (parseErr) {
        throw new AppError(parseErr.message || "Failed to parse JSON file.", 400);
      }
    } else if (req.body && (req.body.tallymessage || Array.isArray(req.body))) {
      jsonData = req.body;
    } else {
      throw new AppError("No Transactions.json file or tallymessage payload provided.", 400);
    }

    const result = await tallyService.importTallyGovernmentInvoices(jsonData);

    return res.status(200).json({
      success: true,
      message: `Tally import completed. ${result.importedInvoices} invoices imported, ${result.newProjects} projects created, ${result.skippedInvoices} duplicate invoices skipped.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMappings(req, res, next) {
  try {
    const data = await tallyService.getTallyItemMappings();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveMapping(req, res, next) {
  try {
    const { tally_item_name, item_id } = req.body;
    const mapping = await tallyService.saveTallyItemMapping(tally_item_name, item_id);
    return res.status(200).json({
      success: true,
      message: "Tally item mapping saved successfully.",
      data: { mapping },
    });
  } catch (err) {
    next(err);
  }
}

export async function createItemFromTally(req, res, next) {
  try {
    const { tally_item_name, unit, unit_price } = req.body;
    const result = await tallyService.createFinishedGoodFromTallyItem(tally_item_name, unit, unit_price);
    return res.status(201).json({
      success: true,
      message: `Finished Good '${result.item.name}' created and mapped successfully.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
