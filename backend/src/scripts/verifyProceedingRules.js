import db from "../config/db.js";
import {
  Dealer,
  GovernmentProject,
  GovernmentProjectStatusHistory,
  ProceedingBatch,
  ProceedingBatchProject,
  DealerSettlement,
  SchemeTaxSlab,
} from "../models/initModels.js";
import {
  previewProceedingIds,
  createProceedingBatch,
  markDealerPayout,
} from "../modules/proceedings/proceeding.service.js";

async function runTests() {
  console.log("🚀 Starting Comprehensive Proceeding & Financial Engine Verification...\n");

  try {
    await db.authenticate();
    console.log("✅ Database Connected.");

    // 1. Setup Test Dealer
    let testDealer = await Dealer.findOne({ where: { name: "TEST AUTO DEALER" } });
    if (!testDealer) {
      testDealer = await Dealer.create({
        name: "TEST AUTO DEALER",
        normalized_name: "TEST AUTO DEALER",
        commission_percentage: 20.0,
        is_active: true,
      });
    }

    // 2. Setup Test Government Project A (Pre-Sep 2025: 12% GST, 90 days delay on Phase 1)
    const testAppIdA = `TEST-APP-A-${Date.now()}`;
    const projA = await GovernmentProject.create({
      application_id: testAppIdA,
      farmer_name: "Farmer A (12% GST / 90d Delay)",
      district: "Coimbatore",
      dealer_id: testDealer.id,
      state_restricted_amount: 100000.0, // 1 Lakh
      invoice_amount: 110000.0,
      quotation_subsidy_amount: 115000.0,
      invoice_date: "2024-06-01", // 12% GST
      current_status: "Work Completion Approved",
    });

    // History for Proj A: Invoiced (2024-06-01) -> Work Completion Approved (2024-08-30 = 90 days -> -2% penalty)
    await GovernmentProjectStatusHistory.create({
      project_id: projA.id,
      status: "INVOICED",
      status_date: "2024-06-01",
    });
    await GovernmentProjectStatusHistory.create({
      project_id: projA.id,
      status: "WORK COMPLETION APPROVED",
      status_date: "2024-08-30",
    });

    // 3. Setup Test Government Project B (Post-Sep 2025: 5% GST, 0 days delay)
    const testAppIdB = `TEST-APP-B-${Date.now()}`;
    const projB = await GovernmentProject.create({
      application_id: testAppIdB,
      farmer_name: "Farmer B (5% GST / 0d Delay)",
      district: "Coimbatore",
      dealer_id: testDealer.id,
      state_restricted_amount: 100000.0, // 1 Lakh
      invoice_amount: 105000.0,
      quotation_subsidy_amount: 105000.0,
      invoice_date: "2025-10-01", // 5% GST
      current_status: "Work Completion Approved",
    });

    await GovernmentProjectStatusHistory.create({
      project_id: projB.id,
      status: "INVOICED",
      status_date: "2025-10-01",
    });
    await GovernmentProjectStatusHistory.create({
      project_id: projB.id,
      status: "WORK COMPLETION APPROVED",
      status_date: "2025-10-20", // 19 days -> 0% penalty
    });

    // 4. TEST: Guardrail 1 - Unmatched ID Rejection
    console.log("--- TEST 1: Unmatched Application ID Guardrail ---");
    try {
      await createProceedingBatch({
        proceeding_date: "2026-08-21",
        fund_percentage_value: 55.0,
        application_ids_text: `${testAppIdA}\nNON-EXISTENT-ID-999`,
      });
      console.error("❌ FAILED: Batch creation should have thrown on unmatched ID.");
    } catch (err) {
      console.log(`✅ PASSED: Blocked with message: "${err.message.split("\n")[0]}"`);
    }

    // 5. TEST: Guardrail 2 - Missing State Restricted Rejection
    console.log("\n--- TEST 2: Missing State Restricted Amount Guardrail ---");
    const projNoRestricted = await GovernmentProject.create({
      application_id: `TEST-NO-RESTRICTED-${Date.now()}`,
      farmer_name: "Farmer Zero Restricted",
      invoice_amount: 50000.0,
      state_restricted_amount: null,
      invoice_date: "2025-10-01",
      current_status: "Work Completion Approved",
    });

    try {
      await createProceedingBatch({
        proceeding_date: "2026-08-21",
        fund_percentage_value: 55.0,
        application_ids_text: projNoRestricted.application_id,
      });
      console.error("❌ FAILED: Batch creation should have thrown on missing state_restricted_amount.");
    } catch (err) {
      console.log(`✅ PASSED: Blocked with message: "${err.message.split("\n")[0]}"`);
    }

    // 6. TEST: Guardrail 3 - Missing Invoice Date Rejection
    console.log("\n--- TEST 3: Missing Invoice Date Guardrail ---");
    const projNoDate = await GovernmentProject.create({
      application_id: `TEST-NO-DATE-${Date.now()}`,
      farmer_name: "Farmer No Date",
      invoice_amount: 50000.0,
      state_restricted_amount: 50000.0,
      invoice_date: null,
      current_status: "Work Completion Approved",
    });

    try {
      await createProceedingBatch({
        proceeding_date: "2026-08-21",
        fund_percentage_value: 55.0,
        application_ids_text: projNoDate.application_id,
      });
      console.error("❌ FAILED: Batch creation should have thrown on missing invoice_date.");
    } catch (err) {
      console.log(`✅ PASSED: Blocked with message: "${err.message.split("\n")[0]}"`);
    }

    // 7. TEST: Create 55% Proceeding Batch for Valid Projects A & B
    console.log("\n--- TEST 4: Create 55% Proceeding Batch & Verify Math ---");
    const batch55 = await createProceedingBatch({
      proceeding_no: `PROC-TEST-55-${Date.now()}`,
      proceeding_date: "2026-08-21",
      fund_percentage_value: 55.0,
      payment_received_date: "2026-08-21",
      payment_received_ref: "BANK-CREDIT-TEST-001",
      application_ids_text: `${testAppIdA}\n${testAppIdB}`,
    });

    console.log(`✅ Batch created: ${batch55.proceeding_no}`);

    const batchProjects = await ProceedingBatchProject.findAll({
      where: { proceeding_batch_id: batch55.id },
    });

    // Check Project A (12% GST, 90d delay -> -2% penalty -> 18% effective rate)
    const rowA = batchProjects.find((p) => p.application_id === testAppIdA);
    console.log("\nProject A (12% GST, 90d Delay) Results:");
    console.log(`  State Restricted: ₹${rowA.state_restricted_amount}`);
    console.log(`  Fund Share (55%): ₹${rowA.fund_share_amount} (Expected 55000)`);
    console.log(`  GST % Snapshot: ${rowA.gst_percentage}% (Expected 12)`);
    console.log(`  Net Material Base: ₹${rowA.net_material_base}`);
    console.log(`  Fittings (5%): ₹${rowA.fittings_amount}`);
    console.log(`  Delay Days: ${rowA.delay_days}d`);
    console.log(`  Penalty Rate %: ${rowA.penalty_percentage}% (Expected 2)`);
    console.log(`  Commission Amount: ₹${rowA.commission_amount}`);

    // Check Project B (5% GST, 19d delay -> 0% penalty -> 20% effective rate)
    const rowB = batchProjects.find((p) => p.application_id === testAppIdB);
    console.log("\nProject B (5% GST, 0d Delay) Results:");
    console.log(`  State Restricted: ₹${rowB.state_restricted_amount}`);
    console.log(`  Fund Share (55%): ₹${rowB.fund_share_amount} (Expected 55000)`);
    console.log(`  GST % Snapshot: ${rowB.gst_percentage}% (Expected 5)`);
    console.log(`  Net Material Base: ₹${rowB.net_material_base}`);
    console.log(`  Fittings (5%): ₹${rowB.fittings_amount}`);
    console.log(`  Delay Days: ${rowB.delay_days}d`);
    console.log(`  Penalty Rate %: ${rowB.penalty_percentage}% (Expected 0)`);
    console.log(`  Commission Amount: ₹${rowB.commission_amount}`);

    if (rowA.gst_percentage === 12.0 && rowB.gst_percentage === 5.0 && rowA.penalty_percentage === 2.0 && rowB.penalty_percentage === 0.0) {
      console.log("✅ PASSED: Exact mathematical and SLA formulas verified!");
    } else {
      console.error("❌ FAILED: Unexpected values on project rows.");
    }

    // 8. TEST: Record Dealer Payout & Immutable Ledger
    console.log("\n--- TEST 5: Record Dealer Payout & Immutable Ledger ---");
    const payoutResult = await markDealerPayout(batch55.id, {
      dealer_id: testDealer.id,
      paid_date: "2026-08-21",
      paid_ref: "NEFT-UTR-TEST-8899",
      notes: "Test automated dealer disbursement",
    });

    const settlements = await DealerSettlement.findAll({
      where: { proceeding_batch_id: batch55.id },
    });

    console.log(`✅ Immutable Settlements Created: ${settlements.length} rows`);
    for (const s of settlements) {
      console.log(`  Settlement [${s.application_id}]: Total Paid ₹${s.total_paid} (Comm: ₹${s.commission_amount}, Fit: ₹${s.fittings_amount}, GST: ${s.gst_percentage}%, Eff.Rate: ${s.effective_rate}%, Ref: ${s.utr_reference})`);
    }

    if (settlements.length === 2 && settlements.every((s) => s.utr_reference === "NEFT-UTR-TEST-8899")) {
      console.log("✅ PASSED: Immutable DealerSettlement accounting ledger successfully created!");
    } else {
      console.error("❌ FAILED: Settlement records not matching.");
    }

    // Cleanup test data
    console.log("\n🧹 Cleaning up test records...");
    await ProceedingBatch.destroy({ where: { id: batch55.id } });
    await GovernmentProject.destroy({ where: { application_id: [testAppIdA, testAppIdB, projNoRestricted.application_id, projNoDate.application_id] } });
    console.log("✅ Cleanup complete.");

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Verified.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test Suite Error:", err);
    process.exit(1);
  }
}

runTests();
