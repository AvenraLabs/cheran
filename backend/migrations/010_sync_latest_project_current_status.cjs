"use strict";

/**
 * Migration 010: Synchronize Latest Project Current Status
 * 
 * Ensures:
 * 1. government_projects.current_status always reflects the TRUE highest/latest lifecycle stage
 *    according to government_statuses sequence_order.
 * 2. Prevents projects from being stuck at lower stages (e.g. Stage 49 District First Fund Credited
 *    when Stage 50 First Fund Credited has occurred, or Stage 22 Issued Work Order when invoiced).
 * 
 * Safe & Idempotent.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Sync current_status from maximum recorded status in history
    await queryInterface.sequelize.query(`
      UPDATE government_projects p
      SET 
        current_status = h_max.status,
        current_status_date = COALESCE(h_max.status_date, p.current_status_date)
      FROM (
        SELECT DISTINCT ON (h.project_id) 
          h.project_id,
          h.status,
          h.status_date,
          gs.sequence_order
        FROM government_project_status_history h
        JOIN government_statuses gs ON h.status = gs.name
        ORDER BY h.project_id, gs.sequence_order DESC, h.status_date DESC
      ) h_max,
      government_statuses gs_curr
      WHERE p.id = h_max.project_id
        AND p.current_status = gs_curr.name
        AND h_max.sequence_order > gs_curr.sequence_order;
    `);

    // 2. Ensure projects with first_fund_utr_date are at least sequence 50 (First Fund Credited)
    await queryInterface.sequelize.query(`
      UPDATE government_projects p
      SET 
        current_status = 'First Fund Credited (UTR Updated)',
        current_status_date = COALESCE(p.first_fund_utr_date, p.current_status_date)
      FROM government_statuses gs
      WHERE p.current_status = gs.name
        AND p.first_fund_utr_date IS NOT NULL
        AND gs.sequence_order < 50;
    `);

    // 3. Ensure projects with invoice_date are at least sequence 23 (INVOICED)
    await queryInterface.sequelize.query(`
      UPDATE government_projects p
      SET 
        current_status = 'INVOICED',
        current_status_date = COALESCE(p.invoice_date, p.current_status_date)
      FROM government_statuses gs
      WHERE p.current_status = gs.name
        AND (p.invoice_date IS NOT NULL OR (p.invoice_number IS NOT NULL AND TRIM(p.invoice_number) != ''))
        AND gs.sequence_order < 23;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Historical status synchronization does not require rollback
  }
};
