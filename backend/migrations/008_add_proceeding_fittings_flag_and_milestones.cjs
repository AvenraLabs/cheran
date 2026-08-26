"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const batchInfo = await queryInterface.describeTable("proceeding_batches");
    if (!batchInfo.include_fittings) {
      await queryInterface.addColumn("proceeding_batches", "include_fittings", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }

    const projectInfo = await queryInterface.describeTable("proceeding_batch_projects");
    if (!projectInfo.milestone_start_date) {
      await queryInterface.addColumn("proceeding_batch_projects", "milestone_start_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
    if (!projectInfo.milestone_end_date) {
      await queryInterface.addColumn("proceeding_batch_projects", "milestone_end_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
    if (!projectInfo.milestone_type) {
      await queryInterface.addColumn("proceeding_batch_projects", "milestone_type", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const projectInfo = await queryInterface.describeTable("proceeding_batch_projects");
    if (projectInfo.milestone_start_date) {
      await queryInterface.removeColumn("proceeding_batch_projects", "milestone_start_date");
    }
    if (projectInfo.milestone_end_date) {
      await queryInterface.removeColumn("proceeding_batch_projects", "milestone_end_date");
    }
    if (projectInfo.milestone_type) {
      await queryInterface.removeColumn("proceeding_batch_projects", "milestone_type");
    }

    const batchInfo = await queryInterface.describeTable("proceeding_batches");
    if (batchInfo.include_fittings) {
      await queryInterface.removeColumn("proceeding_batches", "include_fittings");
    }
  },
};
