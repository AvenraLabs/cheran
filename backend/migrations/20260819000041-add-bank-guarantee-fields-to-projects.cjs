"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("government_projects");

    if (!tableInfo.bank_guarantee_deducted_pct) {
      await queryInterface.addColumn("government_projects", "bank_guarantee_deducted_pct", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      });
    }

    if (!tableInfo.bank_guarantee_deducted_amount) {
      await queryInterface.addColumn("government_projects", "bank_guarantee_deducted_amount", {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("government_projects");

    if (tableInfo.bank_guarantee_deducted_pct) {
      await queryInterface.removeColumn("government_projects", "bank_guarantee_deducted_pct");
    }

    if (tableInfo.bank_guarantee_deducted_amount) {
      await queryInterface.removeColumn("government_projects", "bank_guarantee_deducted_amount");
    }
  },
};
