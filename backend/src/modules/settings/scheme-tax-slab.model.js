import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const SchemeTaxSlab = db.define(
  "SchemeTaxSlab",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    effective_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    effective_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
    fittings_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "scheme_tax_slabs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["effective_from"],
      },
    ],
  }
);

export default SchemeTaxSlab;
