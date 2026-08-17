"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("customer_payments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "sales",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "customers",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_DATE"),
      },
      payment_method: {
        type: Sequelize.ENUM("CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"),
        allowNull: false,
        defaultValue: "CASH",
      },
      reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
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

    await queryInterface.addIndex("customer_payments", ["sale_id"]);
    await queryInterface.addIndex("customer_payments", ["customer_id"]);
    await queryInterface.addIndex("customer_payments", ["payment_date"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("customer_payments");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_customer_payments_payment_method";');
  },
};
