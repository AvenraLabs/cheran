import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GovernmentProject = db.define(
  "GovernmentProject",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    application_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    year: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Farmer Fields (Embedded directly)
    farmer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    father_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    caste: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    farmer_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Location
    district: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    block: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    village: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    survey_no_subdivision_no: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Crop & Irrigation
    crop: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    spacing: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    total_area_ha: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    applied_area_ha: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    scheme: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    irrigation_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sprinkler_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sprinkler_spacing: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sugar_mill: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sugar_drip_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sugar_well_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    mi_company: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    mi_reference_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dealer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "dealers",
        key: "id",
      },
    },
    // Financials & Quotation
    quotation_subsidy_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    quotation_saca_subsidy_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    farmer_contribution: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    invoice_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    state_restricted_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    work_order_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    work_order_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    supply_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    application_received_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    quotation_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Fund Release Milestones
    first_fund_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    goi_share_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    state_share_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    first_fund_proceeding_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    first_fund_utr_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    first_fund_utr_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    joint_verification_recommended_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    earlier_jv_completed_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    jv_recommended_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    second_fund_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    additional_state_share_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    gst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    second_fund_proceeding_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    final_fund_utr_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    treasury_fund_utr_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    final_fund_utr_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    treasury_fund_utr_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    total_fund_released: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    ae_restricted_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    bank_guarantee_deducted_pct: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    bank_guarantee_deducted_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    // Current Government Status
    current_status: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    current_status_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    current_status_remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    no_of_days_pending: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    fund_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    proceeding_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fra_act: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "government_projects",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["application_id"],
      },
      {
        fields: ["current_status"],
      },
      {
        fields: ["dealer_id"],
      },
      {
        fields: ["district", "block", "village"],
      },
      {
        fields: ["farmer_name"],
      },
    ],
  }
);

export default GovernmentProject;
