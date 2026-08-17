"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("government_project_documents", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "government_projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      document_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      document_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Quotation, Invoice, Work Order, Joint Verification, Subsidy Slip, etc.",
      },
      file_path: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      file_size: {
        type: Sequelize.BIGINT,
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
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("government_project_documents", ["project_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("government_project_documents");
  },
};
