from tools import (
    get_settlement_record,
    get_transactions_in_period,
    get_channel_contract,
    recalculate_expected_amount
)

record_id = "c2ba4efb-6505-4395-92f9-e8290d8c5202"

print("=== 1. 结算记录 ===")
record = get_settlement_record(record_id)
print(record)

print("\n=== 2. 周期内交易 ===")
txns = get_transactions_in_period(
    record["channel_id"],
    record["period_start"],
    record["period_end"]
)
print(f"共{len(txns)}笔交易")
for t in txns:
    print(f"  {t['id']} | {t['status']} | {t['amount']} | 费率{t['channel_rate']}")

print("\n=== 3. 渠道合同 ===")
contract = get_channel_contract(record["channel_contract_id"])
print(f"合同费率: {contract['channel_rate']}, 结算周期: {contract['settlement_cycle']}天")

print("\n=== 4. 重算结果 ===")
calc = recalculate_expected_amount(txns, float(contract["channel_rate"]))
print(calc)
print(f"\n差异: expected={record['expected_amount']} actual={record['actual_amount']}")
