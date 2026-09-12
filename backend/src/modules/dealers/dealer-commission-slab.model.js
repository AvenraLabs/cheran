import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const DealerCommissionSlab = db.define(
  "DealerCommissionSlab",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dealer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "dealers",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    effective_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Start date for this commission rate (inclusive)",
    },
    effective_to: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "End date for this commission rate (inclusive, null means open-ended/present)",
    },
    commission_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    notes: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "dealer_commission_slabs",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["dealer_id", "effective_from"],
      },
      {
        fields: ["effective_from", "effective_to"],
      },
    ],
  }
);

export default DealerCommissionSlab;
