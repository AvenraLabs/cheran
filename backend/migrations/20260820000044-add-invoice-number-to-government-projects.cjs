"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("government_projects");
    if (!tableInfo.invoice_number) {
      await queryInterface.addColumn("government_projects", "invoice_number", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("government_projects");
    if (tableInfo.invoice_number) {
      await queryInterface.removeColumn("government_projects", "invoice_number");
    }
  },
};
