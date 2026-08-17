"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("items", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      normalized_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      item_type: {
        type: Sequelize.ENUM("RAW_MATERIAL", "FINISHED_GOOD", "TRADING_ITEM", "ACCESSORY"),
        allowNull: false,
        defaultValue: "FINISHED_GOOD",
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
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("items", ["normalized_name"]);
    await queryInterface.addIndex("items", ["item_type"]);
    await queryInterface.addIndex("items", ["code"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("items");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_items_item_type";');
  },
};
