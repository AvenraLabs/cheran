import db from "../config/db.js";
import GovernmentStatus from "../modules/statuses/status.model.js";

export const ORDERED_GOVERNMENT_STATUSES = [
  "Kgi files",
  "Pre Inspection - Request for Revised Layout and GPS",
  "Automation without MI Application Received",
  "Automation without MI",
  "Pre Registration",
  "Application Received",
  "Approved by Block Officer",
  "Application Validation Rejected by Block Officer",
  "Layout Image and GPS Image Uploaded",
  "Quotation Prepared by MI Company",
  "Cluster Quotation Approved",
  "Quotation Copy Uploaded by MI Company",
  "Pre Inspection Approved",
  "Pre Inspection Skipped",
  "Pre Inspection - Request Quotation Copy",
  "Pre Inspection - Request for Revised Quotation",
  "DD Uploaded",
  "DD Upload Skipped",
  "Payment done via Payment Gateway",
  "Farmer Acceptance Letter Uploaded",
  "INVOICED",
  "Issue Work Order (Auto Quotation)",
  "Issued Work Order",
  "Quotation Prepared by Block (Auto Quotation)",
  "Auto Quotation Prepared",
  "Work Completed",
  "Work Completion Approved",
  "First Fund Skipped by Block Office",
  "Fund Release Recommended by Block Office",
  "Fund Release Recommended by District Office",
  "First Fund Skipped by District Office",
  "Deemed to be Recommended (Block Office)",
  "Deemed to be Recommended (District Office)",
  "FirstFund Skipped by State",
  "Fund Release Verification by State Horticulture",
  "Fund Release Verification by State Agriculture",
  "Mi Company Rectification Reverted By Block",
  "Mi Company Rectification Approved By Block",
  "Reverted Application Rectified By Mi Company",
  "Reverted Application Rectified By Block",
  "Rejected By State Agri / Horti",
  "Reverted by State Agri / Horti to Block",
  "Reverted By State Agri / Horti",
  "First Fund Proceeding Skipped",
  "Earlier JV Completed",
  "District First Fund Proceeding Completed",
  "First Fund Proceeding Completed",
  "First Fund UTR Update Skipped",
  "District First Fund Credited (UTR Updated)",
  "First Fund Credited (UTR Updated)",
  "Application Reverted on Joint Verification",
  "Joint Verification Completed",
  "Final Fund Release Recommended by District Office",
  "Fund Release Proceeding Completed",
  "Iamwarm Fund Credited (UTR Updated)",
  "Final Fund Credited (UTR Updated)",
];

export async function seedGovernmentStatuses() {
  for (let index = 0; index < ORDERED_GOVERNMENT_STATUSES.length; index++) {
    const name = ORDERED_GOVERNMENT_STATUSES[index];
    const sequence = index + 1;

    await db.query(
      `INSERT INTO government_statuses (id, name, sequence_order, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), :name, :sequence, true, NOW(), NOW())
       ON CONFLICT (name) DO UPDATE 
       SET sequence_order = :sequence, is_active = true, updated_at = NOW();`,
      {
        replacements: { name, sequence },
      }
    );
  }
  console.log(`✅ ${ORDERED_GOVERNMENT_STATUSES.length} Government Statuses verified & seeded.`);
}

// Standalone runner
if (process.argv[1] && process.argv[1].endsWith("seedStatuses.js")) {
  db.authenticate()
    .then(async () => {
      console.log("🔌 Connected to database. Seeding government statuses...");
      await seedGovernmentStatuses();
      await db.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Failed to seed government statuses:", err);
      try {
        await db.close();
      } catch {}
      process.exit(1);
    });
}
