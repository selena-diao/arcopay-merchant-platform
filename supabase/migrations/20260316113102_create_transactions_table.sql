/*
  # Create Transaction Table

  ## Overview
  Introduces the `transactions` table to record individual payment transactions.
  Rate values are snapshot at creation time and must not be derived dynamically
  from contracts later.

  ## New Tables

  ### transactions
  - `id` (uuid, primary key) — generated
  - `merchant_account_id` (text, FK → merchant_accounts.id) — which account processed the txn
  - `payment_method_id` (text, FK → not enforced; text to match mock ids) — payment method used
  - `amount` (numeric 18,4) — transaction amount
  - `currency` (varchar 10) — currency code
  - `status` (text, enum) — SUCCESS | FAILED | REFUNDED
  - `channel_rate` (numeric 10,6) — snapshot of channel_contract.channel_rate at creation
  - `quoted_rate` (numeric 10,6) — snapshot of contract_payment_method.quoted_rate at creation
  - `created_at` (timestamptz) — defaults to now(), used for period range queries

  ## Security
  - RLS enabled
  - Anon and authenticated users both get full read/write (internal ops tool)

  ## Seed Data
  - 50 SUCCESS, 10 FAILED, 5 REFUNDED records
  - created_at spread across the past 90 days
  - Rates match existing channel_contracts and contract_payment_methods
  - merchant_account_ids: ma-1 (cc-1, ch-1), ma-2 (cc-2, ch-1), ma-3 (cc-3, ch-2)

  ## Notes
  - channel_rate/quoted_rate are intentional denormalisations (snapshots)
  - merchant_account_id references merchant_accounts(id) via text FK
*/

CREATE TABLE IF NOT EXISTS transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_account_id text NOT NULL REFERENCES merchant_accounts(id),
  payment_method_id   text NOT NULL,
  amount              numeric(18,4) NOT NULL,
  currency            varchar(10) NOT NULL DEFAULT 'USD',
  status              text NOT NULL CHECK (status = ANY (ARRAY['SUCCESS'::text, 'FAILED'::text, 'REFUNDED'::text])),
  channel_rate        numeric(10,6) NOT NULL,
  quoted_rate         numeric(10,6) NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant_account_id ON transactions(merchant_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status             ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at         ON transactions(created_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read transactions"
  ON transactions FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert transactions"
  ON transactions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update transactions"
  ON transactions FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "authenticated can read transactions"
  ON transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated can insert transactions"
  ON transactions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated can update transactions"
  ON transactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- Seed: 65 transactions
-- ma-1 → cc-1 (ch-1, channel_rate=0.028), pm-1 (quoted_rate N/A via mcpm), pm-4
-- ma-2 → cc-2 (ch-1, channel_rate=0.030), pm-1, pm-4
-- ma-3 → cc-3 (ch-2, channel_rate=0.032), pm-3 (quoted_rate=0.045), pm-4 (quoted_rate=0.038)
-- Note: mcpm-1 covers mc-1/pm-3 @ 0.045; mcpm-2 covers mc-1/pm-4 @ 0.038
-- For ma-1/ma-2 (ch-1) we use pm-1 quoted_rate=0.045 (nearest active mcpm) and pm-4 quoted_rate=0.038
-- ============================================================

INSERT INTO transactions (id, merchant_account_id, payment_method_id, amount, currency, status, channel_rate, quoted_rate, created_at) VALUES

-- ── ma-1 (cc-1, channel_rate=0.028) ──────────────────────────────────────────
-- SUCCESS × 18
(gen_random_uuid(), 'ma-1', 'pm-1', 12400.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '88 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  8750.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '85 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 15600.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '80 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  9200.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '76 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 11300.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '72 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  7800.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '68 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 13750.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '63 days'),
(gen_random_uuid(), 'ma-1', 'pm-4', 10100.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '58 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 14200.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '54 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  8600.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '50 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 16500.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '46 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  9950.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '42 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 12800.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '38 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  7400.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '34 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 11900.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '30 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  8300.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '25 days'),
(gen_random_uuid(), 'ma-1', 'pm-1', 14700.0000, 'USD', 'SUCCESS',  0.028000, 0.045000, now() - interval '20 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  9100.0000, 'USD', 'SUCCESS',  0.028000, 0.038000, now() - interval '15 days'),

-- FAILED × 4
(gen_random_uuid(), 'ma-1', 'pm-1',  5200.0000, 'USD', 'FAILED',   0.028000, 0.045000, now() - interval '83 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  3100.0000, 'USD', 'FAILED',   0.028000, 0.038000, now() - interval '65 days'),
(gen_random_uuid(), 'ma-1', 'pm-1',  4800.0000, 'USD', 'FAILED',   0.028000, 0.045000, now() - interval '44 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  2900.0000, 'USD', 'FAILED',   0.028000, 0.038000, now() - interval '22 days'),

-- REFUNDED × 2
(gen_random_uuid(), 'ma-1', 'pm-1',  6400.0000, 'USD', 'REFUNDED', 0.028000, 0.045000, now() - interval '77 days'),
(gen_random_uuid(), 'ma-1', 'pm-4',  4200.0000, 'USD', 'REFUNDED', 0.028000, 0.038000, now() - interval '48 days'),

-- ── ma-2 (cc-2, channel_rate=0.030) ──────────────────────────────────────────
-- SUCCESS × 18
(gen_random_uuid(), 'ma-2', 'pm-1', 10800.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '87 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  7600.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '84 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 13200.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '79 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  8400.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '75 days'),
(gen_random_uuid(), 'ma-2', 'pm-1',  9700.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '71 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  6900.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '67 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 11400.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '62 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  8850.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '57 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 12600.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '53 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  7200.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '49 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 14100.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '45 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  9300.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '41 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 10500.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '37 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  6700.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '33 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 11100.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '28 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  7900.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '23 days'),
(gen_random_uuid(), 'ma-2', 'pm-1', 13500.0000, 'USD', 'SUCCESS',  0.030000, 0.045000, now() - interval '18 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  8100.0000, 'USD', 'SUCCESS',  0.030000, 0.038000, now() - interval '12 days'),

-- FAILED × 4
(gen_random_uuid(), 'ma-2', 'pm-1',  4600.0000, 'USD', 'FAILED',   0.030000, 0.045000, now() - interval '82 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  2800.0000, 'USD', 'FAILED',   0.030000, 0.038000, now() - interval '60 days'),
(gen_random_uuid(), 'ma-2', 'pm-1',  5100.0000, 'USD', 'FAILED',   0.030000, 0.045000, now() - interval '39 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  3300.0000, 'USD', 'FAILED',   0.030000, 0.038000, now() - interval '17 days'),

-- REFUNDED × 2
(gen_random_uuid(), 'ma-2', 'pm-1',  5800.0000, 'USD', 'REFUNDED', 0.030000, 0.045000, now() - interval '73 days'),
(gen_random_uuid(), 'ma-2', 'pm-4',  3900.0000, 'USD', 'REFUNDED', 0.030000, 0.038000, now() - interval '43 days'),

-- ── ma-3 (cc-3, channel_rate=0.032) ──────────────────────────────────────────
-- SUCCESS × 14
(gen_random_uuid(), 'ma-3', 'pm-3',  9600.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '86 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  6500.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '81 days'),
(gen_random_uuid(), 'ma-3', 'pm-3', 11200.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '74 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  7100.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '69 days'),
(gen_random_uuid(), 'ma-3', 'pm-3', 10300.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '64 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  8200.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '59 days'),
(gen_random_uuid(), 'ma-3', 'pm-3', 12100.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '55 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  7500.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '51 days'),
(gen_random_uuid(), 'ma-3', 'pm-3',  9900.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '47 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  6800.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '40 days'),
(gen_random_uuid(), 'ma-3', 'pm-3', 10700.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '35 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  7700.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '29 days'),
(gen_random_uuid(), 'ma-3', 'pm-3', 11500.0000, 'USD', 'SUCCESS',  0.032000, 0.045000, now() - interval '21 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  8000.0000, 'USD', 'SUCCESS',  0.032000, 0.038000, now() - interval '10 days'),

-- FAILED × 2
(gen_random_uuid(), 'ma-3', 'pm-3',  4100.0000, 'USD', 'FAILED',   0.032000, 0.045000, now() - interval '78 days'),
(gen_random_uuid(), 'ma-3', 'pm-4',  2600.0000, 'USD', 'FAILED',   0.032000, 0.038000, now() - interval '36 days'),

-- REFUNDED × 1
(gen_random_uuid(), 'ma-3', 'pm-3',  5500.0000, 'USD', 'REFUNDED', 0.032000, 0.045000, now() - interval '66 days');
