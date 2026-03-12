// Quick script to update Supabase items to INR prices
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (preferred), or fallback Supabase env vars"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

const priceUpdates = [
  { id: "d0000001-0000-4000-a000-000000000001", base_price: 180 },
  { id: "d0000001-0000-4000-a000-000000000002", base_price: 120 },
  { id: "d0000001-0000-4000-a000-000000000003", base_price: 150 },
  { id: "d0000001-0000-4000-a000-000000000004", base_price: 140 },
  { id: "d0000001-0000-4000-a000-000000000005", base_price: 80 },
  { id: "d0000001-0000-4000-a000-000000000006", base_price: 200 },
  { id: "d0000001-0000-4000-a000-000000000007", base_price: 130 },
  { id: "d0000001-0000-4000-a000-000000000008", base_price: 100 },
  { id: "d0000001-0000-4000-a000-000000000009", base_price: 150 },
  { id: "d0000001-0000-4000-a000-000000000010", base_price: 160 },
  { id: "d0000001-0000-4000-a000-000000000011", base_price: 140 },
  { id: "d0000001-0000-4000-a000-000000000012", base_price: 70 },
  { id: "d0000001-0000-4000-a000-000000000013", base_price: 60 },
  { id: "d0000001-0000-4000-a000-000000000014", base_price: 150 },
  { id: "d0000001-0000-4000-a000-000000000015", base_price: 220 },
  { id: "d0000001-0000-4000-a000-000000000016", base_price: 60 },
  { id: "d0000001-0000-4000-a000-000000000017", base_price: 120 },
  { id: "d0000001-0000-4000-a000-000000000018", base_price: 180 },
  { id: "d0000001-0000-4000-a000-000000000019", base_price: 90 },
  { id: "d0000001-0000-4000-a000-000000000020", base_price: 80 },
];

async function updatePrices() {
  let success = 0;
  let failed = 0;

  for (const item of priceUpdates) {
    const { error } = await supabase
      .from("items")
      .update({ base_price: item.base_price })
      .eq("id", item.id);

    if (error) {
      console.error(`FAIL ${item.id}: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\nDone: ${success} updated, ${failed} failed out of ${priceUpdates.length}`);
}

updatePrices();
