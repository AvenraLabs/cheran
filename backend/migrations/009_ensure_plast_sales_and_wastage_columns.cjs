"use strict";

/**
 * Migration 009: Production Schema Updates
 * 
 * Ensures:
 * 1. plast_sales: discount_type and discount_value columns exist
 * 2. plast_production_entries: wastage_quantity column exists
 * 3. production_entries: wastage_quantity and notes columns exist
 * 4. expenses: company column exists
 * 5. material_supplied_overrides: table exists with unique constraint
 * 6. dealer_commission_slabs: table exists with foreign key and index
 * 
 * Safe & Idempotent (uses IF NOT EXISTS / IF EXISTS).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. plast_sales columns
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sales
        ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'AMOUNT',
        ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) DEFAULT 0.00;
    `);

    // 2. plast_production_entries columns
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_production_entries
        ADD COLUMN IF NOT EXISTS wastage_quantity DECIMAL(12, 3) DEFAULT 0.000;
    `);

    // 3. production_entries columns
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS production_entries
        ADD COLUMN IF NOT EXISTS wastage_quantity DECIMAL(12, 3) DEFAULT 0.000,
        ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    // 4. expenses: company column
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS expenses
        ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'irrigation';
    `);

    // 5. material_supplied_overrides table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS material_supplied_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        financial_year VARCHAR(20) NOT NULL,
        supplied_ha DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        supplied_count INTEGER NOT NULL DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_material_supplied_cat_year UNIQUE (category, financial_year)
      );
    `);

    // 6. dealer_commission_slabs table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS dealer_commission_slabs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dealer_id UUID NOT NULL REFERENCES dealers(id) ON DELETE CASCADE,
        effective_from DATE NOT NULL,
        effective_to DATE,
        commission_percentage DECIMAL(5, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_dealer_slabs_lookup 
        ON dealer_commission_slabs (dealer_id, effective_from, effective_to);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS dealer_commission_slabs;
      DROP TABLE IF EXISTS material_supplied_overrides;

      ALTER TABLE IF EXISTS expenses
        DROP COLUMN IF EXISTS company;

      ALTER TABLE IF EXISTS production_entries
        DROP COLUMN IF EXISTS wastage_quantity,
        DROP COLUMN IF EXISTS notes;

      ALTER TABLE IF EXISTS plast_production_entries
        DROP COLUMN IF EXISTS wastage_quantity;

      ALTER TABLE IF EXISTS plast_sales
        DROP COLUMN IF EXISTS discount_type,
        DROP COLUMN IF EXISTS discount_value;
    `);
  },
};
