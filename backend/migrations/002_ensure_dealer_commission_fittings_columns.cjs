"use strict";

/**
 * Migration: Ensure Dealer Commission fittings columns exist.
 * Safe & idempotent: Uses ADD COLUMN IF NOT EXISTS.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS dealer_commissions
        ADD COLUMN IF NOT EXISTS fittings_amount DECIMAL(14, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS fittings_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS fittings_paid_date DATE,
        ADD COLUMN IF NOT EXISTS fittings_paid_ref VARCHAR(255),
        ADD COLUMN IF NOT EXISTS fittings_notes TEXT;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Non-destructive rollback
  },
};
