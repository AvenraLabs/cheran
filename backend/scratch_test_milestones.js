import env from "./src/config/env.js";
import db from "./src/config/db.js";

async function run() {
  const sql = `
    WITH project_milestones AS (
      SELECT 
        gp.id AS project_id,
        gp.application_id,
        
        -- 1. Issue Work Order Date
        MIN(CASE WHEN h.status IN ('Issued Work Order', 'Issue Work Order (Auto Quotation)') THEN COALESCE(h.status_date, h.observed_at::date) END) AS wo_date,
        
        -- 2. Invoiced Date
        MIN(CASE WHEN h.status = 'INVOICED' THEN COALESCE(h.status_date, h.observed_at::date) END) AS inv_date,
        
        -- 3. Work Completion Date
        MIN(CASE WHEN h.status IN ('Work Completed', 'Work Completion Approved') THEN COALESCE(h.status_date, h.observed_at::date) END) AS wc_date,
        
        -- 4. 1st Fund Credited Date
        MIN(CASE WHEN h.status IN ('First Fund Credited (UTR Updated)', 'District First Fund Credited (UTR Updated)') THEN COALESCE(h.status_date, h.observed_at::date) END) AS fund1_date,
        
        -- 5. Joint Verification Date
        MIN(CASE WHEN h.status IN ('Joint Verification Completed', 'Earlier JV Completed') THEN COALESCE(h.status_date, h.observed_at::date) END) AS jv_date
        
      FROM government_projects gp
      INNER JOIN government_project_status_history h ON h.project_id = gp.id
      GROUP BY gp.id, gp.application_id
    )
    SELECT 
      -- Milestone 1: Issue Work Order -> INVOICED
      COUNT(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN 1 END)::integer AS count_wo_to_inv,
      ROUND(AVG(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN (inv_date - wo_date) END), 1)::float AS avg_wo_to_inv,
      MIN(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN (inv_date - wo_date) END)::integer AS min_wo_to_inv,
      MAX(CASE WHEN wo_date IS NOT NULL AND inv_date IS NOT NULL AND inv_date >= wo_date THEN (inv_date - wo_date) END)::integer AS max_wo_to_inv,

      -- Milestone 2: INVOICED -> Work Completion
      COUNT(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN 1 END)::integer AS count_inv_to_wc,
      ROUND(AVG(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN (wc_date - inv_date) END), 1)::float AS avg_inv_to_wc,
      MIN(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN (wc_date - inv_date) END)::integer AS min_inv_to_wc,
      MAX(CASE WHEN inv_date IS NOT NULL AND wc_date IS NOT NULL AND wc_date >= inv_date THEN (wc_date - inv_date) END)::integer AS max_inv_to_wc,

      -- Milestone 3: First Fund Credited -> Joint Verification
      COUNT(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN 1 END)::integer AS count_fund1_to_jv,
      ROUND(AVG(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN (jv_date - fund1_date) END), 1)::float AS avg_fund1_to_jv,
      MIN(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN (jv_date - fund1_date) END)::integer AS min_fund1_to_jv,
      MAX(CASE WHEN fund1_date IS NOT NULL AND jv_date IS NOT NULL AND jv_date >= fund1_date THEN (jv_date - fund1_date) END)::integer AS max_fund1_to_jv

    FROM project_milestones;
  `;

  const rows = await db.query(sql, { type: db.QueryTypes.SELECT });
  console.log('Result:', rows[0]);
  process.exit(0);
}

run().catch(console.error);
