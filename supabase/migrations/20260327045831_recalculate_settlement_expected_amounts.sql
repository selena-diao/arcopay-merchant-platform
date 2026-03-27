
/*
  # Recalculate expected_amount for merchant and channel settlement records

  ## Summary
  Recalculates expected_amount for all settlement records to be mathematically
  consistent with actual transactions in each period.

  ## Formulas
  - merchant_settlement_records:
      expected_amount = SUM(amount WHERE status='SUCCESS') × (1 - AVG(quoted_rate))
      Join path: merchant_settlement_records → merchant_entities → onboardings → merchant_accounts → transactions

  - channel_settlement_records:
      expected_amount = SUM(amount WHERE status='SUCCESS') × (1 - AVG(channel_rate))
      Join path: channel_settlement_records → merchant_accounts (channel_id) → transactions

  ## Notes
  - Only SUCCESS transactions are counted; FAILED and REFUNDED are excluded
  - Records with no matching transactions are set to 0
  - Both tables updated in a single migration for atomicity
*/

UPDATE merchant_settlement_records msr
SET expected_amount = sub.new_expected_amount
FROM (
  SELECT
    msr2.id,
    ROUND(
      COALESCE(
        SUM(t.amount) FILTER (WHERE t.status = 'SUCCESS')
        * (1 - AVG(t.quoted_rate) FILTER (WHERE t.status = 'SUCCESS')),
        0
      )::numeric,
      4
    ) AS new_expected_amount
  FROM merchant_settlement_records msr2
  LEFT JOIN merchant_entities me ON me.merchant_id = msr2.merchant_id
  LEFT JOIN onboardings o ON o.merchant_entity_id = me.id
  LEFT JOIN merchant_accounts ma ON ma.onboarding_id = o.id
  LEFT JOIN transactions t
    ON t.merchant_account_id = ma.id
    AND t.created_at >= msr2.period_start::timestamptz
    AND t.created_at <= (msr2.period_end::date + interval '1 day - 1 second')
  GROUP BY msr2.id
) sub
WHERE msr.id = sub.id;

UPDATE channel_settlement_records csr
SET expected_amount = sub.new_expected_amount
FROM (
  SELECT
    csr2.id,
    ROUND(
      COALESCE(
        SUM(t.amount) FILTER (WHERE t.status = 'SUCCESS')
        * (1 - AVG(t.channel_rate) FILTER (WHERE t.status = 'SUCCESS')),
        0
      )::numeric,
      4
    ) AS new_expected_amount
  FROM channel_settlement_records csr2
  LEFT JOIN merchant_accounts ma ON ma.channel_id = csr2.channel_id
  LEFT JOIN transactions t
    ON t.merchant_account_id = ma.id
    AND t.created_at >= csr2.period_start::timestamptz
    AND t.created_at <= (csr2.period_end::date + interval '1 day - 1 second')
  GROUP BY csr2.id
) sub
WHERE csr.id = sub.id;
