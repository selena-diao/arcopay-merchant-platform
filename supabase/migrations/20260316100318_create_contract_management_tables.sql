/*
  # Contract Management Schema

  ## Overview
  Creates all tables needed to persist contract management data, replacing in-memory mock state.

  ## New Tables

  ### channel_contracts
  - `id` (text, primary key) — matches mock IDs (cc-*)
  - `moonton_entity_id` (text) — references moonton entity
  - `channel_id` (text) — references channel
  - `merchant_mode` (text) — 'MOR' | 'SOR'
  - `channel_rate` (numeric) — fee rate as decimal (0.028 = 2.8%)
  - `settlement_cycle` (int) — days
  - `status` (text) — 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'VOIDED'
  - `signed_at` (date)
  - `termination_reason` (text, nullable)
  - `void_reason` (text, nullable)
  - `created_at` (timestamptz)

  ### merchant_contracts
  - `id` (text, primary key)
  - `moonton_entity_id` (text)
  - `merchant_id` (text)
  - `quoted_rate` (numeric)
  - `settlement_cycle` (int)
  - `status` (text) — 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'VOIDED'
  - `signed_at` (date)
  - `terminated_reason` (text, nullable)
  - `void_reason` (text, nullable)
  - `created_at` (timestamptz)

  ### onboardings
  - `id` (text, primary key)
  - `channel_contract_id` (text) — references channel_contracts
  - `moonton_entity_id` (text, nullable)
  - `merchant_entity_id` (text, nullable)
  - `status` (text) — 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'VOIDED' | 'SUSPENDED'
  - `submitted_at` (date, nullable)
  - `approved_at` (date, nullable)
  - `rejected_reason` (text, nullable)
  - `merchant_account_id` (text, nullable)

  ### merchant_accounts
  - `id` (text, primary key)
  - `channel_id` (text)
  - `channel_contract_id` (text)
  - `onboarding_id` (text)
  - `api_key` (text)
  - `secret_key` (text)
  - `mode` (text) — 'LIVE' | 'SANDBOX'
  - `status` (text) — 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Anon key has full read/write access (internal admin tool, no end-user auth)

  ## Notes
  - Tables use text primary keys to match existing mock IDs
  - MerchantAccount status extended to include 'SUSPENDED' for cascade voiding
*/

-- Channel contracts
CREATE TABLE IF NOT EXISTS channel_contracts (
  id text PRIMARY KEY,
  moonton_entity_id text NOT NULL,
  channel_id text NOT NULL,
  merchant_mode text NOT NULL CHECK (merchant_mode IN ('MOR', 'SOR')),
  channel_rate numeric(10,6) NOT NULL,
  settlement_cycle integer NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'TERMINATED', 'VOIDED')),
  signed_at date NOT NULL,
  termination_reason text,
  void_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE channel_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read channel_contracts"
  ON channel_contracts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert channel_contracts"
  ON channel_contracts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update channel_contracts"
  ON channel_contracts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete channel_contracts"
  ON channel_contracts FOR DELETE
  TO anon
  USING (true);

-- Merchant contracts
CREATE TABLE IF NOT EXISTS merchant_contracts (
  id text PRIMARY KEY,
  moonton_entity_id text NOT NULL,
  merchant_id text NOT NULL,
  quoted_rate numeric(10,6) NOT NULL,
  settlement_cycle integer NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'TERMINATED', 'VOIDED')),
  signed_at date NOT NULL,
  terminated_reason text,
  void_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE merchant_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read merchant_contracts"
  ON merchant_contracts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert merchant_contracts"
  ON merchant_contracts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update merchant_contracts"
  ON merchant_contracts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete merchant_contracts"
  ON merchant_contracts FOR DELETE
  TO anon
  USING (true);

-- Onboardings
CREATE TABLE IF NOT EXISTS onboardings (
  id text PRIMARY KEY,
  channel_contract_id text NOT NULL REFERENCES channel_contracts(id),
  moonton_entity_id text,
  merchant_entity_id text,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'VOIDED', 'SUSPENDED')),
  submitted_at date,
  approved_at date,
  rejected_reason text,
  merchant_account_id text
);

ALTER TABLE onboardings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read onboardings"
  ON onboardings FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert onboardings"
  ON onboardings FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update onboardings"
  ON onboardings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete onboardings"
  ON onboardings FOR DELETE
  TO anon
  USING (true);

-- Merchant accounts
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id text PRIMARY KEY,
  channel_id text NOT NULL,
  channel_contract_id text NOT NULL REFERENCES channel_contracts(id),
  onboarding_id text NOT NULL REFERENCES onboardings(id),
  api_key text NOT NULL,
  secret_key text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('LIVE', 'SANDBOX')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read merchant_accounts"
  ON merchant_accounts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert merchant_accounts"
  ON merchant_accounts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update merchant_accounts"
  ON merchant_accounts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete merchant_accounts"
  ON merchant_accounts FOR DELETE
  TO anon
  USING (true);
