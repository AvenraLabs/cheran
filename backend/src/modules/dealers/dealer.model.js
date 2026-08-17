import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Dealer = db.define(
  "Dealer",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    normalized_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    commission_basis: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "dealers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["normalized_name"],
      },
    ],
  }
);

export default Dealer;
