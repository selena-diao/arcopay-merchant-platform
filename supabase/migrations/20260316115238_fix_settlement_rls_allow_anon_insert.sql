/*
  # Fix settlement record INSERT policies to allow anon role

  ## Problem
  The INSERT policies on channel_settlement_records and merchant_settlement_records
  were scoped to the `authenticated` role only. This app uses the anon key (no auth),
  so insert operations were being blocked by RLS.

  ## Changes
  - Add anon INSERT policy to channel_settlement_records
  - Add anon INSERT policy to merchant_settlement_records

  ## Notes
  - All other tables in this project already grant anon full read/write access
  - This is an internal admin tool with no end-user auth, consistent with existing policy pattern
*/

CREATE POLICY "anon can insert channel_settlement_records"
  ON channel_settlement_records FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can insert merchant_settlement_records"
  ON merchant_settlement_records FOR INSERT
  TO anon
  WITH CHECK (true);
