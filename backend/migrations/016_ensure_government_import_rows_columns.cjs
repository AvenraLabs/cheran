"use strict";

/**
 * Migration 016: Ensure Government Import and Import Rows columns and indexes.
 * Safe & idempotent: Uses ADD COLUMN IF NOT EXISTS so it never fails if columns already exist.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ensure all columns on government_import_rows
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS government_import_rows
        ADD COLUMN IF NOT EXISTS previous_status VARCHAR(255),
        ADD COLUMN IF NOT EXISTS imported_status_date DATE,
        ADD COLUMN IF NOT EXISTS dealer_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS action VARCHAR(50) DEFAULT 'NEW_PROJECT',
        ADD COLUMN IF NOT EXISTS error_message TEXT,
        ADD COLUMN IF NOT EXISTS matched_project_id UUID,
        ADD COLUMN IF NOT EXISTS matched_dealer_id UUID,
        ADD COLUMN IF NOT EXISTS resolution_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS raw_data JSONB;
    `);

    // 2. Ensure indexes on government_import_rows
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_government_import_rows_import_id ON government_import_rows (import_id);
      CREATE INDEX IF NOT EXISTS idx_government_import_rows_app_id ON government_import_rows (application_id);
      CREATE INDEX IF NOT EXISTS idx_government_import_rows_action ON government_import_rows (action);
      CREATE INDEX IF NOT EXISTS idx_government_import_rows_resolution_status ON government_import_rows (resolution_status);
    `);

    // 3. Ensure columns on government_imports
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS government_imports
        ADD COLUMN IF NOT EXISTS dealer_resolutions_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS error_message TEXT,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS government_import_rows
        DROP COLUMN IF EXISTS previous_status;
    `);
  },
};
