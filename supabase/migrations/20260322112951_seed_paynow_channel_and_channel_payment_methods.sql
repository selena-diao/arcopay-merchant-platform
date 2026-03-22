/*
  # Seed PayNow channel and channel_payment_methods for real channel IDs

  ## Summary
  Adds the missing PayNow channel and inserts channel_payment_method rows linking
  the real channel slugs (paycools, dreamo, smileone, liandong, paynow) to their
  supported payment methods. These use new IDs prefixed with "v2-" to avoid
  colliding with legacy rows that used mock IDs (ch-1, ch-2, etc.).

  ## Changes

  ### channels — new row
  - `paynow` channel added (PayNow, MOR, ACTIVE)

  ### channel_payment_methods — new rows
  PayCools   → 微信支付 (pm-1), 信用卡 (pm-4)
  Dreamo     → 支付宝 (pm-2), GCash (pm-3), 信用卡 (pm-4)
  SmileOne   → 支付宝 (pm-2), 微信支付 (pm-1), 信用卡 (pm-4)
  Liandong   → 支付宝 (pm-2), 信用卡 (pm-4)
  PayNow     → GCash (pm-3), PayNow (pm-5)

  ## Notes
  1. All channel_id values reference existing rows in the channels table.
  2. All payment_method_id values reference rows in the payment_methods table.
  3. ON CONFLICT DO NOTHING prevents duplicate errors on re-run.
*/

-- Add paynow channel if not already present
INSERT INTO channels (id, name, display_name, merchant_mode, success_rate, status, created_at) VALUES
  ('paynow', 'paynow', 'PayNow', 'MOR', 0.975, 'ACTIVE', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- Seed channel_payment_methods for real channel slugs
INSERT INTO channel_payment_methods (id, channel_id, payment_method_id) VALUES
  ('v2-cpm-01', 'paycools',  'pm-1'),
  ('v2-cpm-02', 'paycools',  'pm-4'),
  ('v2-cpm-03', 'dreamo',    'pm-2'),
  ('v2-cpm-04', 'dreamo',    'pm-3'),
  ('v2-cpm-05', 'dreamo',    'pm-4'),
  ('v2-cpm-06', 'smileone',  'pm-2'),
  ('v2-cpm-07', 'smileone',  'pm-1'),
  ('v2-cpm-08', 'smileone',  'pm-4'),
  ('v2-cpm-09', 'liandong',  'pm-2'),
  ('v2-cpm-10', 'liandong',  'pm-4'),
  ('v2-cpm-11', 'paynow',    'pm-3'),
  ('v2-cpm-12', 'paynow',    'pm-5')
ON CONFLICT (id) DO NOTHING;
