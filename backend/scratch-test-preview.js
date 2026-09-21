import * as XLSX from "xlsx";
import { processImportPreview } from "./src/modules/imports/import-preview.service.js";
import db from "./src/config/db.js";
import GovernmentImport from "./src/modules/imports/import.model.js";
import GovernmentImportRow from "./src/modules/imports/import-row.model.js";

async function test() {
  try {
    // Generate an in-memory workbook with:
    // 1. A valid row
    // 2. A row with missing application_id (Rule 1 error)
    // 3. A duplicate application_id (Rule 2 duplicate)
    // 4. A row with missing status (Rule 3 error)
    const data = [
      ["Application ID", "Current Status", "Farmer Name", "District", "Block", "Village", "Dealer Name"],
      ["TEST-APP-001", "Application Received", "Ramu", "Coimbatore", "Pollachi", "Village 1", "Dealer A"],
      ["", "Application Received", "Somu", "Coimbatore", "Pollachi", "Village 2", "Dealer A"],
      ["TEST-APP-001", "Issued Work Order", "Ramu", "Coimbatore", "Pollachi", "Village 1", "Dealer A"],
      ["TEST-APP-002", "", "Babu", "Coimbatore", "Pollachi", "Village 3", "Dealer A"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    console.log("Running processImportPreview with test buffer...");
    const result = await processImportPreview({
      fileBuffer: buffer,
      fileName: "test-preview.xlsx",
      uploadedBy: "TestRunner",
    });

    console.log("✅ Success! Import ID:", result.importId);
    console.log("Summary:", result.summary);

    // Clean up test import record & rows
    await GovernmentImportRow.destroy({ where: { import_id: result.importId } });
    await GovernmentImport.destroy({ where: { id: result.importId } });
    console.log("🧹 Cleaned up test database records.");

    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed with error:", err);
    process.exit(1);
  }
}

test();
