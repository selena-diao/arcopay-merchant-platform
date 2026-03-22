/*
  # Rename Channels and Update All References (v2)

  ## Summary
  Renames 6 channels from internal codenames to real payment provider names,
  updating all foreign key references across child tables atomically.

  ## Channel Renames
  - paycools → adyen (Adyen)
  - paynow → stripe (Stripe)
  - paypal → checkout (Checkout.com)
  - dreamo → xendit (Xendit)
  - smileone → twoc2p (2C2P)
  - liandong → airwallex (Airwallex)

  ## Tables Updated
  - channel_contracts (channel_id, no FK constraint)
  - channel_settlement_records (channel_id, no FK constraint)
  - channel_payment_methods (channel_id, no FK constraint)
  - routing_rules (channel_id, no FK constraint)
  - moonton_kyb_records (channel_id, FK constraint dropped and re-added)
  - merchant_kyb_records (channel_id, FK constraint dropped and re-added)
  - channels (id, name, display_name — primary table)

  ## Notes
  - merchant_accounts.channel_id uses a different ID scheme (ch-1 etc.) and is not updated
  - Only moonton_kyb_records and merchant_kyb_records have actual FK constraints to channels
*/

-- Step 1: Drop FK constraints that reference channels.id
ALTER TABLE moonton_kyb_records DROP CONSTRAINT IF EXISTS moonton_kyb_records_channel_id_fkey;
ALTER TABLE merchant_kyb_records DROP CONSTRAINT IF EXISTS merchant_kyb_records_channel_id_fkey;

-- Step 2: Update channel_id references in all child tables
UPDATE channel_contracts SET channel_id = 'adyen' WHERE channel_id = 'paycools';
UPDATE channel_contracts SET channel_id = 'stripe' WHERE channel_id = 'paynow';
UPDATE channel_contracts SET channel_id = 'checkout' WHERE channel_id = 'paypal';
UPDATE channel_contracts SET channel_id = 'xendit' WHERE channel_id = 'dreamo';
UPDATE channel_contracts SET channel_id = 'twoc2p' WHERE channel_id = 'smileone';
UPDATE channel_contracts SET channel_id = 'airwallex' WHERE channel_id = 'liandong';

UPDATE channel_settlement_records SET channel_id = 'adyen' WHERE channel_id = 'paycools';
UPDATE channel_settlement_records SET channel_id = 'stripe' WHERE channel_id = 'paynow';
UPDATE channel_settlement_records SET channel_id = 'checkout' WHERE channel_id = 'paypal';
UPDATE channel_settlement_records SET channel_id = 'xendit' WHERE channel_id = 'dreamo';
UPDATE channel_settlement_records SET channel_id = 'twoc2p' WHERE channel_id = 'smileone';
UPDATE channel_settlement_records SET channel_id = 'airwallex' WHERE channel_id = 'liandong';

UPDATE channel_payment_methods SET channel_id = 'adyen' WHERE channel_id = 'paycools';
UPDATE channel_payment_methods SET channel_id = 'stripe' WHERE channel_id = 'paynow';
UPDATE channel_payment_methods SET channel_id = 'checkout' WHERE channel_id = 'paypal';
UPDATE channel_payment_methods SET channel_id = 'xendit' WHERE channel_id = 'dreamo';
UPDATE channel_payment_methods SET channel_id = 'twoc2p' WHERE channel_id = 'smileone';
UPDATE channel_payment_methods SET channel_id = 'airwallex' WHERE channel_id = 'liandong';

UPDATE routing_rules SET channel_id = 'adyen' WHERE channel_id = 'paycools';
UPDATE routing_rules SET channel_id = 'stripe' WHERE channel_id = 'paynow';
UPDATE routing_rules SET channel_id = 'checkout' WHERE channel_id = 'paypal';
UPDATE routing_rules SET channel_id = 'xendit' WHERE channel_id = 'dreamo';
UPDATE routing_rules SET channel_id = 'twoc2p' WHERE channel_id = 'smileone';
UPDATE routing_rules SET channel_id = 'airwallex' WHERE channel_id = 'liandong';

UPDATE moonton_kyb_records SET channel_id = 'adyen' WHERE channel_id = 'paycools';
UPDATE moonton_kyb_records SET channel_id = 'stripe' WHERE channel_id = 'paynow';
UPDATE moonton_kyb_records SET channel_id = 'checkout' WHERE channel_id = 'paypal';
UPDATE moonton_kyb_records SET channel_id = 'xendit' WHERE channel_id = 'dreamo';
UPDATE moonton_kyb_records SET channel_id = 'twoc2p' WHERE channel_id = 'smileone';
UPDATE moonton_kyb_records SET channel_id = 'airwallex' WHERE channel_id = 'liandong';

UPDATE merchant_kyb_records SET channel_id = 'adyen' WHERE channel_id = 'paycools';
UPDATE merchant_kyb_records SET channel_id = 'stripe' WHERE channel_id = 'paynow';
UPDATE merchant_kyb_records SET channel_id = 'checkout' WHERE channel_id = 'paypal';
UPDATE merchant_kyb_records SET channel_id = 'xendit' WHERE channel_id = 'dreamo';
UPDATE merchant_kyb_records SET channel_id = 'twoc2p' WHERE channel_id = 'smileone';
UPDATE merchant_kyb_records SET channel_id = 'airwallex' WHERE channel_id = 'liandong';

-- Step 3: Update channels.id (primary key)
UPDATE channels SET id = 'adyen' WHERE id = 'paycools';
UPDATE channels SET id = 'stripe' WHERE id = 'paynow';
UPDATE channels SET id = 'checkout' WHERE id = 'paypal';
UPDATE channels SET id = 'xendit' WHERE id = 'dreamo';
UPDATE channels SET id = 'twoc2p' WHERE id = 'smileone';
UPDATE channels SET id = 'airwallex' WHERE id = 'liandong';

-- Step 4: Update channels.name and display_name
UPDATE channels SET name = 'adyen', display_name = 'Adyen' WHERE id = 'adyen';
UPDATE channels SET name = 'stripe', display_name = 'Stripe' WHERE id = 'stripe';
UPDATE channels SET name = 'checkout', display_name = 'Checkout.com' WHERE id = 'checkout';
UPDATE channels SET name = 'xendit', display_name = 'Xendit' WHERE id = 'xendit';
UPDATE channels SET name = 'twoc2p', display_name = '2C2P' WHERE id = 'twoc2p';
UPDATE channels SET name = 'airwallex', display_name = 'Airwallex' WHERE id = 'airwallex';

-- Step 5: Re-add FK constraints
ALTER TABLE moonton_kyb_records ADD CONSTRAINT moonton_kyb_records_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id);
ALTER TABLE merchant_kyb_records ADD CONSTRAINT merchant_kyb_records_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id);
