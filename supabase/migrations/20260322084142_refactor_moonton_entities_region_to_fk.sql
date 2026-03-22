/*
  # Refactor moonton_entities.region to FK on countries

  ## Summary
  Replaces the hardcoded CHECK constraint on moonton_entities.region with a
  proper foreign key reference to the countries table. This makes the valid
  region list dynamic and driven by the countries table instead of hard-coded
  enum values.

  ## Changes

  ### moonton_entities
  - Drop existing CHECK constraint (region IN ('CN_MAINLAND','HK','SG','OTHER'))
  - Migrate data: map 'CN_MAINLAND' -> 'CN' (China ISO code already in countries)
  - Add FK constraint: region REFERENCES countries(code)
  - NULL values are preserved (region remains nullable)

  ## Data Migration
  - 'HK' stays 'HK' (already a valid countries.code)
  - 'SG' stays 'SG' (already a valid countries.code)
  - 'CN_MAINLAND' -> 'CN' (maps to China, code 'CN' exists in countries)
  - NULL stays NULL (no FK violation for nullable FK columns)

  ## Notes
  - No data is deleted; all existing rows are preserved
  - The 'OTHER' value had zero rows so no migration needed for it
*/

-- Step 1: Drop the CHECK constraint
ALTER TABLE moonton_entities
  DROP CONSTRAINT IF EXISTS moonton_entities_region_check;

-- Step 2: Migrate CN_MAINLAND -> CN
UPDATE moonton_entities
  SET region = 'CN'
  WHERE region = 'CN_MAINLAND';

-- Step 3: Add FK constraint referencing countries(code)
ALTER TABLE moonton_entities
  ADD CONSTRAINT moonton_entities_region_fkey
  FOREIGN KEY (region) REFERENCES countries(code)
  ON UPDATE CASCADE ON DELETE SET NULL;
