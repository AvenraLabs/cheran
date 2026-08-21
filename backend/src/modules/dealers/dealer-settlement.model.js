import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

export const DealerSettlement = sequelize.define(
  "DealerSettlement",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dealer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    proceeding_batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    proceeding_batch_project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    application_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fund_percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    state_restricted_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    fund_release_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    gst_percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    fittings_percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 5.0,
    },
    dealer_base_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    penalty_percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    effective_rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    net_material_base: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    commission_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    fittings_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    total_paid: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    utr_reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "dealer_settlements",
    timestamps: true,
    underscored: true,
  }
);

export default DealerSettlement;
