/*
  # Create routing_strategies table

  ## Summary
  Creates the `routing_strategies` table to store routing strategy configuration
  per payment method. This replaces the mock data used by the frontend.

  ## New Tables
  - `routing_strategies`
    - `id` (text, primary key) — e.g. "rs-1"
    - `payment_method_id` (text, not null) — references a payment method
    - `type` (text, not null) — 'MANUAL' or 'SMART'
    - `description` (text) — optional human-readable description

  ## Security
  - RLS enabled
  - Anon users can SELECT, INSERT, UPDATE, DELETE (internal ops tool, no auth layer yet)
*/

CREATE TABLE IF NOT EXISTS routing_strategies (
  id text PRIMARY KEY,
  payment_method_id text NOT NULL,
  type text NOT NULL DEFAULT 'MANUAL',
  description text NOT NULL DEFAULT ''
);

ALTER TABLE routing_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read routing_strategies"
  ON routing_strategies FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert routing_strategies"
  ON routing_strategies FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update routing_strategies"
  ON routing_strategies FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete routing_strategies"
  ON routing_strategies FOR DELETE
  TO anon
  USING (true);
