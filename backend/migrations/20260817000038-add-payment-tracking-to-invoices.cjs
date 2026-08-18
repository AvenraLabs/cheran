"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("invoices");

    if (!tableInfo.paid_amount) {
      await queryInterface.addColumn("invoices", "paid_amount", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    if (!tableInfo.payment_status) {
      await queryInterface.addColumn("invoices", "payment_status", {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "UNPAID",
      });
    }

    if (!tableInfo.payment_date) {
      await queryInterface.addColumn("invoices", "payment_date", {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }

    if (!tableInfo.payment_reference) {
      await queryInterface.addColumn("invoices", "payment_reference", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!tableInfo.payment_history) {
      await queryInterface.addColumn("invoices", "payment_history", {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      });
    }

    try {
      await queryInterface.addIndex("invoices", ["payment_status"], {
        name: "invoices_payment_status_idx",
      });
    } catch (e) {
      // index might already exist
    }
  },

  async down(queryInterface) {
    const cols = ["paid_amount", "payment_status", "payment_date", "payment_reference", "payment_history"];
    for (const col of cols) {
      try {
        await queryInterface.removeColumn("invoices", col);
      } catch (err) {
        // ignore
      }
    }
  },
};
