/*
  # Create reference tables and platform base tables

  ## New Tables

  ### Reference Tables
  1. `countries` — ISO 3166-1 alpha-2 country reference
     - `code` (varchar PK): ISO alpha-2 code (e.g. 'CN', 'PH')
     - `name` (text): human-readable country name

  2. `currencies` — ISO 4217 currency reference
     - `code` (varchar PK): ISO 4217 code (e.g. 'USD', 'HKD')
     - `name` (text): human-readable currency name

  ### Platform Tables
  3. `channel_payment_methods` — maps a channel to a payment method it supports
     - `id` (text PK)
     - `channel_id` (text): references channel by ID
     - `payment_method_id` (text): references payment method by ID

  4. `routing_rules` — routing configuration per payment method / channel
     - `id` (text PK)
     - `payment_method_id` (text)
     - `channel_id` (text)
     - `priority` (integer)
     - `weight` (integer)
     - `status` (text): ACTIVE | INACTIVE

  ## Security
  - RLS enabled on all four tables
  - Full anon SELECT/INSERT/UPDATE/DELETE policies — matches pattern used by
    channel_contracts, merchant_contracts, onboardings, and all other working tables

  ## Seed Data
  - Countries: all codes referenced in mock data (CN, HK, SG, PH, MY, TH, ID, TW)
  - Currencies: all codes referenced in mock data (USD, HKD, SGD, PHP)
  - channel_payment_methods: seeded from mockChannelPaymentMethods
  - routing_rules: seeded from mockRoutingRules
*/

-- ─── COUNTRIES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS countries (
  code  varchar(2) PRIMARY KEY,
  name  text NOT NULL DEFAULT ''
);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read countries"
  ON countries FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert countries"
  ON countries FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update countries"
  ON countries FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete countries"
  ON countries FOR DELETE TO anon USING (true);

INSERT INTO countries (code, name) VALUES
  ('CN', 'China'),
  ('HK', 'Hong Kong'),
  ('SG', 'Singapore'),
  ('PH', 'Philippines'),
  ('MY', 'Malaysia'),
  ('TH', 'Thailand'),
  ('ID', 'Indonesia'),
  ('TW', 'Taiwan')
ON CONFLICT (code) DO NOTHING;

-- ─── CURRENCIES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS currencies (
  code  varchar(3) PRIMARY KEY,
  name  text NOT NULL DEFAULT ''
);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read currencies"
  ON currencies FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert currencies"
  ON currencies FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update currencies"
  ON currencies FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete currencies"
  ON currencies FOR DELETE TO anon USING (true);

INSERT INTO currencies (code, name) VALUES
  ('USD', 'US Dollar'),
  ('HKD', 'Hong Kong Dollar'),
  ('SGD', 'Singapore Dollar'),
  ('PHP', 'Philippine Peso')
ON CONFLICT (code) DO NOTHING;

-- ─── CHANNEL_PAYMENT_METHODS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS channel_payment_methods (
  id                 text PRIMARY KEY,
  channel_id         text NOT NULL,
  payment_method_id  text NOT NULL,
  supported_countries text[] NOT NULL DEFAULT '{}',
  supported_currencies text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE channel_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read channel_payment_methods"
  ON channel_payment_methods FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert channel_payment_methods"
  ON channel_payment_methods FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update channel_payment_methods"
  ON channel_payment_methods FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete channel_payment_methods"
  ON channel_payment_methods FOR DELETE TO anon USING (true);

INSERT INTO channel_payment_methods (id, channel_id, payment_method_id, supported_countries, supported_currencies) VALUES
  ('cpm-1', 'ch-2', 'pm-3', ARRAY['PH','MY','TH','ID'], ARRAY[]::text[]),
  ('cpm-2', 'ch-2', 'pm-4', ARRAY['PH','MY'],           ARRAY[]::text[]),
  ('cpm-3', 'ch-3', 'pm-3', ARRAY['PH','MY','SG'],      ARRAY[]::text[]),
  ('cpm-4', 'ch-1', 'pm-1', ARRAY['CN','HK','SG'],      ARRAY[]::text[]),
  ('cpm-5', 'ch-1', 'pm-4', ARRAY['CN','HK','TW','SG'], ARRAY[]::text[]),
  ('cpm-6', 'ch-4', 'pm-1', ARRAY['CN'],                ARRAY[]::text[])
ON CONFLICT (id) DO NOTHING;

-- ─── ROUTING_RULES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS routing_rules (
  id                 text PRIMARY KEY,
  payment_method_id  text NOT NULL,
  channel_id         text NOT NULL,
  priority           integer NOT NULL DEFAULT 1,
  weight             integer NOT NULL DEFAULT 100,
  status             text NOT NULL DEFAULT 'ACTIVE'
                       CHECK (status = ANY (ARRAY['ACTIVE','INACTIVE'])),
  country            text[]
);

ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read routing_rules"
  ON routing_rules FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert routing_rules"
  ON routing_rules FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update routing_rules"
  ON routing_rules FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete routing_rules"
  ON routing_rules FOR DELETE TO anon USING (true);

INSERT INTO routing_rules (id, payment_method_id, channel_id, priority, weight, status, country) VALUES
  ('rr-1', 'pm-3', 'ch-2', 1, 60,  'ACTIVE', ARRAY['PH','MY','TH','ID']),
  ('rr-2', 'pm-3', 'ch-3', 1, 40,  'ACTIVE', ARRAY['PH','MY','SG']),
  ('rr-3', 'pm-3', 'ch-4', 2, 100, 'ACTIVE', NULL),
  ('rr-4', 'pm-1', 'ch-1', 1, 100, 'ACTIVE', NULL),
  ('rr-5', 'pm-4', 'ch-1', 1, 60,  'ACTIVE', NULL),
  ('rr-6', 'pm-4', 'ch-2', 1, 40,  'ACTIVE', ARRAY['PH','MY'])
ON CONFLICT (id) DO NOTHING;
