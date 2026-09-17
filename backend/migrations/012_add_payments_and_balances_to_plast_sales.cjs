"use strict";

/**
 * Migration 012: Add paid_amount, balance_amount to plast_sales and create plast_sale_payments table
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add paid_amount and balance_amount to plast_sales
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sales
        ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS balance_amount DECIMAL(14, 2) NOT NULL DEFAULT 0.00;
    `);

    // 2. Backfill existing sales
    await queryInterface.sequelize.query(`
      UPDATE plast_sales
      SET 
        paid_amount = CASE WHEN payment_status = 'PAID' THEN grand_total ELSE 0.00 END,
        balance_amount = CASE WHEN payment_status = 'PAID' THEN 0.00 ELSE grand_total END,
        payment_status = CASE 
          WHEN payment_status = 'PAID' THEN 'PAID'
          ELSE 'UNPAID'
        END
      WHERE paid_amount = 0.00 AND balance_amount = 0.00 AND grand_total > 0;
    `);

    // 3. Create plast_sale_payments table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS plast_sale_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sale_id UUID NOT NULL REFERENCES plast_sales(id) ON DELETE CASCADE,
        amount DECIMAL(14, 2) NOT NULL,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        payment_mode VARCHAR(50) NOT NULL DEFAULT 'CASH',
        reference_number VARCHAR(100),
        notes TEXT,
        created_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_plast_sale_payments_sale_id ON plast_sale_payments(sale_id);
      CREATE INDEX IF NOT EXISTS idx_plast_sale_payments_payment_date ON plast_sale_payments(payment_date);
    `);

    // 4. Seed initial payment records for already PAID sales
    await queryInterface.sequelize.query(`
      INSERT INTO plast_sale_payments (sale_id, amount, payment_date, payment_mode, notes)
      SELECT id, grand_total, sale_date, COALESCE(payment_mode, 'CASH'), 'Initial payment'
      FROM plast_sales
      WHERE payment_status = 'PAID' AND grand_total > 0
      ON CONFLICT DO NOTHING;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS plast_sale_payments CASCADE;
      ALTER TABLE IF EXISTS plast_sales
        DROP COLUMN IF EXISTS paid_amount,
        DROP COLUMN IF EXISTS balance_amount;
    `);
  },
};
