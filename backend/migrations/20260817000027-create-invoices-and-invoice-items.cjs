"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add REVERSAL to enum_inventory_movements_movement_type if not present
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_invoices_invoice_type') THEN
          CREATE TYPE "enum_invoices_invoice_type" AS ENUM ('GOVERNMENT', 'DIRECT_SALE');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_invoices_status') THEN
          CREATE TYPE "enum_invoices_status" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');
        END IF;
        ALTER TYPE "enum_inventory_movements_movement_type" ADD VALUE IF NOT EXISTS 'REVERSAL';
      END $$;
    `);

    // Create invoices table
    await queryInterface.createTable("invoices", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_DATE"),
      },
      customer_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "customers", key: "id" },
        onDelete: "SET NULL",
      },
      government_project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "government_projects", key: "id" },
        onDelete: "SET NULL",
      },
      dealer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "dealers", key: "id" },
        onDelete: "SET NULL",
      },
      net_item_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      fittings_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5.0,
      },
      fittings_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      taxable_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      gst_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      total_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      invoice_type: {
        type: "enum_invoices_invoice_type",
        allowNull: false,
        defaultValue: "DIRECT_SALE",
      },
      status: {
        type: "enum_invoices_status",
        allowNull: false,
        defaultValue: "POSTED",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Indexes on invoices
    await queryInterface.addIndex("invoices", ["invoice_number", "invoice_type"], {
      unique: true,
      name: "uniq_invoice_number_type",
    });
    await queryInterface.addIndex("invoices", ["government_project_id"], {
      name: "idx_invoices_gov_project_id",
    });
    await queryInterface.addIndex("invoices", ["customer_id"], {
      name: "idx_invoices_customer_id",
    });
    await queryInterface.addIndex("invoices", ["invoice_date"], {
      name: "idx_invoices_invoice_date",
    });

    // Create invoice_items table
    await queryInterface.createTable("invoice_items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      invoice_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "invoices", key: "id" },
        onDelete: "CASCADE",
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "items", key: "id" },
        onDelete: "RESTRICT",
      },
      item_name_snapshot: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "units", key: "id" },
        onDelete: "RESTRICT",
      },
      unit_snapshot: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      line_total: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("invoice_items", ["invoice_id"], {
      name: "idx_invoice_items_invoice_id",
    });
    await queryInterface.addIndex("invoice_items", ["item_id"], {
      name: "idx_invoice_items_item_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("invoice_items");
    await queryInterface.dropTable("invoices");
  },
};
