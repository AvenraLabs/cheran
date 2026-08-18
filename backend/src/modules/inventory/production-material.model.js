import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ProductionMaterial = db.define(
  "ProductionMaterial",
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
    quantity_used: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    wastage_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "production_materials",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["production_entry_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export default ProductionMaterial;
