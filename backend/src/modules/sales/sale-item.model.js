import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const SaleItem = db.define(
  "SaleItem",
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
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
  },
  {
    tableName: "sale_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["sale_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export default SaleItem;
