import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const CustomerPayment = db.define(
  "CustomerPayment",
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
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    payment_method: {
      type: DataTypes.ENUM("CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"),
      allowNull: false,
      defaultValue: "CASH",
    },
    reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "customer_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["sale_id"] },
      { fields: ["customer_id"] },
      { fields: ["payment_date"] },
    ],
  }
);

export default CustomerPayment;
