/*
  # Create contract_payment_methods table

  ## Overview
  Creates the contract_payment_methods table for storing payment method configurations
  tied to merchant contracts.

  ## New Tables
  ### contract_payment_methods
  - `id` (text, primary key) — matches mock IDs (mcpm-*)
  - `merchant_contract_id` (text) — references merchant_contracts
  - `payment_method_id` (text) — references the payment method
  - `quoted_rate` (numeric) — fee rate as decimal
  - `status` (text) — 'ACTIVE' | 'INACTIVE'
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anon key has full read/write access (internal admin tool, no end-user auth)
*/

CREATE TABLE IF NOT EXISTS contract_payment_methods (
  id text PRIMARY KEY,
  merchant_contract_id text NOT NULL,
  payment_method_id text NOT NULL,
  quoted_rate numeric(10,6) NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read contract_payment_methods"
  ON contract_payment_methods FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert contract_payment_methods"
  ON contract_payment_methods FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update contract_payment_methods"
  ON contract_payment_methods FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete contract_payment_methods"
  ON contract_payment_methods FOR DELETE
  TO anon
  USING (true);
