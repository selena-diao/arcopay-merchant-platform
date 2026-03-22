/*
  # Add trigger: enforce platform onboarding prerequisite for merchant onboardings

  ## Summary
  A BEFORE INSERT OR UPDATE trigger that prevents creating or updating a
  merchant-level onboarding unless an APPROVED platform-level onboarding
  already exists for the same channel.

  ## Logic
  - A record is considered "merchant-level" when `merchant_entity_id IS NOT NULL`
    (and implicitly `moonton_entity_id IS NULL`).
  - The check resolves the channel via `channel_contracts`, then looks for any
    onboarding on that channel where `moonton_entity_id IS NOT NULL` (platform-level)
    and `status = 'APPROVED'`.
  - If not found, the statement is rolled back with a descriptive error message.

  ## Notes
  1. The trigger is BEFORE, so the entire statement rolls back atomically on failure.
  2. Existing rows are not affected (trigger only fires on new writes).
  3. Platform-level onboardings (merchant_entity_id IS NULL) pass through unchecked.
*/

CREATE OR REPLACE FUNCTION check_platform_onboarding_prerequisite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_channel_id text;
BEGIN
  IF NEW.merchant_entity_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cc.channel_id
    INTO v_channel_id
    FROM channel_contracts cc
   WHERE cc.id = NEW.channel_contract_id;

  IF NOT EXISTS (
    SELECT 1
      FROM onboardings ob
      JOIN channel_contracts cc ON cc.id = ob.channel_contract_id
     WHERE cc.channel_id = v_channel_id
       AND ob.moonton_entity_id IS NOT NULL
       AND ob.status = 'APPROVED'
  ) THEN
    RAISE EXCEPTION '该渠道尚未完成平台主体进件，无法提交商家进件';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_platform_onboarding_prerequisite ON onboardings;

CREATE TRIGGER trg_check_platform_onboarding_prerequisite
  BEFORE INSERT OR UPDATE ON onboardings
  FOR EACH ROW
  EXECUTE FUNCTION check_platform_onboarding_prerequisite();
