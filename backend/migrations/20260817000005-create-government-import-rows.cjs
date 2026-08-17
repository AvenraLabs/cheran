"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("government_import_rows", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      import_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "government_imports",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      row_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      application_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      imported_status: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      imported_status_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      dealer_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false, // NEW_PROJECT, UPDATE_PROJECT, STATUS_CHANGE, UNCHANGED, DUPLICATE_SOURCE_ROW, ERROR, DEALER_RESOLUTION_REQUIRED
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      matched_project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "government_projects",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      matched_dealer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "dealers",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      resolution_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "PENDING", // PENDING, RESOLVED, REJECTED
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true,
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

    await queryInterface.addIndex("government_import_rows", ["import_id"], {
      name: "idx_government_import_rows_import_id",
    });

    await queryInterface.addIndex("government_import_rows", ["application_id"], {
      name: "idx_government_import_rows_application_id",
    });

    await queryInterface.addIndex("government_import_rows", ["action"], {
      name: "idx_government_import_rows_action",
    });

    await queryInterface.addIndex("government_import_rows", ["resolution_status"], {
      name: "idx_government_import_rows_resolution_status",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("government_import_rows");
  },
};
