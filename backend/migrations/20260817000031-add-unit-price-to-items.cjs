"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("items");
    if (!tableDesc.unit_price) {
      await queryInterface.addColumn("items", "unit_price", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.00,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("items");
    if (tableDesc.unit_price) {
      await queryInterface.removeColumn("items", "unit_price");
    }
  },
};
