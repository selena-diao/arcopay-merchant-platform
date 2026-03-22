/*
  # Create junction tables and migrate array columns to relational rows

  ## Summary
  Replaces three string[] columns with proper junction tables, migrating all
  existing data before dropping the source columns. All steps run atomically —
  any failure rolls back the entire migration.

  ## New Tables

  1. `channel_payment_method_country`
     - `id` (uuid PK, gen_random_uuid)
     - `channel_payment_method_id` (text FK → channel_payment_methods.id)
     - `country_code` (varchar FK → countries.code)
     - Unique constraint on (channel_payment_method_id, country_code)

  2. `channel_payment_method_currency`
     - `id` (uuid PK, gen_random_uuid)
     - `channel_payment_method_id` (text FK → channel_payment_methods.id)
     - `currency_code` (varchar FK → currencies.code)
     - Unique constraint on (channel_payment_method_id, currency_code)

  3. `routing_rule_country`
     - `id` (uuid PK, gen_random_uuid)
     - `routing_rule_id` (text FK → routing_rules.id)
     - `country_code` (varchar FK → countries.code)
     - Unique constraint on (routing_rule_id, country_code)

  ## Data Migration
  1. Expand channel_payment_methods.supported_countries → channel_payment_method_country rows
  2. Expand channel_payment_methods.supported_currencies → channel_payment_method_currency rows
  3. Expand routing_rules.country → routing_rule_country rows
  4. Drop supported_countries, supported_currencies from channel_payment_methods
  5. Drop country from routing_rules

  ## Security
  - RLS enabled on all three junction tables
  - Full anon SELECT/INSERT/UPDATE/DELETE policies — matches all other tables
*/

DO $$
BEGIN

-- ─── channel_payment_method_country ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS channel_payment_method_country (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_payment_method_id  text NOT NULL
    REFERENCES channel_payment_methods(id) ON DELETE CASCADE,
  country_code               varchar(2) NOT NULL
    REFERENCES countries(code) ON DELETE RESTRICT,
  UNIQUE (channel_payment_method_id, country_code)
);

ALTER TABLE channel_payment_method_country ENABLE ROW LEVEL SECURITY;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_country'
  AND policyname = 'anon can read channel_payment_method_country'
) THEN
  CREATE POLICY "anon can read channel_payment_method_country"
    ON channel_payment_method_country FOR SELECT TO anon USING (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_country'
  AND policyname = 'anon can insert channel_payment_method_country'
) THEN
  CREATE POLICY "anon can insert channel_payment_method_country"
    ON channel_payment_method_country FOR INSERT TO anon WITH CHECK (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_country'
  AND policyname = 'anon can update channel_payment_method_country'
) THEN
  CREATE POLICY "anon can update channel_payment_method_country"
    ON channel_payment_method_country FOR UPDATE TO anon USING (true) WITH CHECK (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_country'
  AND policyname = 'anon can delete channel_payment_method_country'
) THEN
  CREATE POLICY "anon can delete channel_payment_method_country"
    ON channel_payment_method_country FOR DELETE TO anon USING (true);
END IF;

-- ─── channel_payment_method_currency ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS channel_payment_method_currency (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_payment_method_id  text NOT NULL
    REFERENCES channel_payment_methods(id) ON DELETE CASCADE,
  currency_code              varchar(3) NOT NULL
    REFERENCES currencies(code) ON DELETE RESTRICT,
  UNIQUE (channel_payment_method_id, currency_code)
);

ALTER TABLE channel_payment_method_currency ENABLE ROW LEVEL SECURITY;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_currency'
  AND policyname = 'anon can read channel_payment_method_currency'
) THEN
  CREATE POLICY "anon can read channel_payment_method_currency"
    ON channel_payment_method_currency FOR SELECT TO anon USING (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_currency'
  AND policyname = 'anon can insert channel_payment_method_currency'
) THEN
  CREATE POLICY "anon can insert channel_payment_method_currency"
    ON channel_payment_method_currency FOR INSERT TO anon WITH CHECK (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_currency'
  AND policyname = 'anon can update channel_payment_method_currency'
) THEN
  CREATE POLICY "anon can update channel_payment_method_currency"
    ON channel_payment_method_currency FOR UPDATE TO anon USING (true) WITH CHECK (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'channel_payment_method_currency'
  AND policyname = 'anon can delete channel_payment_method_currency'
) THEN
  CREATE POLICY "anon can delete channel_payment_method_currency"
    ON channel_payment_method_currency FOR DELETE TO anon USING (true);
END IF;

-- ─── routing_rule_country ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS routing_rule_country (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_rule_id  text NOT NULL
    REFERENCES routing_rules(id) ON DELETE CASCADE,
  country_code     varchar(2) NOT NULL
    REFERENCES countries(code) ON DELETE RESTRICT,
  UNIQUE (routing_rule_id, country_code)
);

ALTER TABLE routing_rule_country ENABLE ROW LEVEL SECURITY;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'routing_rule_country'
  AND policyname = 'anon can read routing_rule_country'
) THEN
  CREATE POLICY "anon can read routing_rule_country"
    ON routing_rule_country FOR SELECT TO anon USING (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'routing_rule_country'
  AND policyname = 'anon can insert routing_rule_country'
) THEN
  CREATE POLICY "anon can insert routing_rule_country"
    ON routing_rule_country FOR INSERT TO anon WITH CHECK (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'routing_rule_country'
  AND policyname = 'anon can update routing_rule_country'
) THEN
  CREATE POLICY "anon can update routing_rule_country"
    ON routing_rule_country FOR UPDATE TO anon USING (true) WITH CHECK (true);
END IF;

IF NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE tablename = 'routing_rule_country'
  AND policyname = 'anon can delete routing_rule_country'
) THEN
  CREATE POLICY "anon can delete routing_rule_country"
    ON routing_rule_country FOR DELETE TO anon USING (true);
END IF;

-- ─── MIGRATE DATA ──────────────────────────────────────────────────────────

-- 1. supported_countries → channel_payment_method_country
INSERT INTO channel_payment_method_country (channel_payment_method_id, country_code)
SELECT cpm.id, unnested.country_code
FROM channel_payment_methods cpm
CROSS JOIN LATERAL unnest(cpm.supported_countries) AS unnested(country_code)
WHERE array_length(cpm.supported_countries, 1) > 0
  AND EXISTS (SELECT 1 FROM countries c WHERE c.code = unnested.country_code)
ON CONFLICT (channel_payment_method_id, country_code) DO NOTHING;

-- 2. supported_currencies → channel_payment_method_currency
INSERT INTO channel_payment_method_currency (channel_payment_method_id, currency_code)
SELECT cpm.id, unnested.currency_code
FROM channel_payment_methods cpm
CROSS JOIN LATERAL unnest(cpm.supported_currencies) AS unnested(currency_code)
WHERE array_length(cpm.supported_currencies, 1) > 0
  AND EXISTS (SELECT 1 FROM currencies cur WHERE cur.code = unnested.currency_code)
ON CONFLICT (channel_payment_method_id, currency_code) DO NOTHING;

-- 3. routing_rules.country → routing_rule_country
INSERT INTO routing_rule_country (routing_rule_id, country_code)
SELECT rr.id, unnested.country_code
FROM routing_rules rr
CROSS JOIN LATERAL unnest(rr.country) AS unnested(country_code)
WHERE rr.country IS NOT NULL
  AND array_length(rr.country, 1) > 0
  AND EXISTS (SELECT 1 FROM countries c WHERE c.code = unnested.country_code)
ON CONFLICT (routing_rule_id, country_code) DO NOTHING;

-- ─── DROP OLD ARRAY COLUMNS ────────────────────────────────────────────────

-- 4. Drop supported_countries and supported_currencies from channel_payment_methods
ALTER TABLE channel_payment_methods DROP COLUMN IF EXISTS supported_countries;
ALTER TABLE channel_payment_methods DROP COLUMN IF EXISTS supported_currencies;

-- 5. Drop country from routing_rules
ALTER TABLE routing_rules DROP COLUMN IF EXISTS country;

END $$;
