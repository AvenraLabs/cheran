import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PlastSale = db.define(
  "PlastSale",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sale_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sale_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    customer_phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total_discount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0, // 0, 5, or 18
    },
    gst_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    grand_total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "PAID", // PAID, UNPAID, PARTIAL
    },
    payment_mode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "CASH", // CASH, UPI, BANK_TRANSFER, CHEQUE
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "plast_sales",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["sale_number"], unique: true },
      { fields: ["sale_date"] },
      { fields: ["customer_id"] },
    ],
  }
);

export default PlastSale;
