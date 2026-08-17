"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Allow symbol to be nullable in units table
    await queryInterface.changeColumn("units", "symbol", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // 2. Ensure name is unique in units
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_units_name" ON "units" (LOWER(TRIM("name")));
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "uniq_units_name";
    `);
  },
};
