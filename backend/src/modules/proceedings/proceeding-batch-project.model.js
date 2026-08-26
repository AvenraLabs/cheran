import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

export const ProceedingBatchProject = sequelize.define(
  "ProceedingBatchProject",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    proceeding_batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    application_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dealer_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    farmer_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    block: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    village: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fund_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    invoice_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    subsidy_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    state_restricted_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    total_material_cost: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    now_to_be_released_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    excel_gst_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    goi_share_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    state_share_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    addl_state_share_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    fund_share_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    gst_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 12.0,
    },
    fittings_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
    },
    penalty_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    net_material_base: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    dealer_rate_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    commission_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    fittings_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    milestone_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    milestone_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    milestone_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    delay_days: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    penalty_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    adjusted_penalty_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    is_paid_to_dealer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    dealer_paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dealer_paid_ref: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "proceeding_batch_projects",
    timestamps: true,
    underscored: true,
  }
);

export default ProceedingBatchProject;
