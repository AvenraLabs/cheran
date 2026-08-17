"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable("customers");
    if (tableDesc.customer_type) {
      await queryInterface.removeColumn("customers", "customer_type");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("customers", "customer_type", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },
};
