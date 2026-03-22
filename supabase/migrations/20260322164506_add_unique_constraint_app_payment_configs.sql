/*
  # Add unique constraint to app_payment_configs

  ## Summary
  Adds a unique constraint on (app_id, payment_method_id) to the app_payment_configs table.

  ## Changes
  - Modified Tables
    - `app_payment_configs`: new unique constraint on (app_id, payment_method_id)

  ## Notes
  - Prevents duplicate payment method configurations for the same app
  - Duplicate rows were removed prior to applying this constraint
*/

ALTER TABLE app_payment_configs
  ADD CONSTRAINT app_payment_configs_app_id_payment_method_id_key
  UNIQUE (app_id, payment_method_id);
