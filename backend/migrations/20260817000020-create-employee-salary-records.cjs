"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("employee_salary_records", {
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
      salary_month: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      salary_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      base_salary: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      adjustments: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      deductions: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      net_salary: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "PAID"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
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

    await queryInterface.addIndex("employee_salary_records", ["employee_id", "salary_year", "salary_month"], {
      unique: true,
      name: "uniq_employee_salary_period",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("employee_salary_records");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_employee_salary_records_status";');
  },
};
