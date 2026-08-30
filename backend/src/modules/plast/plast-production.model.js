import { DataTypes } from "sequelize";
import db from "../../config/db.js";

export const PlastProductionEntry = db.define(
  "PlastProductionEntry",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    production_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "plast_production_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["production_date"] }],
  }
);

export const PlastProductionMaterial = db.define(
  "PlastProductionMaterial",
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
      allowNull: true,
    },
    quantity_used: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
    wastage_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "plast_production_materials",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["production_entry_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export const PlastProductionOutput = db.define(
  "PlastProductionOutput",
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
      allowNull: true,
    },
    quantity_produced: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "plast_production_outputs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["production_entry_id"] },
      { fields: ["item_id"] },
    ],
  }
);

export default {
  PlastProductionEntry,
  PlastProductionMaterial,
  PlastProductionOutput,
};
