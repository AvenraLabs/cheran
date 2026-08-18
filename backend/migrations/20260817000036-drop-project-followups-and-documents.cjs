"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable("government_project_documents");
    await queryInterface.dropTable("government_project_followups");
  },

  async down(queryInterface, Sequelize) {
    // Recreate if rollback
    await queryInterface.createTable("government_project_followups", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      followup_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      next_action: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("OPEN", "RESOLVED", "CANCELLED"),
        allowNull: false,
        defaultValue: "OPEN",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable("government_project_documents", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      document_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      document_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
};
