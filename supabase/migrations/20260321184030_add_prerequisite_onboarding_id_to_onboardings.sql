/*
  # Add prerequisite_onboarding_id to onboardings

  ## Summary
  Adds a self-referencing nullable FK column to track the required platform-level
  onboarding that must be APPROVED before a merchant-level onboarding can be submitted.

  ## Changes
  ### Modified Tables
  - `onboardings`
    - New column: `prerequisite_onboarding_id` (text, nullable)
    - FK references `onboardings.id`
    - NULL means no prerequisite required (i.e. the record itself is a platform-level onboarding)

  ## Notes
  1. Existing records are unaffected — all existing rows retain NULL for this column.
  2. No destructive operations performed.
  3. No RLS changes needed — this column inherits the table's existing policies.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboardings' AND column_name = 'prerequisite_onboarding_id'
  ) THEN
    ALTER TABLE onboardings
      ADD COLUMN prerequisite_onboarding_id text NULL
        REFERENCES onboardings(id);
  END IF;
END $$;
