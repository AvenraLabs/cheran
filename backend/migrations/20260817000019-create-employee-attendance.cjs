"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employee_attendance", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      attendance_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PRESENT", "ABSENT", "HALF_DAY", "LEAVE"),
        allowNull: false,
        defaultValue: "PRESENT",
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("employee_attendance", ["employee_id", "attendance_date"], {
      unique: true,
      name: "uniq_employee_attendance_date",
    });
    await queryInterface.addIndex("employee_attendance", ["attendance_date"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("employee_attendance");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_employee_attendance_status";');
  },
};
