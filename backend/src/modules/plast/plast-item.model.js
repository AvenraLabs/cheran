import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const PlastItem = db.define(
  "PlastItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    item_type: {
      type: DataTypes.ENUM("RAW_MATERIAL", "FINISHED_GOOD"),
      allowNull: false,
      defaultValue: "FINISHED_GOOD",
    },
    unit_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "plast_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["name"] },
      { fields: ["item_type"] },
      { fields: ["category"] },
    ],
  }
);

export default PlastItem;
