"use strict";

/**
 * Migration 013: Ensure missing production columns:
 * 1. proceeding_batch_projects: row_index
 * 2. plast_sales: created_by (UUID), created_by_name (VARCHAR(100))
 * 3. plast_sale_payments: created_by (UUID), created_by_name (VARCHAR(100))
 * 4. dealers: created_by (VARCHAR(100)), updated_by (VARCHAR(100))
 * 
 * Safe & idempotent (uses ADD COLUMN IF NOT EXISTS).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. proceeding_batch_projects: row_index
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS proceeding_batch_projects
        ADD COLUMN IF NOT EXISTS row_index INTEGER DEFAULT 0;
    `);

    // Backfill row_index for batches that have 0 or null row_index
    await queryInterface.sequelize.query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY proceeding_batch_id ORDER BY created_at ASC) as rn
        FROM proceeding_batch_projects
        WHERE row_index IS NULL OR row_index = 0
      )
      UPDATE proceeding_batch_projects p
      SET row_index = n.rn
      FROM numbered n
      WHERE p.id = n.id AND (p.row_index IS NULL OR p.row_index = 0);
    `).catch(() => {});

    // 2. plast_sales: created_by, created_by_name
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sales
        ADD COLUMN IF NOT EXISTS created_by UUID,
        ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100) DEFAULT 'admin';

      CREATE INDEX IF NOT EXISTS idx_plast_sales_created_by ON plast_sales(created_by);
    `);

    // Add foreign key constraint to users(id) if not exists
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_plast_sales_created_by'
        ) THEN
          ALTER TABLE plast_sales
            ADD CONSTRAINT fk_plast_sales_created_by
            FOREIGN KEY (created_by) REFERENCES users(id)
            ON DELETE SET NULL;
        END IF;
      END $$;
    `).catch(() => {});

    // 3. plast_sale_payments: created_by, created_by_name
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS plast_sale_payments
        ADD COLUMN IF NOT EXISTS created_by UUID,
        ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100) DEFAULT 'admin';

      CREATE INDEX IF NOT EXISTS idx_plast_sale_payments_created_by ON plast_sale_payments(created_by);
    `);

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_plast_sale_payments_created_by'
        ) THEN
          ALTER TABLE plast_sale_payments
            ADD CONSTRAINT fk_plast_sale_payments_created_by
            FOREIGN KEY (created_by) REFERENCES users(id)
            ON DELETE SET NULL;
        END IF;
      END $$;
    `).catch(() => {});

    // 4. dealers: created_by, updated_by
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS dealers
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(100),
        ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS proceeding_batch_projects
        DROP COLUMN IF EXISTS row_index;

      ALTER TABLE IF EXISTS plast_sales
        DROP COLUMN IF EXISTS created_by,
        DROP COLUMN IF EXISTS created_by_name;

      ALTER TABLE IF EXISTS plast_sale_payments
        DROP COLUMN IF EXISTS created_by_name;
    `);
  },
};
