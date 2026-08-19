"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add created_by and updated_by to dealers table
    const tableInfo = await queryInterface.describeTable("dealers");

    if (!tableInfo.created_by) {
      await queryInterface.addColumn("dealers", "created_by", {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!tableInfo.updated_by) {
      await queryInterface.addColumn("dealers", "updated_by", {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable("dealers");

    if (tableInfo.created_by) {
      await queryInterface.removeColumn("dealers", "created_by");
    }

    if (tableInfo.updated_by) {
      await queryInterface.removeColumn("dealers", "updated_by");
    }
  },
};
