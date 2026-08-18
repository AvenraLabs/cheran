"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ensure 'INVOICED' status exists in government_statuses
    await queryInterface.sequelize.query(`
      INSERT INTO "government_statuses" ("id", "name", "is_active", "created_at", "updated_at")
      VALUES (gen_random_uuid(), 'INVOICED', true, NOW(), NOW())
      ON CONFLICT ("name") DO NOTHING;
    `);

    // 2. Create tally_item_mappings table if not exists
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "tally_item_mappings" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tally_item_name" VARCHAR(255) NOT NULL UNIQUE,
        "item_id" UUID NOT NULL REFERENCES "items" ("id") ON DELETE RESTRICT,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_tally_item_mappings_item_id" ON "tally_item_mappings" ("item_id");
    `);

    // 3. Add Tally tracking columns to invoices table if not already added
    const invoiceCols = await queryInterface.describeTable("invoices");
    if (!invoiceCols.source) {
      await queryInterface.addColumn("invoices", "source", {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "MANUAL",
      });
    }
    if (!invoiceCols.tally_guid) {
      await queryInterface.addColumn("invoices", "tally_guid", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!invoiceCols.tally_remote_id) {
      await queryInterface.addColumn("invoices", "tally_remote_id", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!invoiceCols.tally_vch_key) {
      await queryInterface.addColumn("invoices", "tally_vch_key", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!invoiceCols.tally_voucher_number) {
      await queryInterface.addColumn("invoices", "tally_voucher_number", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
    if (!invoiceCols.party_name) {
      await queryInterface.addColumn("invoices", "party_name", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!invoiceCols.party_mailing_name) {
      await queryInterface.addColumn("invoices", "party_mailing_name", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!invoiceCols.tally_raw_data) {
      await queryInterface.addColumn("invoices", "tally_raw_data", {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_invoices_source_tally_guid" 
      ON "invoices" ("source", "tally_guid") 
      WHERE "tally_guid" IS NOT NULL;
    `);

    // 4. Update invoice_items table to support unmapped items & Tally fields
    const invoiceItemCols = await queryInterface.describeTable("invoice_items");
    if (!invoiceItemCols.tally_item_name) {
      await queryInterface.addColumn("invoice_items", "tally_item_name", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!invoiceItemCols.billed_quantity) {
      await queryInterface.addColumn("invoice_items", "billed_quantity", {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
      });
    }
    if (!invoiceItemCols.rate) {
      await queryInterface.addColumn("invoice_items", "rate", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      });
    }
    if (!invoiceItemCols.hsn_code) {
      await queryInterface.addColumn("invoice_items", "hsn_code", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    await queryInterface.changeColumn("invoice_items", "item_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.changeColumn("invoice_items", "item_name_snapshot", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn("invoice_items", "unit_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.changeColumn("invoice_items", "unit_snapshot", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "uniq_invoices_source_tally_guid";
    `);
    const invoiceCols = await queryInterface.describeTable("invoices");
    if (invoiceCols.tally_raw_data) await queryInterface.removeColumn("invoices", "tally_raw_data");
    if (invoiceCols.party_mailing_name) await queryInterface.removeColumn("invoices", "party_mailing_name");
    if (invoiceCols.party_name) await queryInterface.removeColumn("invoices", "party_name");
    if (invoiceCols.tally_voucher_number) await queryInterface.removeColumn("invoices", "tally_voucher_number");
    if (invoiceCols.tally_vch_key) await queryInterface.removeColumn("invoices", "tally_vch_key");
    if (invoiceCols.tally_remote_id) await queryInterface.removeColumn("invoices", "tally_remote_id");
    if (invoiceCols.tally_guid) await queryInterface.removeColumn("invoices", "tally_guid");
    if (invoiceCols.source) await queryInterface.removeColumn("invoices", "source");

    const invoiceItemCols = await queryInterface.describeTable("invoice_items");
    if (invoiceItemCols.hsn_code) await queryInterface.removeColumn("invoice_items", "hsn_code");
    if (invoiceItemCols.rate) await queryInterface.removeColumn("invoice_items", "rate");
    if (invoiceItemCols.billed_quantity) await queryInterface.removeColumn("invoice_items", "billed_quantity");
    if (invoiceItemCols.tally_item_name) await queryInterface.removeColumn("invoice_items", "tally_item_name");

    await queryInterface.dropTable("tally_item_mappings");
  },
};
