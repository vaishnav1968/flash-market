// Quick script to update Supabase items to INR prices
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://ifhkuzqbangwspiobxoz.supabase.co",
  "sb_secret_Y8RY38q06102NwGNIFF7EQ_WdxxJAdt"
);

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
