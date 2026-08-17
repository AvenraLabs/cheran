"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("dealer_commissions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      dealer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "dealers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "government_projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      commission_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      base_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        comment: "Net items total strictly excluding fittings and GST",
      },
      commission_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "PAID"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      paid_date: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.addIndex("dealer_commissions", ["dealer_id"]);
    await queryInterface.addIndex("dealer_commissions", ["project_id"]);
    await queryInterface.addIndex("dealer_commissions", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("dealer_commissions");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_dealer_commissions_status";');
  },
};
