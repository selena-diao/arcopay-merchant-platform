/*
  # Create channels table

  ## Summary
  Creates the `channels` table which was missing from the database. The channel_payment_methods
  and channel_payment_method_country tables already exist and reference channels by text ID.

  ## New Tables
  - `channels`
    - `id` (text, primary key) — e.g. "paycools", "dreamo"
    - `name` (text, unique) — system identifier / slug
    - `display_name` (text) — human-readable display name
    - `merchant_mode` (text) — 'MOR' or 'SOR'
    - `success_rate` (numeric) — decimal 0-1, e.g. 0.983
    - `status` (text) — 'ACTIVE', 'INACTIVE', 'MAINTENANCE'
    - `created_at` (date)

  ## Security
  - RLS enabled
  - Anon users can SELECT (read-only public directory)
  - Anon users can INSERT/UPDATE/DELETE (internal ops tool, no auth layer yet)

  ## Notes
  1. channel_payment_methods.channel_id is text, matching channels.id (text PK)
  2. No FK constraint added to avoid migration failure if existing rows reference missing channels
*/

CREATE TABLE IF NOT EXISTS channels (
  id text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  display_name text NOT NULL DEFAULT '',
  merchant_mode text NOT NULL DEFAULT 'MOR',
  success_rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can read channels"
  ON channels FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert channels"
  ON channels FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update channels"
  ON channels FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete channels"
  ON channels FOR DELETE
  TO anon
  USING (true);
