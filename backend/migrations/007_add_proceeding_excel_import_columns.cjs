"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ensure proceeding_batches has file_name
    const batchInfo = await queryInterface.describeTable("proceeding_batches");
    if (!batchInfo.file_name) {
      await queryInterface.addColumn("proceeding_batches", "file_name", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    // 2. Ensure proceeding_batch_projects has all Excel-derived columns
    const projectInfo = await queryInterface.describeTable("proceeding_batch_projects");

    if (!projectInfo.total_material_cost) {
      await queryInterface.addColumn("proceeding_batch_projects", "total_material_cost", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!projectInfo.now_to_be_released_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "now_to_be_released_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!projectInfo.excel_gst_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "excel_gst_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!projectInfo.invoice_number) {
      await queryInterface.addColumn("proceeding_batch_projects", "invoice_number", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!projectInfo.invoice_date) {
      await queryInterface.addColumn("proceeding_batch_projects", "invoice_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    if (!projectInfo.block) {
      await queryInterface.addColumn("proceeding_batch_projects", "block", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!projectInfo.village) {
      await queryInterface.addColumn("proceeding_batch_projects", "village", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!projectInfo.goi_share_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "goi_share_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!projectInfo.state_share_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "state_share_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!projectInfo.addl_state_share_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "addl_state_share_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!projectInfo.penalty_percentage) {
      await queryInterface.addColumn("proceeding_batch_projects", "penalty_percentage", {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const projectInfo = await queryInterface.describeTable("proceeding_batch_projects");
    if (projectInfo.total_material_cost) {
      await queryInterface.removeColumn("proceeding_batch_projects", "total_material_cost");
    }
    if (projectInfo.now_to_be_released_amount) {
      await queryInterface.removeColumn("proceeding_batch_projects", "now_to_be_released_amount");
    }
    if (projectInfo.excel_gst_amount) {
      await queryInterface.removeColumn("proceeding_batch_projects", "excel_gst_amount");
    }
    if (projectInfo.invoice_number) {
      await queryInterface.removeColumn("proceeding_batch_projects", "invoice_number");
    }
    if (projectInfo.invoice_date) {
      await queryInterface.removeColumn("proceeding_batch_projects", "invoice_date");
    }
    if (projectInfo.block) {
      await queryInterface.removeColumn("proceeding_batch_projects", "block");
    }
    if (projectInfo.village) {
      await queryInterface.removeColumn("proceeding_batch_projects", "village");
    }
    if (projectInfo.goi_share_amount) {
      await queryInterface.removeColumn("proceeding_batch_projects", "goi_share_amount");
    }
    if (projectInfo.state_share_amount) {
      await queryInterface.removeColumn("proceeding_batch_projects", "state_share_amount");
    }
    if (projectInfo.addl_state_share_amount) {
      await queryInterface.removeColumn("proceeding_batch_projects", "addl_state_share_amount");
    }
    if (projectInfo.penalty_percentage) {
      await queryInterface.removeColumn("proceeding_batch_projects", "penalty_percentage");
    }

    const batchInfo = await queryInterface.describeTable("proceeding_batches");
    if (batchInfo.file_name) {
      await queryInterface.removeColumn("proceeding_batches", "file_name");
    }
  },
};
