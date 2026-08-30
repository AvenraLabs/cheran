import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PlastInventoryStock = db.define(
  "PlastInventoryStock",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    quantity_on_hand: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "plast_inventory_stock",
    timestamps: true,
    createdAt: false,
    updatedAt: "updated_at",
    indexes: [{ fields: ["item_id"], unique: true }],
  }
);

export default PlastInventoryStock;
