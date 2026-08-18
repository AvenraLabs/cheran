import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const ProductionEntry = db.define(
  "ProductionEntry",
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
  },
  {
    tableName: "production_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["production_date"] }],
  }
);

export default ProductionEntry;
