import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PlastSalePayment = db.define(
  "PlastSalePayment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    payment_mode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "CASH", // CASH, UPI, BANK_TRANSFER, CHEQUE
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "plast_sale_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["sale_id"] },
      { fields: ["payment_date"] },
    ],
  }
);

export default PlastSalePayment;
