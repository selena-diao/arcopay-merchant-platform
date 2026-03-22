
/*
  # Migrate channel_name to channel_id FK in KYB tables

  ## Summary
  Replaces the `channel_name` text column with a `channel_id` foreign key column
  in both `moonton_kyb_records` and `merchant_kyb_records` tables.

  ## Changes

  ### moonton_kyb_records
  - Add `channel_id` (text, FK -> channels.id)
  - Populate `channel_id` from existing `channel_name` values
  - Set `channel_id` NOT NULL
  - Drop `channel_name`

  ### merchant_kyb_records
  - Add `channel_id` (text, FK -> channels.id)
  - Populate `channel_id` from existing `channel_name` values
  - Set `channel_id` NOT NULL
  - Drop `channel_name`

  ## Notes
  - All steps run atomically; any failure rolls back the entire migration
*/

DO $$
BEGIN

  -- moonton_kyb_records
  ALTER TABLE moonton_kyb_records ADD COLUMN IF NOT EXISTS channel_id text REFERENCES channels(id);
  UPDATE moonton_kyb_records SET channel_id = channel_name;
  ALTER TABLE moonton_kyb_records ALTER COLUMN channel_id SET NOT NULL;
  ALTER TABLE moonton_kyb_records DROP COLUMN IF EXISTS channel_name;

  -- merchant_kyb_records
  ALTER TABLE merchant_kyb_records ADD COLUMN IF NOT EXISTS channel_id text REFERENCES channels(id);
  UPDATE merchant_kyb_records SET channel_id = channel_name;
  ALTER TABLE merchant_kyb_records ALTER COLUMN channel_id SET NOT NULL;
  ALTER TABLE merchant_kyb_records DROP COLUMN IF EXISTS channel_name;

END $$;
