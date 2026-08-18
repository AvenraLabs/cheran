import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ProductionOutput = db.define(
  "ProductionOutput",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    production_entry_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity_produced: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
  },
  {
    tableName: "production_outputs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["production_entry_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export default ProductionOutput;
