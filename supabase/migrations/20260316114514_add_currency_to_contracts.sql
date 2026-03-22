/*
  # Add currency field to channel_contracts and merchant_contracts

  ## Overview
  Adds a `currency` column to both contract tables so the settlement currency
  is determined at contract creation time and auto-filled in settlement records.

  ## Changes

  ### channel_contracts
  - New column `currency` (text, NOT NULL, DEFAULT 'USD')
    - Stores the settlement currency agreed in the contract (e.g. USD, CNY, HKD, SGD, PHP)

  ### merchant_contracts
  - New column `currency` (text, NOT NULL, DEFAULT 'USD')
    - Same purpose for merchant-side contracts

  ## Notes
  - Existing rows will be backfilled with 'USD' as a safe default
  - No destructive operations; column is added with a default value
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channel_contracts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE channel_contracts ADD COLUMN currency text NOT NULL DEFAULT 'USD';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'merchant_contracts' AND column_name = 'currency'
  ) THEN
    ALTER TABLE merchant_contracts ADD COLUMN currency text NOT NULL DEFAULT 'USD';
  END IF;
END $$;
