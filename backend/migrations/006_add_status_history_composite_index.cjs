"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add composite index on (project_id, status_date) for fast SLA penalty & timeline queries
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_gov_proj_status_history_project_date
      ON government_project_status_history (project_id, status_date);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS idx_gov_proj_status_history_project_date;
    `);
  },
};
