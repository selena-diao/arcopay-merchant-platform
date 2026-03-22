/*
  # Sync merchant_account status from onboarding status

  ## Summary
  Creates a trigger that automatically keeps merchant_account.status in sync
  whenever the linked onboarding record's status changes.

  ## Trigger Logic
  - onboarding.status → APPROVED   : merchant_account.status = 'ACTIVE'
  - onboarding.status → VOIDED     : merchant_account.status = 'SUSPENDED'
  - onboarding.status → SUSPENDED  : merchant_account.status = 'SUSPENDED'
  - Any other status change         : no action

  ## Linkage
  Uses merchant_accounts.onboarding_id FK to find the affected row.
  Only updates rows where onboarding_id = NEW.id.

  ## Data Fix
  Updates ma-3 to ACTIVE because its linked onboarding (ob-3) is already APPROVED.

  ## Notes
  - Trigger fires AFTER UPDATE on onboardings, only when status actually changes
  - Atomic: runs within the same transaction as the onboarding update
  - No schema changes
*/

CREATE OR REPLACE FUNCTION sync_merchant_account_status_from_onboarding()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'APPROVED' THEN
    UPDATE merchant_accounts
    SET status = 'ACTIVE'
    WHERE onboarding_id = NEW.id;

  ELSIF NEW.status IN ('VOIDED', 'SUSPENDED') THEN
    UPDATE merchant_accounts
    SET status = 'SUSPENDED'
    WHERE onboarding_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_merchant_account_status ON onboardings;

CREATE TRIGGER trg_sync_merchant_account_status
  AFTER UPDATE OF status ON onboardings
  FOR EACH ROW
  EXECUTE FUNCTION sync_merchant_account_status_from_onboarding();

-- Fix existing stale data: ma-3 should be ACTIVE (ob-3 is APPROVED)
UPDATE merchant_accounts
SET status = 'ACTIVE'
WHERE id = 'ma-3' AND status != 'ACTIVE';
