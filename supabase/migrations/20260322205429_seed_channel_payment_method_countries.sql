/*
  # Seed channel_payment_method_country

  ## Summary
  Inserts 43 country mappings for 12 channel payment methods (v2-cpm-01 through v2-cpm-12).

  ## Records Added
  - v2-cpm-01: PH, MY, SG, HK
  - v2-cpm-02: PH, MY, SG, HK
  - v2-cpm-03: PH, ID, MY, TH, SG
  - v2-cpm-04: PH, ID, MY, TH, SG
  - v2-cpm-05: PH, ID, MY, TH, SG
  - v2-cpm-06: SG, HK, TH, MY
  - v2-cpm-07: SG, HK, TH
  - v2-cpm-08: SG, HK, TH
  - v2-cpm-09: CN, HK, SG
  - v2-cpm-10: CN, HK, SG
  - v2-cpm-11: SG, HK
  - v2-cpm-12: SG, HK

  ## Validation
  - All channel_payment_method_id values confirmed to exist in channel_payment_methods
  - All country_code values (PH, MY, SG, HK, ID, TH, CN) confirmed to exist in countries
  - No pre-existing records for these CPM IDs in channel_payment_method_country
*/

INSERT INTO channel_payment_method_country (id, channel_payment_method_id, country_code) VALUES
(gen_random_uuid(), 'v2-cpm-01', 'PH'),
(gen_random_uuid(), 'v2-cpm-01', 'MY'),
(gen_random_uuid(), 'v2-cpm-01', 'SG'),
(gen_random_uuid(), 'v2-cpm-01', 'HK'),
(gen_random_uuid(), 'v2-cpm-02', 'PH'),
(gen_random_uuid(), 'v2-cpm-02', 'MY'),
(gen_random_uuid(), 'v2-cpm-02', 'SG'),
(gen_random_uuid(), 'v2-cpm-02', 'HK'),
(gen_random_uuid(), 'v2-cpm-03', 'PH'),
(gen_random_uuid(), 'v2-cpm-03', 'ID'),
(gen_random_uuid(), 'v2-cpm-03', 'MY'),
(gen_random_uuid(), 'v2-cpm-03', 'TH'),
(gen_random_uuid(), 'v2-cpm-03', 'SG'),
(gen_random_uuid(), 'v2-cpm-04', 'PH'),
(gen_random_uuid(), 'v2-cpm-04', 'ID'),
(gen_random_uuid(), 'v2-cpm-04', 'MY'),
(gen_random_uuid(), 'v2-cpm-04', 'TH'),
(gen_random_uuid(), 'v2-cpm-04', 'SG'),
(gen_random_uuid(), 'v2-cpm-05', 'PH'),
(gen_random_uuid(), 'v2-cpm-05', 'ID'),
(gen_random_uuid(), 'v2-cpm-05', 'MY'),
(gen_random_uuid(), 'v2-cpm-05', 'TH'),
(gen_random_uuid(), 'v2-cpm-05', 'SG'),
(gen_random_uuid(), 'v2-cpm-06', 'SG'),
(gen_random_uuid(), 'v2-cpm-06', 'HK'),
(gen_random_uuid(), 'v2-cpm-06', 'TH'),
(gen_random_uuid(), 'v2-cpm-06', 'MY'),
(gen_random_uuid(), 'v2-cpm-07', 'SG'),
(gen_random_uuid(), 'v2-cpm-07', 'HK'),
(gen_random_uuid(), 'v2-cpm-07', 'TH'),
(gen_random_uuid(), 'v2-cpm-08', 'SG'),
(gen_random_uuid(), 'v2-cpm-08', 'HK'),
(gen_random_uuid(), 'v2-cpm-08', 'TH'),
(gen_random_uuid(), 'v2-cpm-09', 'CN'),
(gen_random_uuid(), 'v2-cpm-09', 'HK'),
(gen_random_uuid(), 'v2-cpm-09', 'SG'),
(gen_random_uuid(), 'v2-cpm-10', 'CN'),
(gen_random_uuid(), 'v2-cpm-10', 'HK'),
(gen_random_uuid(), 'v2-cpm-10', 'SG'),
(gen_random_uuid(), 'v2-cpm-11', 'SG'),
(gen_random_uuid(), 'v2-cpm-11', 'HK'),
(gen_random_uuid(), 'v2-cpm-12', 'SG'),
(gen_random_uuid(), 'v2-cpm-12', 'HK');
