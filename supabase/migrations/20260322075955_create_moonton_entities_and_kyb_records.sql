/*
  # Create moonton_entities and moonton_kyb_records tables

  ## New Tables

  ### 1. `moonton_entities`
  Stores ArcoPay legal entity records (platform 主体).
  - `id` (text PK): e.g. 'me-1'
  - `name` (text): display name, e.g. 'ArcoPay HK'
  - `full_legal_name` (text): legal full name
  - `region` (text, nullable): one of 'CN_MAINLAND', 'HK', 'SG', 'OTHER'
  - `created_at` (date): creation date
  - `is_display_only` (boolean): if true, entity is virtual/display-only (e.g. Global)

  ### 2. `moonton_kyb_records`
  KYB (Know Your Business) records per moonton entity per channel.
  - `id` (text PK)
  - `moonton_entity_id` (text, FK → moonton_entities.id)
  - `channel_name` (text): channel identifier name
  - `status` (text): PENDING | APPROVED | REJECTED
  - `submitted_at` (date)
  - `reviewed_at` (date, nullable)
  - `notes` (text, nullable)

  ## Security
  - RLS enabled on both tables
  - Full anon SELECT/INSERT/UPDATE/DELETE policies (consistent with all other tables in this project)

  ## Seed Data
  - moonton_entities: 4 records from mock data (me-1 through me-4)
  - moonton_kyb_records: 5 records from mock data (mkyb-1 through mkyb-5)
*/

-- ─── MOONTON_ENTITIES ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moonton_entities (
  id               text PRIMARY KEY,
  name             text NOT NULL,
  full_legal_name  text NOT NULL,
  region           text CHECK (region IS NULL OR region = ANY (ARRAY['CN_MAINLAND','HK','SG','OTHER'])),
  created_at       date NOT NULL DEFAULT CURRENT_DATE,
  is_display_only  boolean NOT NULL DEFAULT false
);

ALTER TABLE moonton_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read moonton_entities"
  ON moonton_entities FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert moonton_entities"
  ON moonton_entities FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update moonton_entities"
  ON moonton_entities FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete moonton_entities"
  ON moonton_entities FOR DELETE TO anon USING (true);

INSERT INTO moonton_entities (id, name, full_legal_name, region, created_at, is_display_only) VALUES
  ('me-1', 'ArcoPay HK',  'ArcoPay Technology Limited',   'HK',          '2023-01-15', false),
  ('me-2', 'ArcoPay SG',  'ArcoPay Pte. Ltd.',             'SG',          '2023-03-22', false),
  ('me-3', '弧联科技',     '上海弧联科技有限公司',           'CN_MAINLAND', '2022-11-08', false),
  ('me-4', 'Global',       '—',                            NULL,          '2022-06-01', true)
ON CONFLICT (id) DO NOTHING;

-- ─── MOONTON_KYB_RECORDS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moonton_kyb_records (
  id                  text PRIMARY KEY,
  moonton_entity_id   text NOT NULL REFERENCES moonton_entities(id),
  channel_name        text NOT NULL,
  status              text NOT NULL DEFAULT 'PENDING'
                        CHECK (status = ANY (ARRAY['PENDING','APPROVED','REJECTED'])),
  submitted_at        date NOT NULL,
  reviewed_at         date,
  notes               text
);

ALTER TABLE moonton_kyb_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read moonton_kyb_records"
  ON moonton_kyb_records FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert moonton_kyb_records"
  ON moonton_kyb_records FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update moonton_kyb_records"
  ON moonton_kyb_records FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete moonton_kyb_records"
  ON moonton_kyb_records FOR DELETE TO anon USING (true);

INSERT INTO moonton_kyb_records (id, moonton_entity_id, channel_name, status, submitted_at, reviewed_at, notes) VALUES
  ('mkyb-1', 'me-1', 'paycools', 'APPROVED', '2023-01-20', '2023-02-01', NULL),
  ('mkyb-2', 'me-1', 'dreamo',   'APPROVED', '2023-02-10', '2023-02-20', NULL),
  ('mkyb-3', 'me-2', 'paycools', 'APPROVED', '2023-03-25', '2023-04-05', NULL),
  ('mkyb-4', 'me-2', 'smileone', 'PENDING',  '2023-05-15', NULL,         '等待渠道方回复'),
  ('mkyb-5', 'me-3', 'liandong', 'APPROVED', '2022-11-15', '2022-12-01', NULL)
ON CONFLICT (id) DO NOTHING;
