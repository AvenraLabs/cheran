import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PlastStockReceipt = db.define(
  "PlastStockReceipt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    supplier_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receipt_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "plast_stock_receipts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["receipt_date"] }, { fields: ["supplier_id"] }],
  }
);

export default PlastStockReceipt;
