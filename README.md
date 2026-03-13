# ⚡ FlashMarket — Surplus Perishable Food Marketplace

Real-time marketplace for surplus perishable food with dynamic pricing, guest browsing, role-based access, and optional location-aware delivery.

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout + PWA metadata
│   ├── page.tsx            # Main marketplace for signed-in users
│   ├── guest/page.tsx      # Guest-access marketplace route
│   ├── auth/role/page.tsx  # Role selection + vendor coordinate setup
│   ├── deliveries/page.tsx # Nearby delivery map
│   └── vendor/page.tsx     # Vendor Dashboard
├── components/
│   ├── Navbar.tsx          # Sticky navigation bar
│   ├── ClientShell.tsx     # Client-side layout wrapper
│   ├── AuthRouteGate.tsx   # Guest/auth route gating
│   ├── VendorDashboard.tsx # Item upload form
│   ├── ItemCard.tsx        # Live-priced product card
│   ├── ClaimModal.tsx      # Claim flow with pickup/delivery
│   └── Marketplace.tsx     # Filterable grid of items
├── hooks/
│   ├── useGeolocation.ts   # Browser geolocation hook
│   ├── useProductImage.ts  # Product image hook
│   └── useRealTimePrice.ts # Real-time pricing hook (1s interval)
├── lib/
│   ├── pricing.ts          # Dynamic pricing engine
│   ├── delivery.ts         # Distance + delivery fee helpers
│   ├── types.ts            # TypeScript interfaces
│   ├── store.ts            # Frontend API client helpers
│   └── constants.ts        # Category labels/colors
supabase/
├── schema.sql              # Supabase-ready SQL schema
└── *.csv                   # Seed/import support files
public/
├── manifest.json           # PWA manifest
└── icons/                  # PWA icons (SVG)
```

## Dynamic Pricing Engine

```
CurrentPrice = BasePrice × (TimeRemaining / TotalWindow)
```

- **FloorPct** is configurable per item
- Price decays over the shelf-life window until the floor price is reached
- `useRealTimePrice` hook recalculates every second for live UI updates

## User Flow

- Logged-out visitors are redirected to `/guest`
- Guests can browse listings before signing in
- Google sign-in unlocks the main app
- Buyers can claim listings and access nearby deliveries
- Vendors register a base location using latitude/longitude and manage listings

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PEXELS_API_KEY=your_pexels_api_key
```

For production, set `NEXT_PUBLIC_SITE_URL` to your deployed domain.

## Key Features

- **Guest Marketplace** — Browse live items at `/guest` before signing in
- **Marketplace** — Browse items with live countdown timers and price decay
- **Vendor Dashboard** — Upload perishable items and track inventory
- **Vendor Base Coordinates** — Save vendor latitude/longitude with a live map preview
- **Claim Flow** — Buyers can claim items with pickup or delivery
- **Distance-based Delivery Fee** — Delivery fee uses `distance_km × 11`
- **Nearby Delivery Map** — Buyers can claim available delivery tasks around them
- **Category Filters** — Cooked Meals, Fresh Produce, Dairy, Baked Goods
- **Google Login + Roles** — Buyer and vendor role setup with Supabase Auth
- **PWA** — Installable on mobile with `manifest.json` + `next-pwa`
- **Supabase-Backed** — Postgres tables, Auth, and realtime-ready schema

## API Overview

- `GET /api/items` — fetch marketplace items
- `POST /api/items` — create vendor listing
- `POST /api/items/[itemId]/claim` — claim item with pickup/delivery
- `POST /api/users` — create/update user profile and vendor coordinates
- `GET /api/users/[userId]` — fetch profile with coordinates
- `GET /api/deliveries/nearby` — fetch available nearby deliveries

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
| Frontend | Next.js 16 (App Router) + Tailwind CSS + TypeScript |
| Backend | Next.js API routes + Supabase |
| Maps | maplibre-gl / react-map-gl + OpenStreetMap embed |
| Images | Pexels API |
| PWA | `next-pwa` + `manifest.json` |
| Language | TypeScript |
| Deployment | Netlify with `@netlify/plugin-nextjs` |

## Deployment Notes

- Netlify uses the Next.js runtime plugin via `netlify.toml`
- Supabase Auth should include both local and production callback URLs
- Production env should set `NEXT_PUBLIC_SITE_URL` to the live domain
