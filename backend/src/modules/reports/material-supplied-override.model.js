import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const MaterialSuppliedOverride = db.define(
  "MaterialSuppliedOverride",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    financial_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    supplied_ha: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    supplied_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "material_supplied_overrides",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["category", "financial_year"],
      },
    ],
  }
);

export default MaterialSuppliedOverride;
