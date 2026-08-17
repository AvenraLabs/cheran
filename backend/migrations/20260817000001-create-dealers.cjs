"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("dealers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      normalized_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      commission_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      commission_basis: {
        type: Sequelize.STRING(50),
        allowNull: true,
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

    await queryInterface.addIndex("dealers", ["normalized_name"], {
      name: "idx_dealers_normalized_name",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("dealers");
  },
};
