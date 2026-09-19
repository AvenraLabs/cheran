"use strict";

/**
 * Migration 015: Customer Opening Balance & Direct Customer Payments
 * 1. plast_customers: opening_balance, opening_balance_date
 * 2. plast_sale_payments: customer_id (UUID), allow sale_id to be NULL
 * 3. Backfill customer_id on plast_sale_payments from plast_sales
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. plast_customers: opening_balance & opening_balance_date
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_customers
        ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(14, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS opening_balance_date DATE DEFAULT CURRENT_DATE;
    `);

    // 2. plast_sale_payments: customer_id & nullable sale_id
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sale_payments
        ADD COLUMN IF NOT EXISTS customer_id UUID;

      -- Allow sale_id to be nullable for direct customer payments
      ALTER TABLE IF EXISTS plast_sale_payments
        ALTER COLUMN sale_id DROP NOT NULL;

      CREATE INDEX IF NOT EXISTS idx_plast_sale_payments_customer_id ON plast_sale_payments(customer_id);
    `);

    // Foreign key constraint for customer_id
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_plast_sale_payments_customer_id'
        ) THEN
          ALTER TABLE plast_sale_payments
            ADD CONSTRAINT fk_plast_sale_payments_customer_id
            FOREIGN KEY (customer_id) REFERENCES plast_customers(id)
            ON DELETE SET NULL;
        END IF;
      END $$;
    `).catch(() => {});

    // 3. Backfill customer_id on plast_sale_payments from plast_sales
    await queryInterface.sequelize.query(`
      UPDATE plast_sale_payments p
      SET customer_id = s.customer_id
      FROM plast_sales s
      WHERE p.sale_id = s.id AND p.customer_id IS NULL AND s.customer_id IS NOT NULL;
    `).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sale_payments
        DROP COLUMN IF EXISTS customer_id;

      ALTER TABLE IF EXISTS plast_customers
        DROP COLUMN IF EXISTS opening_balance_date,
        DROP COLUMN IF EXISTS opening_balance;
    `);
  },
};
