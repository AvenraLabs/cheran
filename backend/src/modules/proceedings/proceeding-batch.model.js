import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

export const ProceedingBatch = sequelize.define(
  "ProceedingBatch",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proceeding_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    proceeding_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fund_percentage_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    fund_percentage_value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 55.0,
    },
    total_proceeding_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_received_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    payment_received_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    total_calculated_commission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_calculated_fittings: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    dealer_payout_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "UNPAID", // UNPAID, PARTIAL, PAID
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    include_fittings: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "proceeding_batches",
    timestamps: true,
    underscored: true,
  }
);

export default ProceedingBatch;
