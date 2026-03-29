from supabase import create_client
from dotenv import load_dotenv
import os
import time

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_ANON_KEY")
)

def safe_execute(query, retries=3, delay=1):
    """带重试的查询执行，避免并发连接问题"""
    for i in range(retries):
        try:
            return query.execute()
        except Exception as e:
            if i == retries - 1:
                raise
            time.sleep(delay)

def get_settlement_record(record_id: str) -> dict:
    result = safe_execute(
        supabase.table("channel_settlement_records")
        .select("*")
        .eq("id", record_id)
        .single()
    )
    return result.data

def get_transactions_in_period(channel_id: str, period_start: str, period_end: str, channel_contract_id: str = None) -> list:
    query = supabase.table("merchant_accounts").select("id").eq("channel_id", channel_id)
    if channel_contract_id:
        query = query.eq("channel_contract_id", channel_contract_id)
    merchant_accounts = safe_execute(query)
    ma_ids = [ma["id"] for ma in merchant_accounts.data]
    if not ma_ids:
        return []
    result = safe_execute(
        supabase.table("transactions")
        .select("*")
        .in_("merchant_account_id", ma_ids)
        .gte("created_at", period_start)
        .lte("created_at", period_end)
    )
    return result.data

def get_channel_contract(channel_contract_id: str) -> dict:
    result = safe_execute(
        supabase.table("channel_contracts")
        .select("*")
        .eq("id", channel_contract_id)
        .single()
    )
    return result.data

def recalculate_expected_amount(transactions: list, channel_rate: float) -> dict:
    success_txns = [t for t in transactions if t["status"] == "SUCCESS"]
    refunded_txns = [t for t in transactions if t["status"] == "REFUNDED"]
    success_total = sum(t["amount"] for t in success_txns)
    refunded_total = sum(t["amount"] for t in refunded_txns)
    recalculated = success_total * (1 - channel_rate)
    return {
        "success_count": len(success_txns),
        "success_total": success_total,
        "refunded_count": len(refunded_txns),
        "refunded_total": refunded_total,
        "recalculated_expected": recalculated,
        "channel_rates_in_txns": list(set(t["channel_rate"] for t in success_txns))
    }
