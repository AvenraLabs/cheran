"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sale_items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "sales",
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
      unit_price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("sale_items", ["sale_id"]);
    await queryInterface.addIndex("sale_items", ["item_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sale_items");
  },
};
