"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("load_order_batches", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      batch_number: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      dispatch_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_projects_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_govt_quantity: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      total_actual_quantity: {
        type: Sequelize.DECIMAL(15, 3),
        allowNull: false,
        defaultValue: 0,
      },
      projects_snapshot: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      govt_items_snapshot: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      actual_items_snapshot: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
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

    await queryInterface.addIndex("load_order_batches", ["batch_number"], {
      unique: true,
      name: "idx_load_order_batches_batch_number",
    });

    await queryInterface.addIndex("load_order_batches", ["dispatch_date"], {
      name: "idx_load_order_batches_dispatch_date",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("load_order_batches");
  },
};
