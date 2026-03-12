/* ── FlashMarket — Supabase-Ready SQL Schema ── */

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ╔══════════════════════════════════════════════════════╗
-- ║  USERS (vendors & buyers share the same table)      ║
-- ╚══════════════════════════════════════════════════════╝
CREATE TABLE public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'buyer'
                  CHECK (role IN ('vendor', 'buyer')),
  phone         TEXT,
  shop_name     TEXT,             -- only for vendors
  shop_address  TEXT,             -- only for vendors
  telegram_chat_id TEXT,          -- optional: Telegram chat ID for claim notifications
  credits       NUMERIC(12,2) NOT NULL DEFAULT 0,  -- delivery credits earned
  latitude      NUMERIC(10,8),    -- geolocation for nearby deliveries
  longitude     NUMERIC(11,8),    -- geolocation for nearby deliveries
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row-level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ╔══════════════════════════════════════════════════════╗
-- ║  ITEMS (perishable listings posted by vendors)      ║
-- ╚══════════════════════════════════════════════════════╝
CREATE TABLE public.items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL
                    CHECK (category IN (
                      'cooked_meal','fresh_produce','dairy','baked_goods'
                    )),
  base_price      NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  unit            TEXT NOT NULL DEFAULT 'piece',
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  image_url       TEXT,
  tags            TEXT[] DEFAULT '{}',

  -- Dynamic-pricing fields
  shelf_life_hours  NUMERIC(5,1) NOT NULL CHECK (shelf_life_hours > 0),
  listed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,        -- listed_at + shelf_life_hours
  price_floor_pct   NUMERIC(3,2) NOT NULL DEFAULT 0.20,  -- 20 %

  -- Claim flow
  status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available','claimed','sold','expired')),
  claimed_by      UUID REFERENCES public.users(id),
  claimed_at      TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_items_vendor   ON public.items(vendor_id);
CREATE INDEX idx_items_status   ON public.items(status);
CREATE INDEX idx_items_expires  ON public.items(expires_at);
CREATE INDEX idx_items_category ON public.items(category);

-- RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available items"
  ON public.items FOR SELECT
  USING (status = 'available');

CREATE POLICY "Vendors can insert their own items"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own items"
  ON public.items FOR UPDATE
  USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can delete their own items"
  ON public.items FOR DELETE
  USING (auth.uid() = vendor_id);

-- ╔══════════════════════════════════════════════════════╗
-- ║  CLAIMS (Claim-and-Pay-at-Shop flow)                ║
-- ╚══════════════════════════════════════════════════════╝
CREATE TABLE public.claims (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  buyer_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claimed_price NUMERIC(10,2) NOT NULL,
  platform_fee  NUMERIC(10,2) NOT NULL DEFAULT 0,  -- 3.5% of claimed_price
  vendor_payout NUMERIC(10,2) NOT NULL DEFAULT 0,  -- claimed_price - platform_fee
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','cancelled')),
  claimed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own claims"
  ON public.claims FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Vendors can view claims on their items"
  ON public.claims FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Buyers can create claims"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- ╔══════════════════════════════════════════════════════╗
-- ║  DELIVERIES (P2P Delivery System)                   ║
-- ╚══════════════════════════════════════════════════════╝
CREATE TABLE public.deliveries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id      UUID NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  deliverer_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  credit_reward NUMERIC(12,2) NOT NULL,  -- credits awarded on completion
  status        TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available','picked_up','completed','cancelled')),
  pickup_lat    NUMERIC(10,8),    -- vendor location
  pickup_lon    NUMERIC(11,8),
  dropoff_lat   NUMERIC(10,8),    -- buyer location
  dropoff_lon   NUMERIC(11,8),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  picked_up_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_deliveries_deliverer ON public.deliveries(deliverer_id);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available deliveries"
  ON public.deliveries FOR SELECT
  USING (status = 'available');

CREATE POLICY "Deliverers can view their own deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = deliverer_id);

CREATE POLICY "Vendors can view deliveries for their items"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = vendor_id);

CREATE POLICY "Users can claim available deliveries"
  ON public.deliveries FOR UPDATE
  USING (status = 'available');

-- ╔══════════════════════════════════════════════════════╗
-- ║  FUNCTION: transfer credits on delivery completion  ║
-- ╚══════════════════════════════════════════════════════╝
CREATE OR REPLACE FUNCTION process_delivery_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Transfer credit_reward to deliverer's credits balance
    UPDATE public.users
    SET credits = credits + NEW.credit_reward
    WHERE id = NEW.deliverer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_delivery_completion
  AFTER UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION process_delivery_completion();


CREATE OR REPLACE FUNCTION set_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.listed_at + (NEW.shelf_life_hours || ' hours')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_expires_at
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION set_expires_at();

-- ╔══════════════════════════════════════════════════════╗
-- ║  FUNCTION: auto-expire items past their window      ║
-- ╚══════════════════════════════════════════════════════╝
-- Call via Supabase cron (pg_cron) every minute
CREATE OR REPLACE FUNCTION expire_stale_items()
RETURNS void AS $$
BEGIN
  UPDATE public.items
  SET status = 'expired', updated_at = now()
  WHERE status = 'available' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Enable Supabase Realtime on items, claims, and deliveries tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
