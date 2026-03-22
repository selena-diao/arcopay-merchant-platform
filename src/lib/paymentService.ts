import { supabase } from './supabase';
import { PaymentMethod, SettlementAccount, AppPaymentConfig } from '../types';

// ─── Payment Methods ────────────────────────────────────────────────────────

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type as PaymentMethod['type'],
    status: row.status as PaymentMethod['status'],
  }));
}

export async function updatePaymentMethodStatus(
  id: string,
  status: PaymentMethod['status']
): Promise<void> {
  const { error } = await supabase
    .from('payment_methods')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ─── Settlement Accounts ───────────────────────────────────────────────────

export async function fetchSettlementAccounts(): Promise<SettlementAccount[]> {
  const { data, error } = await supabase
    .from('settlement_accounts')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    merchant_id: row.merchant_id,
    account_name: row.account_name,
    bank_info: row.bank_info,
    status: row.status as SettlementAccount['status'],
  }));
}

export async function createSettlementAccount(
  data: Omit<SettlementAccount, 'id'>
): Promise<SettlementAccount> {
  const id = `sa-${crypto.randomUUID()}`;
  const { data: row, error } = await supabase
    .from('settlement_accounts')
    .insert({ id, ...data })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    merchant_id: row.merchant_id,
    account_name: row.account_name,
    bank_info: row.bank_info,
    status: row.status as SettlementAccount['status'],
  };
}

export async function updateSettlementAccount(
  id: string,
  data: Omit<SettlementAccount, 'id' | 'merchant_id'>
): Promise<void> {
  const { error } = await supabase
    .from('settlement_accounts')
    .update(data)
    .eq('id', id);
  if (error) throw error;
}

// ─── App Payment Configs ────────────────────────────────────────────────────

export async function fetchAppPaymentConfigs(): Promise<AppPaymentConfig[]> {
  const { data, error } = await supabase
    .from('app_payment_configs')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    app_id: row.app_id,
    merchant_contract_id: (row.merchant_contract_id as string | null) ?? null,
    payment_method_id: row.payment_method_id,
    settlement_account_id: row.settlement_account_id,
    quoted_rate: Number(row.quoted_rate),
    status: row.status as AppPaymentConfig['status'],
  }));
}

async function resolveQuotedRate(
  merchantContractId: string | null | undefined,
  paymentMethodId: string
): Promise<number> {
  if (!merchantContractId) return 0;
  const { data, error } = await supabase
    .from('contract_payment_methods')
    .select('quoted_rate')
    .eq('merchant_contract_id', merchantContractId)
    .eq('payment_method_id', paymentMethodId)
    .maybeSingle();
  if (error || !data) return 0;
  return Number(data.quoted_rate) / 100;
}

export async function createAppPaymentConfig(
  data: Omit<AppPaymentConfig, 'id'>
): Promise<AppPaymentConfig> {
  const id = `apc-${crypto.randomUUID()}`;
  const quoted_rate = await resolveQuotedRate(data.merchant_contract_id, data.payment_method_id);
  const { data: row, error } = await supabase
    .from('app_payment_configs')
    .insert({ id, ...data, quoted_rate })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    app_id: row.app_id,
    merchant_contract_id: (row.merchant_contract_id as string | null) ?? null,
    payment_method_id: row.payment_method_id,
    settlement_account_id: row.settlement_account_id,
    quoted_rate: Number(row.quoted_rate),
    status: row.status as AppPaymentConfig['status'],
  };
}

export async function updateAppPaymentConfig(
  id: string,
  data: Partial<Omit<AppPaymentConfig, 'id'>>
): Promise<void> {
  const patch: Partial<Omit<AppPaymentConfig, 'id'>> = { ...data };
  if (data.merchant_contract_id !== undefined && data.payment_method_id !== undefined) {
    patch.quoted_rate = await resolveQuotedRate(data.merchant_contract_id, data.payment_method_id);
  }
  const { error } = await supabase
    .from('app_payment_configs')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
}
