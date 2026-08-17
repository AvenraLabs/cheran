import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const EmployeeSalaryRecord = db.define(
  "EmployeeSalaryRecord",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    salary_month: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    salary_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    base_salary: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    adjustments: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    deductions: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    net_salary: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "employee_salary_records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "salary_year", "salary_month"],
        name: "uniq_employee_salary_period",
      },
    ],
  }
);

export default EmployeeSalaryRecord;
