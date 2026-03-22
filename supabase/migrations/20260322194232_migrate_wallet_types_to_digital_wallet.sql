/*
  # Migrate payment method types to DIGITAL_WALLET

  ## Summary
  Consolidates the legacy WALLET and EWALLET payment method types into a single
  unified DIGITAL_WALLET type.

  ## Changes
  - Updates all rows in `payment_methods` where `type` is 'WALLET' or 'EWALLET'
    to use the new value 'DIGITAL_WALLET'.

  ## Notes
  - No schema/column changes; only data values are updated.
  - No RLS changes required.
*/

UPDATE payment_methods
SET type = 'DIGITAL_WALLET'
WHERE type IN ('WALLET', 'EWALLET');
