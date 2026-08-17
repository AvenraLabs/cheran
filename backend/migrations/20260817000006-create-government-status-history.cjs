"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("government_project_status_history", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "government_projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      source_import_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "government_imports",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      observed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("government_project_status_history", ["project_id"], {
      name: "idx_gov_proj_status_history_project_id",
    });

    await queryInterface.addIndex(
      "government_project_status_history",
      ["project_id", "status", "status_date", "source_import_id"],
      {
        unique: true,
        name: "idx_unique_project_status_history",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("government_project_status_history");
  },
};
