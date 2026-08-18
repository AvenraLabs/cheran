import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const DealerCommission = db.define(
  "DealerCommission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dealer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    penalty_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    effective_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    base_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    commission_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("PENDING", "APPROVED", "PAID"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    part1_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 55.0,
    },
    part1_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    part1_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "LOCKED",
    },
    part1_paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    part1_paid_ref: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    part1_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    part2_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 45.0,
    },
    part2_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    part2_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "LOCKED",
    },
    part2_paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    part2_paid_ref: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    part2_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    breakdown_json: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    tableName: "dealer_commissions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["dealer_id"] },
      { fields: ["project_id"] },
      { fields: ["status"] },
      { fields: ["part1_status"] },
      { fields: ["part2_status"] },
    ],
  }
);

export default DealerCommission;
