import db from "../config/db.js";

async function checkIndexes() {
  try {
    const [results] = await db.query(
      "SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;"
    );
    console.log(`Found ${results.length} indexes in database:`);
    for (const r of results) {
      console.log(`- [${r.tablename}] ${r.indexname}`);
    }
  } catch (err) {
    console.error("Index check failed:", err.message);
  } finally {
    process.exit(0);
  }
}

checkIndexes();
