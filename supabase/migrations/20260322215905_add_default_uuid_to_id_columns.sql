/*
  # Add DEFAULT gen_random_uuid() to id columns

  ## Summary
  Several tables were created with `id text NOT NULL PRIMARY KEY` but no default value,
  causing inserts that omit `id` to fail with a not-null constraint violation.

  ## Changes
  Adds `DEFAULT gen_random_uuid()::text` to the `id` column of all affected tables:
  - channel_contracts
  - merchant_contracts
  - channel_settlement_records
  - merchant_settlement_records
  - routing_rules
  - routing_strategies
  - app_payment_configs
  - onboardings
  - merchant_accounts
  - moonton_kyb_records
  - merchant_kyb_records
  - channel_payment_methods
  - contract_payment_methods
  - settlement_accounts
*/

ALTER TABLE channel_contracts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE merchant_contracts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE channel_settlement_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE merchant_settlement_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE routing_rules ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE routing_strategies ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE app_payment_configs ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE onboardings ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE merchant_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE moonton_kyb_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE merchant_kyb_records ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE channel_payment_methods ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE contract_payment_methods ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE settlement_accounts ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
