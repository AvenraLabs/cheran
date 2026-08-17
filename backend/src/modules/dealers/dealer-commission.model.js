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
    ],
  }
);

export default DealerCommission;
