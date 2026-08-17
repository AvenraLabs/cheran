import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const EmployeeAttendance = db.define(
  "EmployeeAttendance",
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
    attendance_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PRESENT", "ABSENT", "HALF_DAY", "LEAVE"),
      allowNull: false,
      defaultValue: "PRESENT",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "employee_attendance",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "attendance_date"],
        name: "uniq_employee_attendance_date",
      },
      { fields: ["attendance_date"] },
    ],
  }
);

export default EmployeeAttendance;
