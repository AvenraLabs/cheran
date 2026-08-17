import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const BusinessSetting = db.define(
  "BusinessSetting",
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "business_settings",
    timestamps: true,
    createdAt: false,
    updatedAt: "updated_at",
  }
);

export default BusinessSetting;
