"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("inventory_stock", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      quantity_on_hand: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0.0,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("inventory_stock", ["item_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("inventory_stock");
  },
};
