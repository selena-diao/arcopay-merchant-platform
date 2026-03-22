/*
  # Seed channel_payment_method_currency

  ## Summary
  Inserts 24 currency mappings for 12 channel payment methods (v2-cpm-01 through v2-cpm-12).

  ## Records Added
  - v2-cpm-01: HKD, USD
  - v2-cpm-02: HKD, USD
  - v2-cpm-03: PHP, USD
  - v2-cpm-04: PHP, USD
  - v2-cpm-05: USD, SGD
  - v2-cpm-06: SGD, HKD
  - v2-cpm-07: SGD, HKD
  - v2-cpm-08: SGD, HKD
  - v2-cpm-09: RMB, HKD
  - v2-cpm-10: RMB, HKD
  - v2-cpm-11: SGD, HKD
  - v2-cpm-12: SGD, HKD

  ## Validation
  - All channel_payment_method_id values confirmed to exist in channel_payment_methods
  - All currency_code values (HKD, USD, PHP, SGD, RMB) confirmed to exist in currencies
*/

INSERT INTO channel_payment_method_currency (id, channel_payment_method_id, currency_code) VALUES
(gen_random_uuid(), 'v2-cpm-01', 'HKD'),
(gen_random_uuid(), 'v2-cpm-01', 'USD'),
(gen_random_uuid(), 'v2-cpm-02', 'HKD'),
(gen_random_uuid(), 'v2-cpm-02', 'USD'),
(gen_random_uuid(), 'v2-cpm-03', 'PHP'),
(gen_random_uuid(), 'v2-cpm-03', 'USD'),
(gen_random_uuid(), 'v2-cpm-04', 'PHP'),
(gen_random_uuid(), 'v2-cpm-04', 'USD'),
(gen_random_uuid(), 'v2-cpm-05', 'USD'),
(gen_random_uuid(), 'v2-cpm-05', 'SGD'),
(gen_random_uuid(), 'v2-cpm-06', 'SGD'),
(gen_random_uuid(), 'v2-cpm-06', 'HKD'),
(gen_random_uuid(), 'v2-cpm-07', 'SGD'),
(gen_random_uuid(), 'v2-cpm-07', 'HKD'),
(gen_random_uuid(), 'v2-cpm-08', 'SGD'),
(gen_random_uuid(), 'v2-cpm-08', 'HKD'),
(gen_random_uuid(), 'v2-cpm-09', 'RMB'),
(gen_random_uuid(), 'v2-cpm-09', 'HKD'),
(gen_random_uuid(), 'v2-cpm-10', 'RMB'),
(gen_random_uuid(), 'v2-cpm-10', 'HKD'),
(gen_random_uuid(), 'v2-cpm-11', 'SGD'),
(gen_random_uuid(), 'v2-cpm-11', 'HKD'),
(gen_random_uuid(), 'v2-cpm-12', 'SGD'),
(gen_random_uuid(), 'v2-cpm-12', 'HKD');
