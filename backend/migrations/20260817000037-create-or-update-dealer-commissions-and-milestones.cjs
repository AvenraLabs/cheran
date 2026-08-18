"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("dealer_commissions");

    if (!tableInfo.penalty_percentage) {
      await queryInterface.addColumn("dealer_commissions", "penalty_percentage", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    if (!tableInfo.effective_percentage) {
      await queryInterface.addColumn("dealer_commissions", "effective_percentage", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      });
    }

    if (!tableInfo.part1_percentage) {
      await queryInterface.addColumn("dealer_commissions", "part1_percentage", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 55.0,
      });
    }

    if (!tableInfo.part1_amount) {
      await queryInterface.addColumn("dealer_commissions", "part1_amount", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    if (!tableInfo.part1_status) {
      await queryInterface.addColumn("dealer_commissions", "part1_status", {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "LOCKED",
      });
    }

    if (!tableInfo.part1_paid_date) {
      await queryInterface.addColumn("dealer_commissions", "part1_paid_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    if (!tableInfo.part1_paid_ref) {
      await queryInterface.addColumn("dealer_commissions", "part1_paid_ref", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!tableInfo.part1_notes) {
      await queryInterface.addColumn("dealer_commissions", "part1_notes", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.part2_percentage) {
      await queryInterface.addColumn("dealer_commissions", "part2_percentage", {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 45.0,
      });
    }

    if (!tableInfo.part2_amount) {
      await queryInterface.addColumn("dealer_commissions", "part2_amount", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    if (!tableInfo.part2_status) {
      await queryInterface.addColumn("dealer_commissions", "part2_status", {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "LOCKED",
      });
    }

    if (!tableInfo.part2_paid_date) {
      await queryInterface.addColumn("dealer_commissions", "part2_paid_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    if (!tableInfo.part2_paid_ref) {
      await queryInterface.addColumn("dealer_commissions", "part2_paid_ref", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!tableInfo.part2_notes) {
      await queryInterface.addColumn("dealer_commissions", "part2_notes", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.breakdown_json) {
      await queryInterface.addColumn("dealer_commissions", "breakdown_json", {
        type: Sequelize.JSONB,
        allowNull: true,
      });
    }

    // Add unique index on project_id if not present
    try {
      await queryInterface.addIndex("dealer_commissions", ["project_id"], {
        name: "dealer_commissions_project_id_idx",
        unique: false,
      });
    } catch (idxErr) {
      // index might already exist
    }
  },

  async down(queryInterface) {
    const columns = [
      "penalty_percentage",
      "effective_percentage",
      "part1_percentage",
      "part1_amount",
      "part1_status",
      "part1_paid_date",
      "part1_paid_ref",
      "part1_notes",
      "part2_percentage",
      "part2_amount",
      "part2_status",
      "part2_paid_date",
      "part2_paid_ref",
      "part2_notes",
      "breakdown_json",
    ];

    for (const col of columns) {
      try {
        await queryInterface.removeColumn("dealer_commissions", col);
      } catch (err) {
        // ignore
      }
    }
  },
};
