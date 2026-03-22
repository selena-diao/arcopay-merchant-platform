/*
  # Fix RLS policies: add full anon access to settlement tables

  ## Problem
  channel_settlement_records and merchant_settlement_records only had:
  - anon INSERT (added in previous patch)
  - authenticated SELECT, UPDATE, INSERT

  The anon client (used by this app) was blocked on SELECT and UPDATE.
  This caused the `.select().single()` call after INSERT to fail silently,
  making it appear that insert was broken.

  ## Changes
  1. channel_settlement_records — add anon SELECT, UPDATE, DELETE policies
  2. merchant_settlement_records — add anon SELECT, UPDATE, DELETE policies
  3. settlement_accounts — add anon SELECT, INSERT, UPDATE, DELETE policies
     (same gap: only authenticated policies existed)

  ## Notes
  All other working tables (channel_contracts, merchant_contracts, merchant_accounts,
  onboardings, transactions) follow the same full-anon-access pattern.
  This aligns settlement tables with that convention.
*/

-- channel_settlement_records: add missing anon policies
CREATE POLICY "anon can read channel_settlement_records"
  ON channel_settlement_records FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can update channel_settlement_records"
  ON channel_settlement_records FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete channel_settlement_records"
  ON channel_settlement_records FOR DELETE
  TO anon
  USING (true);

-- merchant_settlement_records: add missing anon policies
CREATE POLICY "anon can read merchant_settlement_records"
  ON merchant_settlement_records FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can update merchant_settlement_records"
  ON merchant_settlement_records FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete merchant_settlement_records"
  ON merchant_settlement_records FOR DELETE
  TO anon
  USING (true);

-- settlement_accounts: add missing anon policies
CREATE POLICY "anon can read settlement_accounts"
  ON settlement_accounts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert settlement_accounts"
  ON settlement_accounts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update settlement_accounts"
  ON settlement_accounts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete settlement_accounts"
  ON settlement_accounts FOR DELETE
  TO anon
  USING (true);
