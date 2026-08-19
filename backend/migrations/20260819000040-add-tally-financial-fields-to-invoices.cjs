"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable("invoices");

    if (!tableInfo.tally_subtotal) {
      await queryInterface.addColumn("invoices", "tally_subtotal", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableInfo.tally_tax_amount) {
      await queryInterface.addColumn("invoices", "tally_tax_amount", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableInfo.tally_rounding) {
      await queryInterface.addColumn("invoices", "tally_rounding", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableInfo.tally_grand_total) {
      await queryInterface.addColumn("invoices", "tally_grand_total", {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("invoices");

    if (tableInfo.tally_subtotal) {
      await queryInterface.removeColumn("invoices", "tally_subtotal");
    }
    if (tableInfo.tally_tax_amount) {
      await queryInterface.removeColumn("invoices", "tally_tax_amount");
    }
    if (tableInfo.tally_rounding) {
      await queryInterface.removeColumn("invoices", "tally_rounding");
    }
    if (tableInfo.tally_grand_total) {
      await queryInterface.removeColumn("invoices", "tally_grand_total");
    }
  },
};
