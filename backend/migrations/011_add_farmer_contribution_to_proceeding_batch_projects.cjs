"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const projectInfo = await queryInterface.describeTable("proceeding_batch_projects").catch(() => ({}));
    if (!projectInfo.farmer_contribution) {
      await queryInterface.addColumn("proceeding_batch_projects", "farmer_contribution", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const projectInfo = await queryInterface.describeTable("proceeding_batch_projects").catch(() => ({}));
    if (projectInfo.farmer_contribution) {
      await queryInterface.removeColumn("proceeding_batch_projects", "farmer_contribution");
    }
  },
};
