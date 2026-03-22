/*
  # Create Merchant Module Tables

  ## Summary
  Creates four tables for the 商家管理 (merchant management) module, replacing
  in-memory mock data with persistent Supabase-backed storage.

  ## New Tables

  ### merchants
  - `id` (text, primary key) — text ID matching existing mock pattern (m-*)
  - `name` (text) — merchant display name
  - `category` (text, nullable) — optional business category
  - `created_at` (date) — creation date

  ### merchant_entities
  - `id` (text, primary key)
  - `merchant_id` (text) — FK → merchants.id
  - `name` (text) — entity display name
  - `full_legal_name` (text) — registered legal name
  - `region` (text) — FK → countries.code
  - `created_at` (date)

  ### applications
  - `id` (text, primary key)
  - `merchant_id` (text) — FK → merchants.id
  - `name` (text) — application/shop name
  - `bundle_id` (text) — domain or bundle identifier
  - `status` (text) — 'ACTIVE' | 'INACTIVE'
  - `created_at` (date)

  ### merchant_kyb_records
  - `id` (text, primary key)
  - `merchant_entity_id` (text) — FK → merchant_entities.id
  - `channel_name` (text)
  - `status` (text) — 'PENDING' | 'APPROVED' | 'REJECTED'
  - `submitted_at` (date)
  - `reviewed_at` (date, nullable)
  - `notes` (text, nullable)

  ## Security
  - RLS enabled on all four tables
  - Anon key has full read/write access (internal admin tool, no end-user auth)
*/

-- merchants
CREATE TABLE IF NOT EXISTS merchants (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text,
  created_at date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access on merchants"
  ON merchants FOR SELECT TO anon USING (true);

CREATE POLICY "anon insert on merchants"
  ON merchants FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon update on merchants"
  ON merchants FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon delete on merchants"
  ON merchants FOR DELETE TO anon USING (true);

-- merchant_entities
CREATE TABLE IF NOT EXISTS merchant_entities (
  id text PRIMARY KEY,
  merchant_id text NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  full_legal_name text NOT NULL,
  region text REFERENCES countries(code) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE merchant_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access on merchant_entities"
  ON merchant_entities FOR SELECT TO anon USING (true);

CREATE POLICY "anon insert on merchant_entities"
  ON merchant_entities FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon update on merchant_entities"
  ON merchant_entities FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon delete on merchant_entities"
  ON merchant_entities FOR DELETE TO anon USING (true);

-- applications
CREATE TABLE IF NOT EXISTS applications (
  id text PRIMARY KEY,
  merchant_id text NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name text NOT NULL,
  bundle_id text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access on applications"
  ON applications FOR SELECT TO anon USING (true);

CREATE POLICY "anon insert on applications"
  ON applications FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon update on applications"
  ON applications FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon delete on applications"
  ON applications FOR DELETE TO anon USING (true);

-- merchant_kyb_records
CREATE TABLE IF NOT EXISTS merchant_kyb_records (
  id text PRIMARY KEY,
  merchant_entity_id text NOT NULL REFERENCES merchant_entities(id) ON DELETE CASCADE,
  channel_name text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  submitted_at date NOT NULL,
  reviewed_at date,
  notes text
);

ALTER TABLE merchant_kyb_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access on merchant_kyb_records"
  ON merchant_kyb_records FOR SELECT TO anon USING (true);

CREATE POLICY "anon insert on merchant_kyb_records"
  ON merchant_kyb_records FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon update on merchant_kyb_records"
  ON merchant_kyb_records FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon delete on merchant_kyb_records"
  ON merchant_kyb_records FOR DELETE TO anon USING (true);
