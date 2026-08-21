"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. fund_percentage_masters
    await queryInterface.createTable("fund_percentage_masters", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      percentage: {
        type: Sequelize.FLOAT,
        allowNull: false,
        unique: true,
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
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

    // 2. proceeding_batches
    await queryInterface.createTable("proceeding_batches", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      proceeding_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      proceeding_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      fund_percentage_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "fund_percentage_masters",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      fund_percentage_value: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 55.0,
      },
      total_proceeding_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      payment_received_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      payment_received_ref: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      total_calculated_commission: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      total_calculated_fittings: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      dealer_payout_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "UNPAID", // UNPAID, PARTIAL, PAID
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

    // 3. proceeding_batch_projects
    await queryInterface.createTable("proceeding_batch_projects", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "government_projects",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      application_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dealer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "dealers",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      farmer_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      district: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fund_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invoice_amount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      state_restricted_amount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      gst_percentage: {
        type: Sequelize.FLOAT,
        defaultValue: 12.0,
      },
      fittings_percentage: {
        type: Sequelize.FLOAT,
        defaultValue: 5.0,
      },
      net_material_base: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      dealer_rate_percentage: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      commission_amount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      fittings_amount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0,
      },
      is_paid_to_dealer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      dealer_paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dealer_paid_ref: {
        type: Sequelize.STRING,
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

    // Seed default Fund Percentage Slabs
    const defaultSlabs = [
      { id: "a1b2c3d4-0001-4000-8000-000000000055", percentage: 55, label: "55% (First Fund Standard)", is_active: true },
      { id: "a1b2c3d4-0002-4000-8000-000000000045", percentage: 45, label: "45% (Final Fund Standard)", is_active: true },
      { id: "a1b2c3d4-0003-4000-8000-000000000060", percentage: 60, label: "60% (40%-SPARSH First Fund)", is_active: true },
      { id: "a1b2c3d4-0004-4000-8000-000000000040", percentage: 40, label: "40% (40%-SPARSH Final Fund)", is_active: true },
      { id: "a1b2c3d4-0005-4000-8000-000000000100", percentage: 100, label: "100% (Full Release)", is_active: true },
    ];

    for (const slab of defaultSlabs) {
      await queryInterface.bulkInsert("fund_percentage_masters", [{
        ...slab,
        created_at: new Date(),
        updated_at: new Date(),
      }], { ignoreDuplicates: true });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("proceeding_batch_projects");
    await queryInterface.dropTable("proceeding_batches");
    await queryInterface.dropTable("fund_percentage_masters");
  },
};
