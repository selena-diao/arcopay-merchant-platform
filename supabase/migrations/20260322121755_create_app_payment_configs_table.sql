/*
  # Create app_payment_configs table

  1. New Tables
    - `app_payment_configs`
      - `id` (text, primary key)
      - `app_id` (text, FK → applications.id)
      - `payment_method_id` (text, FK → payment_methods.id)
      - `settlement_account_id` (text, FK → settlement_accounts.id)
      - `quoted_rate` (numeric, default 0)
      - `status` (text, 'ACTIVE' | 'INACTIVE', default 'ACTIVE')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `app_payment_configs` table
    - Add policy for anon/authenticated users to SELECT, INSERT, UPDATE, DELETE
      (internal ops tool — same open-access pattern as other tables in this project)
*/

CREATE TABLE IF NOT EXISTS app_payment_configs (
  id                   text PRIMARY KEY,
  app_id               text NOT NULL REFERENCES applications(id),
  payment_method_id    text NOT NULL REFERENCES payment_methods(id),
  settlement_account_id text NOT NULL REFERENCES settlement_accounts(id),
  quoted_rate          numeric NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'ACTIVE',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE app_payment_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select app_payment_configs"
  ON app_payment_configs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert app_payment_configs"
  ON app_payment_configs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update app_payment_configs"
  ON app_payment_configs FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete app_payment_configs"
  ON app_payment_configs FOR DELETE
  TO anon
  USING (true);
