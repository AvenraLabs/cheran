"use strict";

/**
 * Migration 014: Synchronize farmer contribution across all proceeding batches (40%, 45%, 55%, 60%)
 * and recalculate total_material_cost, net_material_base, and commission_amount for all existing tranches.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Sync farmer_contribution to government_projects from any proceeding_batch_projects
    await queryInterface.sequelize.query(`
      UPDATE government_projects gp
      SET farmer_contribution = bp.max_fc
      FROM (
        SELECT application_id, MAX(farmer_contribution) as max_fc
        FROM proceeding_batch_projects
        WHERE farmer_contribution > 0
        GROUP BY application_id
      ) bp
      WHERE UPPER(gp.application_id) = UPPER(bp.application_id)
        AND (gp.farmer_contribution IS NULL OR gp.farmer_contribution = 0);
    `).catch(() => {});

    // 2. Sync farmer_contribution to proceeding_batch_projects from government_projects
    await queryInterface.sequelize.query(`
      UPDATE proceeding_batch_projects pbp
      SET farmer_contribution = gp.farmer_contribution
      FROM government_projects gp
      WHERE UPPER(pbp.application_id) = UPPER(gp.application_id)
        AND gp.farmer_contribution > 0
        AND (pbp.farmer_contribution IS NULL OR pbp.farmer_contribution = 0);
    `).catch(() => {});

    // 3. Sync farmer_contribution between sibling batches of the same application_id
    await queryInterface.sequelize.query(`
      UPDATE proceeding_batch_projects pbp
      SET farmer_contribution = siblings.max_fc
      FROM (
        SELECT application_id, MAX(farmer_contribution) as max_fc
        FROM proceeding_batch_projects
        WHERE farmer_contribution > 0
        GROUP BY application_id
      ) siblings
      WHERE UPPER(pbp.application_id) = UPPER(siblings.application_id)
        AND siblings.max_fc > 0
        AND (pbp.farmer_contribution IS NULL OR pbp.farmer_contribution = 0);
    `).catch(() => {});

    // 4. Recalculate total_material_cost and net_material_base where farmer_contribution > 0
    await queryInterface.sequelize.query(`
      UPDATE proceeding_batch_projects p
      SET
        total_material_cost = FLOOR(
          ((COALESCE(NULLIF(p.subsidy_amount, 0), NULLIF(p.state_restricted_amount, 0), p.invoice_amount, 0) + p.farmer_contribution)
          / (1 + COALESCE(p.gst_percentage, 12.0) / 100.0))
          / (1 + COALESCE(p.fittings_percentage, 5.0) / 100.0)
        ),
        net_material_base = FLOOR(
          FLOOR(
            ((COALESCE(NULLIF(p.subsidy_amount, 0), NULLIF(p.state_restricted_amount, 0), p.invoice_amount, 0) + p.farmer_contribution)
            / (1 + COALESCE(p.gst_percentage, 12.0) / 100.0))
            / (1 + COALESCE(p.fittings_percentage, 5.0) / 100.0)
          ) * COALESCE(b.fund_percentage_value, 55.0) / 100.0
        ),
        commission_amount = FLOOR(
          FLOOR(
            FLOOR(
              ((COALESCE(NULLIF(p.subsidy_amount, 0), NULLIF(p.state_restricted_amount, 0), p.invoice_amount, 0) + p.farmer_contribution)
              / (1 + COALESCE(p.gst_percentage, 12.0) / 100.0))
              / (1 + COALESCE(p.fittings_percentage, 5.0) / 100.0)
            ) * COALESCE(b.fund_percentage_value, 55.0) / 100.0
          ) * COALESCE(p.dealer_rate_percentage, 20.0) / 100.0
        )
      FROM proceeding_batches b
      WHERE p.proceeding_batch_id = b.id
        AND p.farmer_contribution > 0;
    `).catch(() => {});
  },

  async down(queryInterface, Sequelize) {
    // Non-destructive rollback
  },
};
