"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("units", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      symbol: {
        type: Sequelize.STRING(20),
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

    // Seed default standard measurement units
    const now = new Date();
    await queryInterface.bulkInsert("units", [
      { id: "11111111-1111-1111-1111-111111111101", name: "Kilogram", symbol: "KG", is_active: true, created_at: now, updated_at: now },
      { id: "11111111-1111-1111-1111-111111111102", name: "Gram", symbol: "GRAM", is_active: true, created_at: now, updated_at: now },
      { id: "11111111-1111-1111-1111-111111111103", name: "Meter", symbol: "MTR", is_active: true, created_at: now, updated_at: now },
      { id: "11111111-1111-1111-1111-111111111104", name: "Number / Pieces", symbol: "NOS", is_active: true, created_at: now, updated_at: now },
      { id: "11111111-1111-1111-1111-111111111105", name: "Litre", symbol: "LITRE", is_active: true, created_at: now, updated_at: now },
      { id: "11111111-1111-1111-1111-111111111106", name: "Set", symbol: "SET", is_active: true, created_at: now, updated_at: now },
      { id: "11111111-1111-1111-1111-111111111107", name: "Box", symbol: "BOX", is_active: true, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("units");
  },
};
