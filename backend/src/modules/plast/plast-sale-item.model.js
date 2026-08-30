import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PlastSaleItem = db.define(
  "PlastSaleItem",
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
    item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    discount_amount: {
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
    tableName: "plast_sale_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["sale_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export default PlastSaleItem;
