import db from "../config/db.js";
import "../models/initModels.js";
import Dealer from "../modules/dealers/dealer.model.js";
import DealerCommissionSlab from "../modules/dealers/dealer-commission-slab.model.js";

/**
 * Production Seeder Script: Dealer Date-Based Commission Policy
 * 
 * Specifically configured for Cheran Horticulture:
 * - Projects invoiced BEFORE 2026-06-01:
 *     Preserves historical rates (18.00%, 19.00%, 20.00%) as per dealer master.
 * - Projects invoiced FROM 2026-06-01 onwards:
 *     Applies the government revised 15.00% rate.
 * 
 * Usage in production (safe, idempotent, run ONCE):
 *   cd backend
 *   npm run seed:slabs
 */

// Historical rate mapping by Dealer ID (Prior to June 1, 2026)
const HISTORICAL_DEALER_RATES_BY_ID = {
  "059b7da3-2c7b-4353-b3eb-4f859e2fc29a": 20.00, // AJITH AGGRO
  "8b228bd0-cd75-4bcf-add0-3ff6df2f2d88": 20.00, // AJITH AGRO
  "42f47d66-48eb-4735-b5af-2e11d1f69448": 18.00, // AK IRRIGATION
  "1173fe69-2d97-41e5-9ba1-a4bf527aaedc": 20.00, // AN agro
  "e5b7bc50-0639-47fd-b659-d7d89b939e40": 19.00, // ARAVINDHAN AGENCY
  "f8b28cc1-a4db-43aa-839d-f52eb7b84c1c": 19.00, // AS TRADERS
  "2c45ae73-3a70-47e7-82ad-385aebd33346": 20.00, // Ajithkumar
  "35c27d70-ab36-4b6c-a02c-ea40e5cd6908": 20.00, // CHERRAN
  "f3540bca-4d4f-4378-808d-071769e80176": 19.00, // DEVA ENTERPRISES
  "2c663f51-b062-476c-8ab4-ca8edb8c3ee7": 20.00, // DIYA
  "13ca2c14-8d04-413f-934b-dc16770e0080": 20.00, // DIYAA
  "e78a82bf-d64c-4333-88a3-3e29ef0f4c81": 19.00, // DURAI IRRIGATION
  "22ca44de-1df4-4043-973d-af9071f75e08": 19.00, // GK DRIP IRRIGATION
  "956c26cd-e451-4244-b9cd-6364c6727271": 19.00, // GK TRADERS
  "7a4a1fe5-c851-40b5-95ce-f77f78521110": 20.00, // GREEN LAND ENTERPRISES
  "fcd462bd-7eae-438b-ab4c-734d3260e4da": 20.00, // GREENLAND IRRIGATION
  "ee46fb1b-fd21-4424-8797-31296c85a76d": 20.00, // H BROTHERS
  "97909754-9ff4-4458-8aff-077e3c6d47ad": 20.00, // H&H BROTHER'S
  "7aa98b96-cdae-45bd-8743-513844885dfe": 20.00, // HARI ENTERPRISES
  "de1aed61-ae91-4a34-b1e6-e0d4046640bc": 19.00, // JAYALAKSHMI TRADERS
  "df2a0fe5-d5b6-4643-bbfe-a0f45d6f69bf": 19.00, // JOTHI & CO
  "a93a9aaf-f4aa-47e8-a1ad-db66ead62505": 19.00, // KAMARAJAR IRRIGATION
  "81384b9c-ce2c-4c71-af70-3d8e0093dd4f": 19.00, // KAMARAJDRIPS
  "ecec1806-33e4-4cd1-8540-abfd9f7fc603": 19.00, // KARTHICK DRIP
  "d19f34bb-8155-43ff-b73e-711c84fb45da": 18.00, // KEERTHE AGRO SERVICE
  "1c66b2ba-bd61-4d0f-bf05-66a47b4e1cc2": 19.00, // KESAVAN
  "952bf94e-a2b2-4a0b-93a2-23ada6b89f71": 19.00, // KPR TRADERS
  "77a54c77-482b-437e-8b40-e31dad325b2f": 19.00, // KSAVAN S
  "28793a23-bf8f-4ea3-abae-5aa3e1a4bceb": 19.00, // Kesavan S
  "5e646eed-3535-4316-b3c9-5e1f39b85540": 19.00, // NATURAL AGENCY
  "a86524ae-6ce0-4d0a-9a40-0f9e08f9e134": 19.00, // PALANI IRRIGATION
  "a7185f30-507f-49ba-9754-e05fb6a3820e": 19.00, // RAGU IRRIGATION
  "9fe0fb25-6055-45e0-a946-414f72e13181": 19.00, // RV IRRIGATION
  "d9bd930d-a874-4a97-bd9d-c0b465bd84bc": 19.00, // SIVASAKTHI TRADERS
  "604ad2d4-6d5e-44f6-b6ac-124b627f13b7": 19.00, // SMK ENTERPRISES
  "6e04f85f-34e1-47c8-bdda-a15ffe329dd2": 19.00, // SPM ENTERPRISES
  "3801eee3-06ff-4136-ae6f-efa610cf1bbf": 19.00, // SPS & CO
  "64ffa34d-0b56-4ce8-9205-47d42cc0a930": 19.00, // SRI HARI AGRO TECH
  "fdd1ebc5-c894-4589-9603-6c56e2c7e7e1": 19.00, // SRI HARI AGROTECH
  "f6472be2-3117-4642-b50c-4de7454d9c45": 19.00, // SS TRADERS
  "d5205c14-f588-4cca-a92d-66801298a099": 19.00, // SUJATHA TRADERS
  "be8ba38e-e1e6-4f91-86b4-a9b60153a718": 20.00, // THE ORIGIN AGRICULTURE
  "f6a0f5c6-9195-4ab5-8f2c-8bb7f3f05c3a": 20.00, // UZHAVAN DRIP IRRIGATION
  "fa603826-f8ea-4d48-9f19-c268afdd77b7": 20.00, // V K TRADERS
  "13cf70c6-12ba-4efe-8729-ebeb071d5df6": 19.00, // VIT ENTERPRISES
  "3bfa987b-fc29-4718-8526-9ca7ac132240": 20.00, // VMK UZHAVAN
  "f0e301b7-85bf-4170-965c-a71c48185509": 20.00, // VMK UZHAVAN AGRI
  "17cdc437-eebc-40a7-9f67-36d7ca394ed3": 19.00, // VPG ENTERPRISES
  "d315a417-245a-4b3a-bb0e-a9763119640f": 20.00, // VTR
  "e949601d-0085-4622-94cf-c23c27df79ac": 20.00, // VTR DRIP IRRIGATION
  "581cf0d4-73d9-4c97-8db9-f65064e2a6ca": 20.00, // VTR IRRIGATION
};

// Historical rate mapping by Normalized Dealer Name (Prior to June 1, 2026)
const HISTORICAL_DEALER_RATES_BY_NAME = {
  "ajith aggro": 20.00,
  "ajith agro": 20.00,
  "ak irrigation": 18.00,
  "an agro": 20.00,
  "aravindhan agency": 19.00,
  "as traders": 19.00,
  "ajithkumar": 20.00,
  "cherran": 20.00,
  "deva enterprises": 19.00,
  "diya": 20.00,
  "diyaa": 20.00,
  "durai irrigation": 19.00,
  "gk drip irrigation": 19.00,
  "gk traders": 19.00,
  "green land enterprises": 20.00,
  "greenland irrigation": 20.00,
  "h brothers": 20.00,
  "h&h brothers": 20.00,
  "h&h brother's": 20.00,
  "hari enterprises": 20.00,
  "jayalakshmi traders": 19.00,
  "jothi & co": 19.00,
  "kamarajar irrigation": 19.00,
  "kamarajdrips": 19.00,
  "karthick drip": 19.00,
  "keerthe agro service": 18.00,
  "kesavan": 19.00,
  "kpr traders": 19.00,
  "ksavan s": 19.00,
  "kesavan s": 19.00,
  "natural agency": 19.00,
  "palani irrigation": 19.00,
  "ragu irrigation": 19.00,
  "rv irrigation": 19.00,
  "sivasakthi traders": 19.00,
  "smk enterprises": 19.00,
  "spm enterprises": 19.00,
  "sps & co": 19.00,
  "sri hari agro tech": 19.00,
  "sri hari agrotech": 19.00,
  "ss traders": 19.00,
  "sujatha traders": 19.00,
  "the origin agriculture": 20.00,
  "uzhavan drip irrigation": 20.00,
  "v k traders": 20.00,
  "vit enterprises": 19.00,
  "vmk uzhavan": 20.00,
  "vmk uzhavan agri": 20.00,
  "vpg enterprises": 19.00,
  "vtr": 20.00,
  "vtr drip irrigation": 20.00,
  "vtr irrigation": 20.00,
};

async function run() {
  const effectiveFrom = process.argv[2] || "2026-06-01";
  const newRate = parseFloat(process.argv[3] || "15.0");

  console.log("================================================================================");
  console.log("🚀 CHERAN HORTICULTURE - DEALER DATE-BASED COMMISSION SEEDER");
  console.log("================================================================================");
  console.log(`📅 Cutoff Effective Date : ${effectiveFrom}`);
  console.log(`📊 Prior Period (Before ${effectiveFrom}) : Historical Rates (18%, 19%, 20%)`);
  console.log(`📊 New Period   (From ${effectiveFrom} onwards) : ${newRate}%`);
  console.log("================================================================================\n");

  const fromDateObj = new Date(effectiveFrom);
  fromDateObj.setDate(fromDateObj.getDate() - 1);
  const dayBefore = fromDateObj.toISOString().split("T")[0];

  try {
    await db.authenticate();
    console.log("✅ Database connection verified.");

    // Ensure dealer_commission_slabs table exists in production
    await DealerCommissionSlab.sync();
    console.log("✅ Dealer commission slabs table ready.");

    const dealers = await Dealer.findAll({
      include: [{ model: DealerCommissionSlab, as: "commission_slabs" }],
      order: [["name", "ASC"]],
    });

    console.log(`\n📋 Found ${dealers.length} dealers in database to configure...\n`);

    const summary = [];

    await db.transaction(async (t) => {
      for (const dealer of dealers) {
        const existingSlabs = dealer.commission_slabs || [];
        const normName = (dealer.normalized_name || dealer.name || "").trim().toLowerCase();
        
        // 1. Resolve prior historical rate: Check exact mapped ID first, then name map, then dealer record
        let priorRate =
          HISTORICAL_DEALER_RATES_BY_ID[dealer.id] ??
          HISTORICAL_DEALER_RATES_BY_NAME[normName];

        if (priorRate === undefined) {
          const existingPriorSlab = existingSlabs.find((s) => s.effective_from < effectiveFrom);
          if (existingPriorSlab) {
            priorRate = parseFloat(existingPriorSlab.commission_percentage);
          } else if (dealer.commission_percentage !== null && dealer.commission_percentage !== undefined) {
            priorRate = parseFloat(dealer.commission_percentage);
          } else {
            priorRate = 20.00;
          }
        }

        // 2. Cap or update any existing slab starting before effectiveFrom
        let historicalSlabCreatedOrUpdated = false;
        for (const slab of existingSlabs) {
          if (slab.effective_from < effectiveFrom) {
            await slab.update(
              {
                effective_to: dayBefore,
                commission_percentage: priorRate,
              },
              { transaction: t }
            );
            historicalSlabCreatedOrUpdated = true;
          }
        }

        // If no prior slab existed, create one
        if (!historicalSlabCreatedOrUpdated) {
          await DealerCommissionSlab.create(
            {
              dealer_id: dealer.id,
              effective_from: "2000-01-01",
              effective_to: dayBefore,
              commission_percentage: priorRate,
            },
            { transaction: t }
          );
        }

        // 3. Upsert ongoing slab starting at effectiveFrom (2026-06-01 -> ongoing at 15.00%)
        const existingNewSlab = existingSlabs.find((s) => s.effective_from === effectiveFrom);
        if (existingNewSlab) {
          await existingNewSlab.update(
            {
              effective_to: null,
              commission_percentage: newRate,
            },
            { transaction: t }
          );
        } else {
          await DealerCommissionSlab.create(
            {
              dealer_id: dealer.id,
              effective_from: effectiveFrom,
              effective_to: null,
              commission_percentage: newRate,
            },
            { transaction: t }
          );
        }

        // 4. Update dealer's base rate column to new active rate (15.00%)
        await dealer.update({ commission_percentage: newRate }, { transaction: t });

        summary.push({
          Dealer: dealer.name,
          "Prior Rate (< 2026-06-01)": `${priorRate.toFixed(2)}%`,
          "New Rate (>= 2026-06-01)": `${newRate.toFixed(2)}%`,
          Status: dealer.is_active ? "ACTIVE" : "INACTIVE",
        });
      }
    });

    console.table(summary);

    console.log("\n================================================================================");
    console.log(`🎉 SUCCESS: Configured date-based slabs for all ${dealers.length} dealers!`);
    console.log(`   • Invoices < ${effectiveFrom} : strictly resolved with their 20% / 19% / 18% rates.`);
    console.log(`   • Invoices >= ${effectiveFrom} : strictly resolved with ${newRate}%.`);
    console.log("================================================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error while applying dealer commission slabs:", error);
    process.exit(1);
  }
}

run();
