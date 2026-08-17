"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const defaultUnitIds = [
      "11111111-1111-1111-1111-111111111101",
      "11111111-1111-1111-1111-111111111102",
      "11111111-1111-1111-1111-111111111103",
      "11111111-1111-1111-1111-111111111104",
      "11111111-1111-1111-1111-111111111105",
      "11111111-1111-1111-1111-111111111106",
      "11111111-1111-1111-1111-111111111107",
    ];

    const defaultCatIds = [
      "22222222-2222-2222-2222-222222222201",
      "22222222-2222-2222-2222-222222222202",
      "22222222-2222-2222-2222-222222222203",
      "22222222-2222-2222-2222-222222222204",
      "22222222-2222-2222-2222-222222222205",
      "22222222-2222-2222-2222-222222222206",
    ];

    // Safely delete unreferenced default seeded units
    await queryInterface.sequelize.query(
      `DELETE FROM units 
       WHERE id IN (:defaultUnitIds) 
       AND id NOT IN (SELECT DISTINCT unit_id FROM items WHERE unit_id IS NOT NULL);`,
      { replacements: { defaultUnitIds } }
    );

    // Safely delete unreferenced default seeded expense categories
    await queryInterface.sequelize.query(
      `DELETE FROM expense_categories 
       WHERE id IN (:defaultCatIds) 
       AND id NOT IN (SELECT DISTINCT category_id FROM expenses WHERE category_id IS NOT NULL);`,
      { replacements: { defaultCatIds } }
    );
  },

  async down(queryInterface, Sequelize) {
    // No-op rollback to prevent re-seeding unwanted data
  },
};
