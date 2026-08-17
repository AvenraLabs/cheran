"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_movements", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
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
      movement_type: {
        type: Sequelize.ENUM(
          "OPENING",
          "PURCHASE",
          "ADJUSTMENT_IN",
          "ADJUSTMENT_OUT",
          "SALE",
          "DISPATCH",
          "PRODUCTION_IN",
          "PRODUCTION_OUT"
        ),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
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
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      movement_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_DATE"),
      },
      unit_cost: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
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
    });

    await queryInterface.addIndex("inventory_movements", ["item_id"]);
    await queryInterface.addIndex("inventory_movements", ["movement_type"]);
    await queryInterface.addIndex("inventory_movements", ["movement_date"]);
    await queryInterface.addIndex("inventory_movements", ["reference_type", "reference_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inventory_movements");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventory_movements_movement_type";');
  },
};
