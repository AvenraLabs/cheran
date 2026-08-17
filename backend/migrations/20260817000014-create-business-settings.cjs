"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("business_settings", {
      key: {
        type: Sequelize.STRING(100),
        primaryKey: true,
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    // Seed default settings
    const now = new Date();
    await queryInterface.bulkInsert("business_settings", [
      {
        key: "FITTINGS_PERCENTAGE",
        value: "5.0",
        description: "Default fittings calculation percentage for sales (5% of net items total)",
        updated_at: now,
      },
      {
        key: "DEFAULT_GST_PERCENTAGE",
        value: "18.0",
        description: "Default standard GST tax rate percentage",
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("business_settings");
  },
};
