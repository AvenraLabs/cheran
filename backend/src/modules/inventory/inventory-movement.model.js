import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const InventoryMovement = db.define(
  "InventoryMovement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    movement_type: {
      type: DataTypes.ENUM(
        "OPENING",
        "PURCHASE",
        "ADJUSTMENT_IN",
        "ADJUSTMENT_OUT",
        "SALE",
        "DISPATCH",
        "PRODUCTION_IN",
        "PRODUCTION_OUT"
      ),
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
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    movement_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    unit_cost: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "inventory_movements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["item_id"] },
      { fields: ["movement_type"] },
      { fields: ["movement_date"] },
      { fields: ["reference_type", "reference_id"] },
    ],
  }
);

export default InventoryMovement;
