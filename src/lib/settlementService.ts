import { supabase } from './supabase';
import {
  ChannelSettlementRecord,
  MerchantSettlementRecord,
  SettlementRecordStatus,
  DisputeHistoryEntry,
} from '../types';

function mapChannelSettlementRecord(row: Record<string, unknown>): ChannelSettlementRecord {
  return {
    id: row.id as string,
    channel_contract_id: row.channel_contract_id as string,
    channel_id: row.channel_id as string,
    period_start: row.period_start as string,
    period_end: row.period_end as string,
    expected_amount: Number(row.expected_amount),
    actual_amount: row.actual_amount != null ? Number(row.actual_amount) : null,
    currency: row.currency as string,
    status: row.status as SettlementRecordStatus,
    settled_at: (row.settled_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    dispute_history: (row.dispute_history as DisputeHistoryEntry[]) ?? [],
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

function mapMerchantSettlementRecord(row: Record<string, unknown>): MerchantSettlementRecord {
  return {
    id: row.id as string,
    merchant_contract_id: row.merchant_contract_id as string,
    merchant_id: row.merchant_id as string,
    settlement_account_id: row.settlement_account_id as string,
    period_start: row.period_start as string,
    period_end: row.period_end as string,
    expected_amount: Number(row.expected_amount),
    actual_amount: row.actual_amount != null ? Number(row.actual_amount) : null,
    currency: row.currency as string,
    status: row.status as SettlementRecordStatus,
    settled_at: (row.settled_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    dispute_history: (row.dispute_history as DisputeHistoryEntry[]) ?? [],
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export async function fetchChannelSettlementRecords(): Promise<ChannelSettlementRecord[]> {
  const { data, error } = await supabase
    .from('channel_settlement_records')
    .select('*')
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapChannelSettlementRecord);
}

export async function fetchMerchantSettlementRecords(): Promise<MerchantSettlementRecord[]> {
  const { data, error } = await supabase
    .from('merchant_settlement_records')
    .select('*')
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMerchantSettlementRecord);
}

export async function createChannelSettlementRecord(
  record: Omit<ChannelSettlementRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<ChannelSettlementRecord> {
  const { data, error } = await supabase
    .from('channel_settlement_records')
    .insert({ ...record })
    .select()
    .single();
  if (error) throw error;
  return mapChannelSettlementRecord(data);
}

export async function createMerchantSettlementRecord(
  record: Omit<MerchantSettlementRecord, 'id' | 'created_at' | 'updated_at'>
): Promise<MerchantSettlementRecord> {
  const { data, error } = await supabase
    .from('merchant_settlement_records')
    .insert({ ...record })
    .select()
    .single();
  if (error) throw error;
  return mapMerchantSettlementRecord(data);
}

export async function transitionChannelSettlementStatus(
  id: string,
  newStatus: SettlementRecordStatus,
  opts?: { actual_amount?: number; settled_at?: string; notes?: string; operator?: string }
): Promise<ChannelSettlementRecord> {
  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'SETTLED') {
    if (opts?.actual_amount != null) updates.actual_amount = opts.actual_amount;
    if (opts?.settled_at) updates.settled_at = opts.settled_at;
  }

  if (opts?.notes) updates.notes = opts.notes;

  if (newStatus === 'DISPUTED' && opts?.notes) {
    const { data: current } = await supabase
      .from('channel_settlement_records')
      .select('dispute_history')
      .eq('id', id)
      .maybeSingle();

    const existing: DisputeHistoryEntry[] = (current?.dispute_history as DisputeHistoryEntry[]) ?? [];
    const entry: DisputeHistoryEntry = {
      time: new Date().toISOString(),
      operator: opts.operator ?? 'ops-admin',
      note: opts.notes,
    };
    updates.dispute_history = [...existing, entry];
  }

  const { data, error } = await supabase
    .from('channel_settlement_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapChannelSettlementRecord(data);
}

export async function transitionMerchantSettlementStatus(
  id: string,
  newStatus: SettlementRecordStatus,
  opts?: { actual_amount?: number; settled_at?: string; notes?: string; operator?: string }
): Promise<MerchantSettlementRecord> {
  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'SETTLED') {
    if (opts?.actual_amount != null) updates.actual_amount = opts.actual_amount;
    if (opts?.settled_at) updates.settled_at = opts.settled_at;
  }

  if (opts?.notes) updates.notes = opts.notes;

  if (newStatus === 'DISPUTED' && opts?.notes) {
    const { data: current } = await supabase
      .from('merchant_settlement_records')
      .select('dispute_history')
      .eq('id', id)
      .maybeSingle();

    const existing: DisputeHistoryEntry[] = (current?.dispute_history as DisputeHistoryEntry[]) ?? [];
    const entry: DisputeHistoryEntry = {
      time: new Date().toISOString(),
      operator: opts.operator ?? 'ops-admin',
      note: opts.notes,
    };
    updates.dispute_history = [...existing, entry];
  }

  const { data, error } = await supabase
    .from('merchant_settlement_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapMerchantSettlementRecord(data);
}

export async function confirmSettlement(
  table: 'channel' | 'merchant',
  id: string,
  actualAmount: number,
  notes?: string
): Promise<ChannelSettlementRecord | MerchantSettlementRecord> {
  const tableName = table === 'channel' ? 'channel_settlement_records' : 'merchant_settlement_records';
  const today = new Date().toISOString().slice(0, 10);
  const updates: Record<string, unknown> = {
    status: 'SETTLED',
    actual_amount: actualAmount,
    settled_at: today,
  };
  if (notes?.trim()) updates.notes = notes.trim();

  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return table === 'channel' ? mapChannelSettlementRecord(data) : mapMerchantSettlementRecord(data);
}

export async function markDisputed(
  table: 'channel' | 'merchant',
  id: string,
  reason: string,
  operator = 'ops-admin'
): Promise<ChannelSettlementRecord | MerchantSettlementRecord> {
  const tableName = table === 'channel' ? 'channel_settlement_records' : 'merchant_settlement_records';

  const { data: current } = await supabase
    .from(tableName)
    .select('dispute_history, actual_amount')
    .eq('id', id)
    .maybeSingle();

  const existing: DisputeHistoryEntry[] = (current?.dispute_history as DisputeHistoryEntry[]) ?? [];
  const claimedAmount = current?.actual_amount != null ? Number(current.actual_amount) : undefined;
  const entry: DisputeHistoryEntry = {
    time: new Date().toISOString(),
    operator,
    reason,
    ...(claimedAmount != null ? { claimed_amount: claimedAmount } : {}),
  };

  const { data, error } = await supabase
    .from(tableName)
    .update({
      status: 'DISPUTED',
      dispute_history: [...existing, entry],
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return table === 'channel' ? mapChannelSettlementRecord(data) : mapMerchantSettlementRecord(data);
}

export async function startReconciliation(
  table: 'channel' | 'merchant',
  id: string,
  actualAmount: number,
  notes?: string
): Promise<ChannelSettlementRecord | MerchantSettlementRecord> {
  const tableName = table === 'channel' ? 'channel_settlement_records' : 'merchant_settlement_records';
  const updates: Record<string, unknown> = {
    status: 'IN_RECONCILIATION',
    actual_amount: actualAmount,
  };
  if (notes?.trim()) updates.notes = notes.trim();

  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return table === 'channel' ? mapChannelSettlementRecord(data) : mapMerchantSettlementRecord(data);
}

export async function reReconcile(
  table: 'channel' | 'merchant',
  id: string
): Promise<ChannelSettlementRecord | MerchantSettlementRecord> {
  const tableName = table === 'channel' ? 'channel_settlement_records' : 'merchant_settlement_records';
  const { data, error } = await supabase
    .from(tableName)
    .update({ status: 'IN_RECONCILIATION' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return table === 'channel' ? mapChannelSettlementRecord(data) : mapMerchantSettlementRecord(data);
}

export async function calculateExpectedAmount(
  channelContractId: string,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  const { data: accounts, error: acctErr } = await supabase
    .from('merchant_accounts')
    .select('id')
    .eq('channel_contract_id', channelContractId);
  if (acctErr) throw acctErr;

  if (!accounts || accounts.length === 0) return 0;

  const accountIds = accounts.map((a) => a.id as string);

  const { data: txns, error: txnErr } = await supabase
    .from('transactions')
    .select('amount')
    .in('merchant_account_id', accountIds)
    .eq('status', 'SUCCESS')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z');
  if (txnErr) throw txnErr;

  return (txns ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
}

export async function calculateMerchantExpectedAmount(
  merchantContractId: string,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  const { data: contract, error: contractErr } = await supabase
    .from('merchant_contracts')
    .select('merchant_id')
    .eq('id', merchantContractId)
    .maybeSingle();
  if (contractErr) throw contractErr;
  if (!contract) return 0;

  const { data: channelContracts, error: ccErr } = await supabase
    .from('channel_contracts')
    .select('id');
  if (ccErr) throw ccErr;

  const ccIds = (channelContracts ?? []).map((c) => c.id as string);
  if (ccIds.length === 0) return 0;

  const { data: accounts, error: acctErr } = await supabase
    .from('merchant_accounts')
    .select('id')
    .in('channel_contract_id', ccIds);
  if (acctErr) throw acctErr;

  const accountIds = (accounts ?? []).map((a) => a.id as string);
  if (accountIds.length === 0) return 0;

  const { data: txns, error: txnErr } = await supabase
    .from('transactions')
    .select('amount')
    .in('merchant_account_id', accountIds)
    .eq('status', 'SUCCESS')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z');
  if (txnErr) throw txnErr;

  return (txns ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
}

export async function appendDisputeNote(
  table: 'channel' | 'merchant',
  id: string,
  note: string,
  operator = 'ops-admin'
): Promise<ChannelSettlementRecord | MerchantSettlementRecord> {
  const tableName = table === 'channel' ? 'channel_settlement_records' : 'merchant_settlement_records';

  const { data: current } = await supabase
    .from(tableName)
    .select('dispute_history')
    .eq('id', id)
    .maybeSingle();

  const existing: DisputeHistoryEntry[] = (current?.dispute_history as DisputeHistoryEntry[]) ?? [];
  const entry: DisputeHistoryEntry = {
    time: new Date().toISOString(),
    operator,
    note,
  };

  const { data, error } = await supabase
    .from(tableName)
    .update({ dispute_history: [...existing, entry] })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  return table === 'channel'
    ? mapChannelSettlementRecord(data)
    : mapMerchantSettlementRecord(data);
}
