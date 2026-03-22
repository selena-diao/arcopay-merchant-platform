
/*
  # Create Settlement Tables

  ## Overview
  Introduces the finance layer for tracking settlement records between Moonton
  and its channels / merchants.

  ## New Tables

  ### 1. settlement_accounts
  - Pre-existing concept in mock data, now persisted to DB
  - Columns: id, merchant_id, account_name, bank_info, status
  - Seeded with sa-1, sa-2, sa-3 from mock data

  ### 2. channel_settlement_record
  Tracks settlement cycles between Moonton and a payment channel.
  - `id` – text PK (prefixed csr-)
  - `channel_contract_id` – FK → channel_contracts(id)
  - `channel_id` – text, denormalised for quick filtering
  - `period_start` / `period_end` – DATE range for the settlement period
  - `expected_amount` – DECIMAL, computed expected payout
  - `actual_amount` – DECIMAL nullable, filled on SETTLED
  - `currency` – VARCHAR(10)
  - `status` – ENUM: PENDING | IN_RECONCILIATION | SETTLED | DISPUTED
  - `settled_at` – DATE nullable
  - `notes` – TEXT nullable
  - `dispute_history` – JSONB array, append-only log of dispute events
  - `created_at` / `updated_at`

  ### 3. merchant_settlement_record
  Tracks settlement cycles between Moonton and a merchant.
  - Same shape as channel_settlement_record plus:
  - `merchant_contract_id` – FK → merchant_contracts(id)
  - `merchant_id` – text denormalised
  - `settlement_account_id` – FK → settlement_accounts(id)

  ## Security
  - RLS enabled on all three tables
  - Authenticated users can read and write own-context data
    (all authenticated users for now — ops-tool context, no multi-tenancy)

  ## Status Transitions (enforced in application layer)
  PENDING → IN_RECONCILIATION → SETTLED (terminal)
                             → DISPUTED → IN_RECONCILIATION (loop)
                                        → SETTLED (terminal)

  ## Seed Data
  - 3 PENDING, 2 IN_RECONCILIATION, 2 SETTLED, 1 DISPUTED channel records
  - 3 PENDING, 2 SETTLED, 1 DISPUTED merchant records
*/

-- ============================================================
-- settlement_accounts (needed as FK target for merchant records)
-- ============================================================
CREATE TABLE IF NOT EXISTS settlement_accounts (
  id           text PRIMARY KEY,
  merchant_id  text NOT NULL,
  account_name text NOT NULL,
  bank_info    text NOT NULL DEFAULT '',
  status       text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text])),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE settlement_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settlement accounts"
  ON settlement_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert settlement accounts"
  ON settlement_accounts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update settlement accounts"
  ON settlement_accounts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed settlement_accounts
INSERT INTO settlement_accounts (id, merchant_id, account_name, bank_info, status) VALUES
  ('sa-1', 'm-1', '上海神木互动科技股份有限公司', '招商银行 ****1234', 'ACTIVE'),
  ('sa-2', 'm-1', 'Shenmoon Interactive HK Ltd', 'HSBC Hong Kong ****5678', 'ACTIVE'),
  ('sa-3', 'm-3', 'Garena Online Pte Ltd', 'DBS Singapore ****9012', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- channel_settlement_record
-- ============================================================
CREATE TABLE IF NOT EXISTS channel_settlement_records (
  id                   text PRIMARY KEY,
  channel_contract_id  text NOT NULL REFERENCES channel_contracts(id),
  channel_id           text NOT NULL,
  period_start         date NOT NULL,
  period_end           date NOT NULL,
  expected_amount      numeric(18,4) NOT NULL,
  actual_amount        numeric(18,4),
  currency             varchar(10) NOT NULL DEFAULT 'USD',
  status               text NOT NULL DEFAULT 'PENDING'
    CHECK (status = ANY (ARRAY['PENDING'::text, 'IN_RECONCILIATION'::text, 'SETTLED'::text, 'DISPUTED'::text])),
  settled_at           date,
  notes                text,
  dispute_history      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE channel_settlement_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read channel settlement records"
  ON channel_settlement_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert channel settlement records"
  ON channel_settlement_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update channel settlement records"
  ON channel_settlement_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- updated_at trigger for channel_settlement_records
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'channel_settlement_records_updated_at'
  ) THEN
    CREATE TRIGGER channel_settlement_records_updated_at
      BEFORE UPDATE ON channel_settlement_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================================
-- merchant_settlement_record
-- ============================================================
CREATE TABLE IF NOT EXISTS merchant_settlement_records (
  id                      text PRIMARY KEY,
  merchant_contract_id    text NOT NULL REFERENCES merchant_contracts(id),
  merchant_id             text NOT NULL,
  settlement_account_id   text NOT NULL REFERENCES settlement_accounts(id),
  period_start            date NOT NULL,
  period_end              date NOT NULL,
  expected_amount         numeric(18,4) NOT NULL,
  actual_amount           numeric(18,4),
  currency                varchar(10) NOT NULL DEFAULT 'USD',
  status                  text NOT NULL DEFAULT 'PENDING'
    CHECK (status = ANY (ARRAY['PENDING'::text, 'IN_RECONCILIATION'::text, 'SETTLED'::text, 'DISPUTED'::text])),
  settled_at              date,
  notes                   text,
  dispute_history         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE merchant_settlement_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read merchant settlement records"
  ON merchant_settlement_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert merchant settlement records"
  ON merchant_settlement_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update merchant settlement records"
  ON merchant_settlement_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'merchant_settlement_records_updated_at'
  ) THEN
    CREATE TRIGGER merchant_settlement_records_updated_at
      BEFORE UPDATE ON merchant_settlement_records
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================================
-- Seed: channel_settlement_records
-- ============================================================
INSERT INTO channel_settlement_records
  (id, channel_contract_id, channel_id, period_start, period_end, expected_amount, actual_amount, currency, status, settled_at, notes, dispute_history)
VALUES
  -- 3 PENDING
  ('csr-1',  'cc-1', 'ch-1', '2024-01-01', '2024-01-07',  128450.0000, NULL,          'USD', 'PENDING',           NULL,         NULL, '[]'),
  ('csr-2',  'cc-2', 'ch-1', '2024-01-01', '2024-01-07',   94320.0000, NULL,          'USD', 'PENDING',           NULL,         NULL, '[]'),
  ('csr-3',  'cc-3', 'ch-2', '2024-01-01', '2024-01-14',   56780.0000, NULL,          'USD', 'PENDING',           NULL,         NULL, '[]'),
  -- 2 IN_RECONCILIATION
  ('csr-4',  'cc-1', 'ch-1', '2023-12-25', '2023-12-31',  119200.0000, NULL,          'USD', 'IN_RECONCILIATION', NULL,         '对账中，等待渠道确认', '[]'),
  ('csr-5',  'cc-4', 'ch-3', '2023-12-18', '2023-12-31',   73400.0000, NULL,          'USD', 'IN_RECONCILIATION', NULL,         NULL, '[]'),
  -- 2 SETTLED
  ('csr-6',  'cc-1', 'ch-1', '2023-12-18', '2023-12-24',  115600.0000, 114980.0000,   'USD', 'SETTLED',           '2024-01-05', NULL, '[]'),
  ('csr-7',  'cc-3', 'ch-2', '2023-12-04', '2023-12-17',   68900.0000,  68900.0000,   'USD', 'SETTLED',           '2023-12-28', NULL, '[]'),
  -- 1 DISPUTED (with 2 dispute_history entries)
  ('csr-8',  'cc-2', 'ch-1', '2023-12-25', '2023-12-31',   92100.0000, NULL,          'USD', 'DISPUTED',          NULL,         '渠道提交金额与系统记录不符',
   '[{"time":"2024-01-03T09:15:00Z","operator":"ops-admin","note":"渠道提交金额低于系统计算值，差额约 1200 USD，已发起核查"},{"time":"2024-01-05T14:22:00Z","operator":"ops-admin","note":"渠道回复称部分交易存在退款，提供了退款清单，继续核查"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- Seed: merchant_settlement_records
-- ============================================================
INSERT INTO merchant_settlement_records
  (id, merchant_contract_id, merchant_id, settlement_account_id, period_start, period_end, expected_amount, actual_amount, currency, status, settled_at, notes, dispute_history)
VALUES
  -- 3 PENDING
  ('msr-1', 'mc-1', 'm-1', 'sa-1', '2024-01-01', '2024-01-14',  98600.0000, NULL,         'USD', 'PENDING',  NULL,         NULL, '[]'),
  ('msr-2', 'mc-2', 'm-1', 'sa-1', '2024-01-01', '2024-01-14',  74300.0000, NULL,         'USD', 'PENDING',  NULL,         NULL, '[]'),
  ('msr-3', 'mc-3', 'm-3', 'sa-3', '2024-01-01', '2024-01-07',  51200.0000, NULL,         'USD', 'PENDING',  NULL,         NULL, '[]'),
  -- 2 SETTLED
  ('msr-4', 'mc-1', 'm-1', 'sa-1', '2023-12-18', '2023-12-31',  95400.0000, 95400.0000,  'USD', 'SETTLED',  '2024-01-08', NULL, '[]'),
  ('msr-5', 'mc-3', 'm-3', 'sa-3', '2023-12-25', '2023-12-31',  48800.0000, 48500.0000,  'USD', 'SETTLED',  '2024-01-04', NULL, '[]'),
  -- 1 DISPUTED
  ('msr-6', 'mc-4', 'm-4', 'sa-1', '2023-12-18', '2023-12-31',  62150.0000, NULL,        'USD', 'DISPUTED', NULL,         '游戏方对结算金额提出异议',
   '[{"time":"2024-01-06T11:00:00Z","operator":"ops-admin","note":"游戏方反馈部分充值订单未被计入，涉及金额约 2300 USD"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
