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
      allowNull: false,
    },
    item_name_snapshot: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    unit_snapshot: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    line_total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
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
