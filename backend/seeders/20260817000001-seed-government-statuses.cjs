"use strict";

const { v4: uuidv4 } = require("uuid");

const KNOWN_STATUSES = [
  "Final Fund Credited (UTR Updated)",
  "Issued Work Order",
  "District First Fund Credited (UTR Updated)",
  "Application Received",
  "Final Fund Release Recommended by District Office",
  "Work Completion Approved",
  "Joint Verification Completed",
  "Approved by Block Officer",
  "Fund Release Proceeding Completed",
  "District First Fund Proceeding Completed",
  "First Fund Credited (UTR Updated)",
  "Fund Release Verification by State Agriculture",
  "Fund Release Recommended by District Office",
  "Fund Release Verification by State Horticulture",
  "Fund Release Recommended by Block Office",
  "Pre Inspection Approved",
  "Reverted by State Agri / Horti to Block",
  "Layout Image and GPS Image Uploaded",
  "Reverted By State Agri / Horti",
  "Quotation Prepared by MI Company",
  "Quotation Copy Uploaded by MI Company",
  "Reverted Application Rectified By Block",
  "Iamwarm Fund Credited (UTR Updated)",
  "Reverted Application Rectified By Mi Company",
  "Payment done via Payment Gateway",
  "Mi Company Rectification Reverted By Block",
  "Rejected By State Agri / Horti",
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const records = KNOWN_STATUSES.map((name) => ({
      id: uuidv4 ? uuidv4() : Sequelize.fn("gen_random_uuid"),
      name,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    for (const record of records) {
      // Upsert by name to prevent duplicate errors if run multiple times
      await queryInterface.sequelize.query(
        `INSERT INTO government_statuses (id, name, is_active, created_at, updated_at)
         VALUES (gen_random_uuid(), :name, true, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING`,
        {
          replacements: { name: record.name },
        }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("government_statuses", null, {});
  },
};
