/*
  # Create payment_methods table and seed data

  ## Summary
  Creates the `payment_methods` reference table which was previously only in mock data.
  Seeds it with 5 canonical payment methods using the same IDs the rest of the system
  already references (pm-1 through pm-5), ensuring consistency with existing
  channel_payment_methods rows that reference pm-1, pm-3, and pm-4.

  ## New Tables
  - `payment_methods`
    - `id` (text, primary key) — e.g. "pm-1"
    - `name` (text, unique) — display name, e.g. "微信支付"
    - `type` (text) — 'WALLET', 'EWALLET', 'CARD', 'BANK_TRANSFER', 'PREPAID'
    - `status` (text) — 'ACTIVE' or 'INACTIVE'

  ## Seed Data
  Five payment methods inserted matching existing mock IDs:
    pm-1 微信支付, pm-2 支付宝, pm-3 GCash, pm-4 信用卡, pm-5 PayNow

  ## Security
  - RLS enabled
  - Anon users can SELECT, INSERT, UPDATE, DELETE (internal ops tool, no auth layer yet)
*/

CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'WALLET',
  status text NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read payment_methods"
  ON payment_methods FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert payment_methods"
  ON payment_methods FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update payment_methods"
  ON payment_methods FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete payment_methods"
  ON payment_methods FOR DELETE
  TO anon
  USING (true);

INSERT INTO payment_methods (id, name, type, status) VALUES
  ('pm-1', '微信支付',  'WALLET',        'ACTIVE'),
  ('pm-2', '支付宝',    'WALLET',        'ACTIVE'),
  ('pm-3', 'GCash',    'EWALLET',       'ACTIVE'),
  ('pm-4', '信用卡',    'CARD',          'ACTIVE'),
  ('pm-5', 'PayNow',   'BANK_TRANSFER', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;
