"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("scheme_tax_slabs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      effective_from: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      effective_to: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      gst_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5.0,
      },
      fittings_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 5.0,
      },
      description: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex("scheme_tax_slabs", ["effective_from"], {
      name: "idx_scheme_tax_slabs_effective_from",
    });

    // Seed default scheme slabs: Pre-Sep 2025 (12% GST) and Post-Sep 2025 (5% GST)
    const slab1Id = require("crypto").randomUUID();
    const slab2Id = require("crypto").randomUUID();

    await queryInterface.bulkInsert("scheme_tax_slabs", [
      {
        id: slab1Id,
        effective_from: "2000-01-01",
        effective_to: "2025-09-21",
        gst_percentage: 12.0,
        fittings_percentage: 5.0,
        description: "Government Scheme Pre-Sep 2025 (12% GST + 5% Fittings deduction)",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: slab2Id,
        effective_from: "2025-09-22",
        effective_to: null,
        gst_percentage: 5.0,
        fittings_percentage: 5.0,
        description: "Government Scheme Post-Sep 2025 (5% GST + 5% Fittings deduction)",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("scheme_tax_slabs");
  },
};
