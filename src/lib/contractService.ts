import { supabase } from './supabase';
import { ChannelContract, ContractPaymentMethod, MerchantContract, Onboarding, MerchantAccount } from '../types';

function mapChannelContract(row: Record<string, unknown>): ChannelContract {
  return {
    id: row.id as string,
    moonton_entity_id: row.moonton_entity_id as string,
    channel_id: row.channel_id as string,
    merchant_mode: row.merchant_mode as 'MOR' | 'SOR',
    channel_rate: Number(row.channel_rate),
    settlement_cycle: Number(row.settlement_cycle),
    currency: (row.currency as string) || 'USD',
    status: row.status as ChannelContract['status'],
    signed_at: row.signed_at as string,
    termination_reason: row.termination_reason as string | undefined,
    void_reason: row.void_reason as string | undefined,
  };
}

function mapMerchantContract(row: Record<string, unknown>): MerchantContract {
  return {
    id: row.id as string,
    moonton_entity_id: row.moonton_entity_id as string,
    merchant_id: row.merchant_id as string,
    quoted_rate: Number(row.quoted_rate),
    settlement_cycle: Number(row.settlement_cycle),
    currency: (row.currency as string) || 'USD',
    status: row.status as MerchantContract['status'],
    signed_at: row.signed_at as string,
    terminated_reason: row.terminated_reason as string | undefined,
    void_reason: row.void_reason as string | undefined,
  };
}

function mapOnboarding(row: Record<string, unknown>): Onboarding {
  return {
    id: row.id as string,
    channel_contract_id: row.channel_contract_id as string,
    moonton_entity_id: row.moonton_entity_id as string | null,
    merchant_entity_id: row.merchant_entity_id as string | null,
    status: row.status as Onboarding['status'],
    submitted_at: row.submitted_at as string | null,
    approved_at: row.approved_at as string | null,
    rejected_reason: row.rejected_reason as string | null,
    merchant_account_id: row.merchant_account_id as string | null,
    prerequisite_onboarding_id: row.prerequisite_onboarding_id as string | null,
  };
}

function mapMerchantAccount(row: Record<string, unknown>): MerchantAccount {
  return {
    id: row.id as string,
    channel_id: row.channel_id as string,
    channel_contract_id: row.channel_contract_id as string,
    onboarding_id: row.onboarding_id as string,
    api_key: row.api_key as string,
    secret_key: row.secret_key as string,
    mode: row.mode as 'LIVE' | 'SANDBOX',
    status: (row.status === 'SUSPENDED' ? 'INACTIVE' : row.status) as MerchantAccount['status'],
    created_at: row.created_at as string,
  };
}

export async function fetchChannelContracts(): Promise<ChannelContract[]> {
  const { data, error } = await supabase.from('channel_contracts').select('*').order('signed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapChannelContract);
}

export async function fetchMerchantContracts(): Promise<MerchantContract[]> {
  const { data, error } = await supabase.from('merchant_contracts').select('*').order('signed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMerchantContract);
}

export async function fetchContractPaymentMethods(): Promise<ContractPaymentMethod[]> {
  const { data, error } = await supabase.from('contract_payment_methods').select('*');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    merchant_contract_id: row.merchant_contract_id as string,
    payment_method_id: row.payment_method_id as string,
    quoted_rate: Number(row.quoted_rate),
    status: row.status as ContractPaymentMethod['status'],
  }));
}

export async function insertContractPaymentMethod(cpm: Omit<ContractPaymentMethod, 'id'>): Promise<ContractPaymentMethod> {
  const { data, error } = await supabase
    .from('contract_payment_methods')
    .insert({
      merchant_contract_id: cpm.merchant_contract_id,
      payment_method_id: cpm.payment_method_id,
      quoted_rate: cpm.quoted_rate,
      status: cpm.status,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    merchant_contract_id: data.merchant_contract_id,
    payment_method_id: data.payment_method_id,
    quoted_rate: Number(data.quoted_rate),
    status: data.status as ContractPaymentMethod['status'],
  };
}

export async function upsertContractPaymentMethod(cpm: ContractPaymentMethod): Promise<ContractPaymentMethod> {
  const { data, error } = await supabase
    .from('contract_payment_methods')
    .upsert({
      id: cpm.id,
      merchant_contract_id: cpm.merchant_contract_id,
      payment_method_id: cpm.payment_method_id,
      quoted_rate: cpm.quoted_rate,
      status: cpm.status,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    merchant_contract_id: data.merchant_contract_id,
    payment_method_id: data.payment_method_id,
    quoted_rate: Number(data.quoted_rate),
    status: data.status as ContractPaymentMethod['status'],
  };
}

export async function fetchOnboardings(): Promise<Onboarding[]> {
  const { data, error } = await supabase.from('onboardings').select('*');
  if (error) throw error;
  return (data ?? []).map(mapOnboarding);
}

export async function insertOnboarding(onboarding: Omit<Onboarding, 'id'>): Promise<Onboarding> {
  const { data, error } = await supabase
    .from('onboardings')
    .insert({
      channel_contract_id: onboarding.channel_contract_id,
      moonton_entity_id: onboarding.moonton_entity_id ?? null,
      merchant_entity_id: onboarding.merchant_entity_id ?? null,
      status: onboarding.status,
      submitted_at: onboarding.submitted_at ?? null,
      approved_at: onboarding.approved_at ?? null,
      rejected_reason: onboarding.rejected_reason ?? null,
      merchant_account_id: onboarding.merchant_account_id ?? null,
      prerequisite_onboarding_id: onboarding.prerequisite_onboarding_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapOnboarding(data);
}

export async function updateOnboarding(id: string, patch: Partial<Omit<Onboarding, 'id'>>): Promise<Onboarding> {
  const { data, error } = await supabase
    .from('onboardings')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapOnboarding(data);
}

export async function fetchMerchantAccounts(): Promise<MerchantAccount[]> {
  const { data, error } = await supabase.from('merchant_accounts').select('*');
  if (error) throw error;
  return (data ?? []).map(mapMerchantAccount);
}

export async function createMerchantAccount(
  account: Omit<MerchantAccount, 'id'>
): Promise<MerchantAccount> {
  const { data, error } = await supabase
    .from('merchant_accounts')
    .insert({
      channel_id: account.channel_id,
      channel_contract_id: account.channel_contract_id,
      onboarding_id: account.onboarding_id,
      api_key: account.api_key,
      secret_key: account.secret_key,
      mode: account.mode,
      status: account.status,
      created_at: account.created_at,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMerchantAccount(data);
}

export async function activateChannelContract(id: string): Promise<ChannelContract> {
  const { data, error } = await supabase
    .from('channel_contracts')
    .update({ status: 'ACTIVE' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapChannelContract(data);
}

export async function terminateChannelContract(id: string, reason: string): Promise<ChannelContract> {
  const { data, error } = await supabase
    .from('channel_contracts')
    .update({ status: 'TERMINATED', termination_reason: reason })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapChannelContract(data);
}

export async function voidChannelContract(
  id: string,
  cascade: boolean
): Promise<{ contract: ChannelContract; onboardings: Onboarding[]; merchantAccounts: MerchantAccount[] }> {
  const { data: contractData, error: contractError } = await supabase
    .from('channel_contracts')
    .update({ status: 'VOIDED' })
    .eq('id', id)
    .select()
    .single();
  if (contractError) throw contractError;

  let updatedOnboardings: Onboarding[] = [];
  let updatedAccounts: MerchantAccount[] = [];

  if (cascade) {
    const { data: onboardingRows, error: obFetchError } = await supabase
      .from('onboardings')
      .select('*')
      .eq('channel_contract_id', id);
    if (obFetchError) throw obFetchError;

    const toVoid = (onboardingRows ?? []).filter((ob) =>
      ['DRAFT', 'SUBMITTED', 'REVIEWING'].includes(ob.status)
    );
    const toSuspend = (onboardingRows ?? []).filter((ob) => ob.status === 'APPROVED');

    if (toVoid.length > 0) {
      const { data: voidedObs, error: voidObError } = await supabase
        .from('onboardings')
        .update({ status: 'VOIDED' })
        .in('id', toVoid.map((o) => o.id))
        .select();
      if (voidObError) throw voidObError;
      updatedOnboardings.push(...(voidedObs ?? []).map(mapOnboarding));
    }

    if (toSuspend.length > 0) {
      const { data: suspendedObs, error: suspendObError } = await supabase
        .from('onboardings')
        .update({ status: 'SUSPENDED' })
        .in('id', toSuspend.map((o) => o.id))
        .select();
      if (suspendObError) throw suspendObError;
      updatedOnboardings.push(...(suspendedObs ?? []).map(mapOnboarding));

      const accountIds = toSuspend
        .map((o) => o.merchant_account_id)
        .filter((id): id is string => id != null);

      if (accountIds.length > 0) {
        const { data: suspendedAccounts, error: acctError } = await supabase
          .from('merchant_accounts')
          .update({ status: 'SUSPENDED' })
          .in('id', accountIds)
          .select();
        if (acctError) throw acctError;
        updatedAccounts.push(...(suspendedAccounts ?? []).map(mapMerchantAccount));
      }
    }
  }

  return {
    contract: mapChannelContract(contractData),
    onboardings: updatedOnboardings,
    merchantAccounts: updatedAccounts,
  };
}

export async function activateMerchantContract(id: string): Promise<MerchantContract> {
  const { data, error } = await supabase
    .from('merchant_contracts')
    .update({ status: 'ACTIVE' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapMerchantContract(data);
}

export async function terminateMerchantContract(id: string, reason: string): Promise<MerchantContract> {
  const { data, error } = await supabase
    .from('merchant_contracts')
    .update({ status: 'TERMINATED', terminated_reason: reason })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapMerchantContract(data);
}

export async function voidMerchantContract(id: string): Promise<MerchantContract> {
  const { data, error } = await supabase
    .from('merchant_contracts')
    .update({ status: 'VOIDED' })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapMerchantContract(data);
}

export async function deleteChannelContract(id: string): Promise<void> {
  const { error } = await supabase.from('channel_contracts').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteMerchantContract(id: string): Promise<void> {
  const { error } = await supabase.from('merchant_contracts').delete().eq('id', id);
  if (error) throw error;
}

export async function insertChannelContract(contract: Omit<ChannelContract, 'id'>): Promise<ChannelContract> {
  const { data, error } = await supabase
    .from('channel_contracts')
    .insert({
      moonton_entity_id: contract.moonton_entity_id,
      channel_id: contract.channel_id,
      merchant_mode: contract.merchant_mode,
      channel_rate: contract.channel_rate,
      settlement_cycle: contract.settlement_cycle,
      currency: contract.currency,
      status: contract.status,
      signed_at: contract.signed_at,
      termination_reason: contract.termination_reason ?? null,
      void_reason: contract.void_reason ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapChannelContract(data);
}

export async function upsertChannelContract(contract: ChannelContract): Promise<ChannelContract> {
  const { data, error } = await supabase
    .from('channel_contracts')
    .upsert({
      id: contract.id,
      moonton_entity_id: contract.moonton_entity_id,
      channel_id: contract.channel_id,
      merchant_mode: contract.merchant_mode,
      channel_rate: contract.channel_rate,
      settlement_cycle: contract.settlement_cycle,
      currency: contract.currency,
      status: contract.status,
      signed_at: contract.signed_at,
      termination_reason: contract.termination_reason ?? null,
      void_reason: contract.void_reason ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapChannelContract(data);
}

export async function insertMerchantContract(contract: Omit<MerchantContract, 'id'>): Promise<MerchantContract> {
  const { data, error } = await supabase
    .from('merchant_contracts')
    .insert({
      moonton_entity_id: contract.moonton_entity_id,
      merchant_id: contract.merchant_id,
      quoted_rate: contract.quoted_rate,
      settlement_cycle: contract.settlement_cycle,
      currency: contract.currency,
      status: contract.status,
      signed_at: contract.signed_at,
      terminated_reason: contract.terminated_reason ?? null,
      void_reason: contract.void_reason ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMerchantContract(data);
}

export async function upsertMerchantContract(contract: MerchantContract): Promise<MerchantContract> {
  const { data, error } = await supabase
    .from('merchant_contracts')
    .upsert({
      id: contract.id,
      moonton_entity_id: contract.moonton_entity_id,
      merchant_id: contract.merchant_id,
      quoted_rate: contract.quoted_rate,
      settlement_cycle: contract.settlement_cycle,
      currency: contract.currency,
      status: contract.status,
      signed_at: contract.signed_at,
      terminated_reason: contract.terminated_reason ?? null,
      void_reason: contract.void_reason ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapMerchantContract(data);
}
