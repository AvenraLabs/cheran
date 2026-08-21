import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

export const FundPercentageMaster = sequelize.define(
  "FundPercentageMaster",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    tableName: "fund_percentage_masters",
    timestamps: true,
    underscored: true,
  }
);

export default FundPercentageMaster;
