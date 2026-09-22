"use strict";

/**
 * Migration 017: Add weight_per_unit to plast_items and ensure notes in plast_sale_payments
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. plast_items: weight_per_unit (in kg or unit weight)
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_items
        ADD COLUMN IF NOT EXISTS weight_per_unit DECIMAL(14, 3) DEFAULT 0.000;
    `);

    // 2. plast_sale_payments: ensure notes column exists
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sale_payments
        ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_items
        DROP COLUMN IF EXISTS weight_per_unit;
    `);
  },
};
