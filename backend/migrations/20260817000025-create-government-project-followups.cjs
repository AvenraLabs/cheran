"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("government_project_followups", {
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
      followup_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_DATE"),
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      next_action_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: "OPEN",
      },
      created_by: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex("government_project_followups", ["project_id"]);
    await queryInterface.addIndex("government_project_followups", ["followup_date"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("government_project_followups");
  },
};
