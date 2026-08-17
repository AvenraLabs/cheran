"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("government_statuses", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex("government_statuses", ["name"], {
      unique: true,
      name: "idx_government_statuses_name",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("government_statuses");
  },
};
