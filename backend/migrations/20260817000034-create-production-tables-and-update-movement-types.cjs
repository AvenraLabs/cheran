"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add new movement types to PostgreSQL enum if not already present
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_inventory_movements_movement_type') THEN
          BEGIN
            ALTER TYPE "enum_inventory_movements_movement_type" ADD VALUE IF NOT EXISTS 'PRODUCTION_WASTAGE';
          EXCEPTION
            WHEN duplicate_object THEN null;
          END;
          BEGIN
            ALTER TYPE "enum_inventory_movements_movement_type" ADD VALUE IF NOT EXISTS 'REVERSAL';
          EXCEPTION
            WHEN duplicate_object THEN null;
          END;
        END IF;
      END
      $$;
    `);

    // 2. Create production_entries table (no notes)
    await queryInterface.createTable("production_entries", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      production_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_DATE"),
      },
      reference_number: {
        type: Sequelize.STRING(100),
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

    // 3. Create production_materials table
    await queryInterface.createTable("production_materials", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      production_entry_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "production_entries",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity_used: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
      },
      wastage_quantity: {
        type: Sequelize.DECIMAL(12, 3),
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

    // 4. Create production_outputs table
    await queryInterface.createTable("production_outputs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      production_entry_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "production_entries",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      quantity_produced: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
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

    // 5. Add indexes
    await queryInterface.addIndex("production_entries", ["production_date"]);
    await queryInterface.addIndex("production_materials", ["production_entry_id"]);
    await queryInterface.addIndex("production_materials", ["item_id"]);
    await queryInterface.addIndex("production_outputs", ["production_entry_id"]);
    await queryInterface.addIndex("production_outputs", ["item_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("production_outputs");
    await queryInterface.dropTable("production_materials");
    await queryInterface.dropTable("production_entries");
  },
};
