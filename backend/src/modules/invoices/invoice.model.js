import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Invoice = db.define(
  "Invoice",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    government_project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    dealer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    net_item_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    fittings_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
    fittings_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    gst_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    invoice_type: {
      type: DataTypes.ENUM("GOVERNMENT", "DIRECT_SALE"),
      allowNull: false,
      defaultValue: "DIRECT_SALE",
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "POSTED", "CANCELLED"),
      allowNull: false,
      defaultValue: "POSTED",
    },
    paid_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "UNPAID", // "UNPAID" | "PARTIALLY_PAID" | "PAID"
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment_reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    payment_history: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "MANUAL",
    },
    tally_guid: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tally_remote_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tally_vch_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tally_voucher_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    party_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    party_mailing_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tally_raw_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "invoices",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["invoice_number", "invoice_type"], unique: true },
      { fields: ["source", "tally_guid"], unique: true },
      { fields: ["government_project_id"] },
      { fields: ["customer_id"] },
      { fields: ["dealer_id"] },
      { fields: ["invoice_date"] },
      { fields: ["status"] },
    ],
  }
);

export default Invoice;
