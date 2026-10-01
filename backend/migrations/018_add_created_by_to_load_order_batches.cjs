"use strict";

/**
 * Migration 018: Add created_by and created_by_name to load_order_batches
 *
 * Safe & idempotent:
 * 1. Adds created_by (UUID) and created_by_name (VARCHAR(100)) to load_order_batches
 * 2. Adds index on created_by for creator lookups
 * 3. Adds foreign key constraint to users(id) ON DELETE SET NULL if users table exists
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ensure created_by and created_by_name columns exist
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS load_order_batches
        ADD COLUMN IF NOT EXISTS created_by UUID,
        ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(100);

      CREATE INDEX IF NOT EXISTS idx_load_order_batches_created_by ON load_order_batches(created_by);
    `);

    // 2. Add foreign key constraint to users(id) if not exists
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_load_order_batches_created_by'
        ) THEN
          ALTER TABLE load_order_batches
            ADD CONSTRAINT fk_load_order_batches_created_by
            FOREIGN KEY (created_by) REFERENCES users(id)
            ON DELETE SET NULL;
        END IF;
      END $$;
    `).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS load_order_batches
        DROP CONSTRAINT IF EXISTS fk_load_order_batches_created_by;

      DROP INDEX IF EXISTS idx_load_order_batches_created_by;

      ALTER TABLE IF EXISTS load_order_batches
        DROP COLUMN IF EXISTS created_by_name,
        DROP COLUMN IF EXISTS created_by;
    `).catch(() => {});
  },
};
