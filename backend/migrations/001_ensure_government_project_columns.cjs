"use strict";

/**
 * Migration: Ensure all Government Project columns, indexes, and constraints exist.
 * Safe & idempotent: Uses ADD COLUMN IF NOT EXISTS so it never fails if columns already exist.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Ensure all Government Project columns
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS government_projects
        ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
        ADD COLUMN IF NOT EXISTS invoice_date DATE,
        ADD COLUMN IF NOT EXISTS invoice_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS quotation_subsidy_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS quotation_saca_subsidy_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS farmer_contribution DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS state_restricted_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS work_order_date DATE,
        ADD COLUMN IF NOT EXISTS work_order_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS supply_date DATE,
        ADD COLUMN IF NOT EXISTS application_received_date DATE,
        ADD COLUMN IF NOT EXISTS quotation_date DATE,
        ADD COLUMN IF NOT EXISTS first_fund_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS goi_share_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS state_share_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS first_fund_proceeding_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS first_fund_utr_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS first_fund_utr_date DATE,
        ADD COLUMN IF NOT EXISTS joint_verification_recommended_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS earlier_jv_completed_date DATE,
        ADD COLUMN IF NOT EXISTS jv_recommended_date DATE,
        ADD COLUMN IF NOT EXISTS second_fund_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS additional_state_share_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS second_fund_proceeding_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_fund_utr_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS treasury_fund_utr_no VARCHAR(100),
        ADD COLUMN IF NOT EXISTS final_fund_utr_date DATE,
        ADD COLUMN IF NOT EXISTS treasury_fund_utr_date DATE,
        ADD COLUMN IF NOT EXISTS total_fund_released DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS ae_restricted_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS bank_guarantee_deducted_pct DECIMAL(5, 2),
        ADD COLUMN IF NOT EXISTS bank_guarantee_deducted_amount DECIMAL(15, 2),
        ADD COLUMN IF NOT EXISTS no_of_days_pending INTEGER,
        ADD COLUMN IF NOT EXISTS fund_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS proceeding_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS fra_act VARCHAR(100);
    `);

    // 2. Ensure indexes for high-frequency queries
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_government_projects_app_id ON government_projects (UPPER(application_id));
      CREATE INDEX IF NOT EXISTS idx_government_projects_status ON government_projects (current_status);
      CREATE INDEX IF NOT EXISTS idx_government_projects_invoice_no ON government_projects (invoice_number);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Non-destructive rollback
  },
};
