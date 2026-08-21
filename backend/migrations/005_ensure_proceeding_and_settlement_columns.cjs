"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ensure proceeding_batch_projects has all calculation snapshot and audit fields
    const tableInfo = await queryInterface.describeTable("proceeding_batch_projects");

    if (!tableInfo.subsidy_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "subsidy_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!tableInfo.fund_share_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "fund_share_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!tableInfo.delay_days) {
      await queryInterface.addColumn("proceeding_batch_projects", "delay_days", {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      });
    }

    if (!tableInfo.penalty_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "penalty_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    if (!tableInfo.adjusted_penalty_amount) {
      await queryInterface.addColumn("proceeding_batch_projects", "adjusted_penalty_amount", {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      });
    }

    // 2. Create dealer_settlements table for permanent immutable financial history
    const tables = await queryInterface.showAllTables();
    if (!tables.includes("dealer_settlements")) {
      await queryInterface.createTable("dealer_settlements", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        dealer_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "dealers",
            key: "id",
          },
          onDelete: "RESTRICT",
        },
        project_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "government_projects",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        proceeding_batch_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "proceeding_batches",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        proceeding_batch_project_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "proceeding_batch_projects",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        application_id: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        fund_percentage: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        state_restricted_amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        fund_release_amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        gst_percentage: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        fittings_percentage: {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 5.0,
        },
        dealer_base_rate: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        penalty_percentage: {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0,
        },
        effective_rate: {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        net_material_base: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        commission_amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        fittings_amount: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        total_paid: {
          type: Sequelize.DECIMAL(14, 2),
          allowNull: false,
        },
        payment_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        utr_reference: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
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

      await queryInterface.addIndex("dealer_settlements", ["dealer_id"]);
      await queryInterface.addIndex("dealer_settlements", ["proceeding_batch_id"]);
      await queryInterface.addIndex("dealer_settlements", ["project_id"]);
      await queryInterface.addIndex("dealer_settlements", ["payment_date"]);
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes("dealer_settlements")) {
      await queryInterface.dropTable("dealer_settlements");
    }
  },
};
