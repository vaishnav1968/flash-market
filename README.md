# ⚡ FlashMarket — Surplus Perishable Food Marketplace

> Real-time marketplace for surplus perishable food with a **dynamic pricing engine**. Prices drop as expiry approaches — claim deals before they vanish!

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout + PWA metadata
│   ├── page.tsx            # Marketplace storefront (buyer view)
│   └── vendor/page.tsx     # Vendor Dashboard (upload items)
├── components/
│   ├── Navbar.tsx          # Sticky navigation bar
│   ├── ClientShell.tsx     # Client-side layout wrapper
│   ├── VendorDashboard.tsx # Item upload form
│   ├── ItemCard.tsx        # Live-priced product card
│   ├── ClaimModal.tsx      # Claim & Pay-at-Shop flow
│   └── Marketplace.tsx     # Filterable grid of items
├── hooks/
│   └── useRealTimePrice.ts # Real-time pricing hook (1s interval)
├── lib/
│   ├── pricing.ts          # Dynamic pricing engine
│   ├── types.ts            # TypeScript interfaces
│   ├── store.ts            # In-memory mock store
│   └── constants.ts        # Category labels/colors
├── data/
│   └── perishable-items.json # 20 curated perishable items
supabase/
└── schema.sql              # Supabase-ready SQL schema
public/
├── manifest.json           # PWA manifest
└── icons/                  # PWA icons (SVG)
```

## Dynamic Pricing Engine

```
CurrentPrice = BasePrice × (TimeRemaining / TotalWindow)
```

- **FloorPct** = 0.40 (40%) — vendors always cover basic costs
- Price decays linearly from 100% → 40% over the shelf-life window
- `useRealTimePrice` hook recalculates every second for live UI updates

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key Features

- **Marketplace** — Browse items with live countdown timers and price decay
- **Vendor Dashboard** — Upload perishable items with category, shelf-life, pricing
- **Claim & Pay at Shop** — No Stripe; buyers claim items and pay vendors in person
- **Category Filters** — Cooked Meals, Fresh Produce, Dairy, Baked Goods
- **PWA** — Installable on mobile with `manifest.json` + `next-pwa`
- **Supabase-Ready** — Full SQL schema with RLS, triggers, and realtime support

## Data Source

20 perishable street food items filtered from the [Fully Cleaned Street Food Dataset](https://www.kaggle.com/datasets/olearoy/fully-cleaned-street-food-dataset) on Kaggle. Non-perishables (canned drinks, packaged snacks) were discarded. Items are categorized as:

| Category | Examples |
|----------|----------|
| `cooked_meal` | Shawarma, Pad Thai, Tacos |
| `fresh_produce` | Fruit Salad, Grilled Corn, Coconut Water |
| `dairy` | Greek Yogurt, Mozzarella Salad, Mango Lassi |
| `baked_goods` | Churros, Banana Bread, Sourdough Rolls |

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Backend | Supabase (SQL schema + Realtime ready) |
| PWA | `next-pwa` + `manifest.json` |
| Language | TypeScript |
