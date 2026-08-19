"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const getOrCreateUnitId = async (symbol, name) => {
      const sym = symbol.toUpperCase();
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM units WHERE UPPER(symbol) = '${sym}' OR UPPER(name) = '${name.toUpperCase()}' LIMIT 1;`
      );
      if (existing && existing.length > 0) {
        return existing[0].id;
      }
      const id = require("crypto").randomUUID();
      await queryInterface.sequelize.query(
        `INSERT INTO units (id, name, symbol, is_active, created_at, updated_at) VALUES ('${id}', '${name}', '${sym}', true, NOW(), NOW());`
      );
      return id;
    };

    const mtrId = await getOrCreateUnitId("MTR", "Meter");
    const nosId = await getOrCreateUnitId("NOS", "Numbers");

    const standardFinishedGoods = [
      { name: "EMITING PIPE 16MM*60CM 4LIT (FLOT)", code: "FG-EMP-16-60-FL", unit_id: mtrId, unit_price: 10.85, category: "Drip Lateral" },
      { name: "EMITING PIPE 16MM*60CM 4LIT(ROUND)", code: "FG-EMP-16-60-RD", unit_id: mtrId, unit_price: 10.85, category: "Drip Lateral" },
      { name: "EMITING PIPE 16MM*40CM 4LIT(ROUND)", code: "FG-EMP-16-40-RD", unit_id: mtrId, unit_price: 11.30, category: "Drip Lateral" },
      { name: "EMITING PIPE 16MM*40CM 4LIT(FLOT)", code: "FG-EMP-16-40-FL", unit_id: mtrId, unit_price: 11.30, category: "Drip Lateral" },
      { name: "PLAIN LATERAL 16 MM (300MTR)", code: "FG-LAT-16-PL", unit_id: mtrId, unit_price: 10.85, category: "Drip Lateral" },
      { name: "SCREEN FILTER 63 MM", code: "FG-FLT-63", unit_id: nosId, unit_price: 2400.00, category: "Filters" },
      { name: "THROTTAL VALVE 63 MM", code: "FG-VLV-TH-63", unit_id: nosId, unit_price: 800.00, category: "Valves" },
      { name: "VENTURY 63 MM", code: "FG-VEN-63", unit_id: nosId, unit_price: 2500.00, category: "Fertigation" },
      { name: "PVC PIPE 63 MM", code: "FG-PVC-63", unit_id: mtrId, unit_price: 80.00, category: "Pipes" },
      { name: "PVC PIPE 75 MM", code: "FG-PVC-75", unit_id: mtrId, unit_price: 117.00, category: "Pipes" },
      { name: "AIR RELEASE VALVE 1\"", code: "FG-ARV-1", unit_id: nosId, unit_price: 125.00, category: "Valves" },
      { name: "CONTROL VALVE 75 MM", code: "FG-CV-75", unit_id: nosId, unit_price: 643.75, category: "Valves" },
      { name: "CONTROL VALVE 63 MM", code: "FG-CV-63", unit_id: nosId, unit_price: 445.00, category: "Valves" },
      { name: "FLUSH VALVE 63 MM", code: "FG-FV-63", unit_id: nosId, unit_price: 93.75, category: "Valves" },
      { name: "NON RETURN VALVE 63 MM", code: "FG-NRV-63", unit_id: nosId, unit_price: 850.00, category: "Valves" },
      { name: "BY PASS ASSEMBLY 63 MM", code: "FG-BPA-63", unit_id: nosId, unit_price: 970.00, category: "Assemblies" },
    ];

    for (const item of standardFinishedGoods) {
      const normalized = item.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM items WHERE normalized_name = '${normalized}' OR UPPER(name) = '${item.name.toUpperCase().replace(/'/g, "''")}';`
      );

      let itemId;
      if (existing.length === 0) {
        itemId = require("crypto").randomUUID();
        await queryInterface.sequelize.query(`
          INSERT INTO items (id, code, name, normalized_name, item_type, unit_id, category, unit_price, is_active, created_at, updated_at)
          VALUES ('${itemId}', '${item.code}', '${item.name.replace(/'/g, "''")}', '${normalized}', 'FINISHED_GOOD', '${item.unit_id}', '${item.category}', ${item.unit_price}, true, NOW(), NOW());
        `);
      } else {
        itemId = existing[0].id;
      }

      await queryInterface.sequelize.query(`
        INSERT INTO inventory_stock (id, item_id, quantity_on_hand, updated_at)
        VALUES ('${require("crypto").randomUUID()}', '${itemId}', 0.000, NOW())
        ON CONFLICT (item_id) DO NOTHING;
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Non-destructive
  },
};
