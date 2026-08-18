import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const InvoiceItem = db.define(
  "InvoiceItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    item_name_snapshot: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    unit_snapshot: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    tally_item_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    billed_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    rate: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    line_total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "invoice_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["invoice_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export default InvoiceItem;
