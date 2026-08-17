"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sales", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "government_projects",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      invoice_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      sale_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_DATE"),
      },
      net_item_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      fittings_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5.0,
      },
      fittings_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      taxable_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      gst_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 18.0,
      },
      gst_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      total_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "CONFIRMED", "CANCELLED"),
        allowNull: false,
        defaultValue: "CONFIRMED",
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("sales", ["customer_id"]);
    await queryInterface.addIndex("sales", ["project_id"]);
    await queryInterface.addIndex("sales", ["sale_date"]);
    await queryInterface.addIndex("sales", ["invoice_number"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sales");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sales_status";');
  },
};
