/*
  # Add merchant_contract_id to app_payment_configs

  ## Summary
  Adds a direct foreign key link from app_payment_configs to merchant_contracts,
  fixing the ambiguity when a merchant has multiple active contracts.

  ## Changes

  ### Modified Tables
  - `app_payment_configs`
    - New column: `merchant_contract_id` (text, nullable FK → merchant_contracts.id)
    - Populates existing records with the correct contract based on matching
      payment_method_id in contract_payment_methods

  ## Notes
  - Column is nullable to avoid breaking existing records during migration
  - Existing records are backfilled using CPM data to find the correct contract
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_payment_configs' AND column_name = 'merchant_contract_id'
  ) THEN
    ALTER TABLE app_payment_configs
      ADD COLUMN merchant_contract_id text REFERENCES merchant_contracts(id);
  END IF;
END $$;

UPDATE app_payment_configs
SET merchant_contract_id = sub.merchant_contract_id
FROM (
  SELECT
    apc.id AS apc_id,
    cpm.merchant_contract_id
  FROM app_payment_configs apc
  JOIN applications a ON a.id = apc.app_id
  JOIN merchant_contracts mc ON mc.merchant_id = a.merchant_id AND mc.status = 'ACTIVE'
  JOIN contract_payment_methods cpm ON cpm.merchant_contract_id = mc.id
    AND cpm.payment_method_id = apc.payment_method_id
    AND cpm.status = 'ACTIVE'
  WHERE apc.merchant_contract_id IS NULL
) sub
WHERE app_payment_configs.id = sub.apc_id;
