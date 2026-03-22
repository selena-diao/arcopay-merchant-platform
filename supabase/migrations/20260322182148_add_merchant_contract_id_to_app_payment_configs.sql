/*
  # Add merchant_contract_id to app_payment_configs

  ## Changes
  - `app_payment_configs` table
    - New column: `merchant_contract_id` (text, nullable, foreign key → merchant_contracts.id)

  ## Notes
  - Column is nullable to avoid breaking existing rows
  - References merchant_contracts(id) for referential integrity
*/

ALTER TABLE app_payment_configs
  ADD COLUMN IF NOT EXISTS merchant_contract_id text REFERENCES merchant_contracts(id);
