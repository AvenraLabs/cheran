"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("expense_categories", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    const now = new Date();
    await queryInterface.bulkInsert("expense_categories", [
      { id: "22222222-2222-2222-2222-222222222201", name: "Electricity", is_active: true, created_at: now, updated_at: now },
      { id: "22222222-2222-2222-2222-222222222202", name: "Transport & Logistics", is_active: true, created_at: now, updated_at: now },
      { id: "22222222-2222-2222-2222-222222222203", name: "Office & Admin", is_active: true, created_at: now, updated_at: now },
      { id: "22222222-2222-2222-2222-222222222204", name: "Plant Maintenance", is_active: true, created_at: now, updated_at: now },
      { id: "22222222-2222-2222-2222-222222222205", name: "Salary & Staff Welfare", is_active: true, created_at: now, updated_at: now },
      { id: "22222222-2222-2222-2222-222222222206", name: "Miscellaneous", is_active: true, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("expense_categories");
  },
};
