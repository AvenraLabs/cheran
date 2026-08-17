"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("government_projects", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      year: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      farmer_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      father_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      mobile: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      caste: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      farmer_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      district: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      block: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      village: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      survey_no_subdivision_no: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      crop: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      spacing: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      total_area_ha: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      applied_area_ha: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      scheme: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      irrigation_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sprinkler_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sprinkler_spacing: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sugar_mill: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sugar_drip_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sugar_well_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mi_company: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      mi_reference_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      dealer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "dealers",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      quotation_subsidy_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      quotation_saca_subsidy_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      farmer_contribution: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      invoice_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      state_restricted_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      work_order_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      work_order_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      supply_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      application_received_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      quotation_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      first_fund_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      goi_share_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      state_share_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      first_fund_proceeding_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      first_fund_utr_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      first_fund_utr_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      joint_verification_recommended_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      earlier_jv_completed_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      jv_recommended_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      second_fund_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      additional_state_share_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      gst_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      second_fund_proceeding_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      final_fund_utr_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      treasury_fund_utr_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      final_fund_utr_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      treasury_fund_utr_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      total_fund_released: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      ae_restricted_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      current_status: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      current_status_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      current_status_remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      no_of_days_pending: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      fund_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      proceeding_status: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      fra_act: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("government_projects", ["application_id"], {
      unique: true,
      name: "idx_government_projects_application_id",
    });

    await queryInterface.addIndex("government_projects", ["current_status"], {
      name: "idx_government_projects_current_status",
    });

    await queryInterface.addIndex("government_projects", ["dealer_id"], {
      name: "idx_government_projects_dealer_id",
    });

    await queryInterface.addIndex("government_projects", ["district", "block", "village"], {
      name: "idx_government_projects_location",
    });

    await queryInterface.addIndex("government_projects", ["farmer_name"], {
      name: "idx_government_projects_farmer_name",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("government_projects");
  },
};
