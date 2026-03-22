import { supabase } from './supabase';
import { Merchant, MerchantEntity, Application, MerchantKYBRecord, KYBRecordBase } from '../types';

// ─── Merchants ───────────────────────────────────────────────────────────────

export async function fetchMerchants(): Promise<Merchant[]> {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    created_at: row.created_at,
  }));
}

export async function createMerchant(data: Pick<Merchant, 'name' | 'category'>): Promise<Merchant> {
  const { data: row, error } = await supabase
    .from('merchants')
    .insert({ name: data.name, category: data.category ?? null })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    created_at: row.created_at,
  };
}

export async function updateMerchant(id: string, data: Pick<Merchant, 'name' | 'category'>): Promise<void> {
  const { error } = await supabase
    .from('merchants')
    .update({ name: data.name, category: data.category ?? null })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMerchant(id: string): Promise<void> {
  const { error } = await supabase.from('merchants').delete().eq('id', id);
  if (error) throw error;
}

// ─── Merchant Entities ───────────────────────────────────────────────────────

export async function fetchMerchantEntities(): Promise<MerchantEntity[]> {
  const { data, error } = await supabase
    .from('merchant_entities')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    merchant_id: row.merchant_id,
    name: row.name,
    full_legal_name: row.full_legal_name,
    region: row.region,
    created_at: row.created_at,
  }));
}

export async function createMerchantEntity(
  data: Omit<MerchantEntity, 'id' | 'created_at'>
): Promise<MerchantEntity> {
  const { data: row, error } = await supabase
    .from('merchant_entities')
    .insert({ ...data })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    merchant_id: row.merchant_id,
    name: row.name,
    full_legal_name: row.full_legal_name,
    region: row.region,
    created_at: row.created_at,
  };
}

export async function updateMerchantEntity(
  id: string,
  data: Omit<MerchantEntity, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('merchant_entities')
    .update({ name: data.name, full_legal_name: data.full_legal_name, region: data.region })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMerchantEntity(id: string): Promise<void> {
  const { error } = await supabase.from('merchant_entities').delete().eq('id', id);
  if (error) throw error;
}

// ─── Applications ────────────────────────────────────────────────────────────

export async function fetchApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    merchant_id: row.merchant_id,
    name: row.name,
    bundle_id: row.bundle_id,
    status: row.status,
    created_at: row.created_at,
  }));
}

export async function createApplication(
  data: Omit<Application, 'id' | 'created_at'>
): Promise<Application> {
  const { data: row, error } = await supabase
    .from('applications')
    .insert({ ...data })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    merchant_id: row.merchant_id,
    name: row.name,
    bundle_id: row.bundle_id,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function updateApplication(
  id: string,
  data: Omit<Application, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ name: data.name, bundle_id: data.bundle_id, status: data.status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw error;
}

// ─── Merchant KYB Records ─────────────────────────────────────────────────────

export async function fetchMerchantKybRecords(): Promise<MerchantKYBRecord[]> {
  const { data, error } = await supabase
    .from('merchant_kyb_records')
    .select('*')
    .order('submitted_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    merchant_entity_id: row.merchant_entity_id,
    channel_id: row.channel_id,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at ?? null,
    notes: row.notes ?? null,
  }));
}

export async function createMerchantKybRecord(
  merchant_entity_id: string,
  data: Omit<KYBRecordBase, 'id'>
): Promise<MerchantKYBRecord> {
  const { data: row, error } = await supabase
    .from('merchant_kyb_records')
    .insert({ merchant_entity_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    merchant_entity_id: row.merchant_entity_id,
    channel_id: row.channel_id,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at ?? null,
    notes: row.notes ?? null,
  };
}

export async function updateMerchantKybRecord(
  id: string,
  data: Omit<KYBRecordBase, 'id'>
): Promise<void> {
  const { error } = await supabase
    .from('merchant_kyb_records')
    .update({
      channel_id: data.channel_id,
      status: data.status,
      submitted_at: data.submitted_at,
      reviewed_at: data.reviewed_at,
      notes: data.notes,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMerchantKybRecord(id: string): Promise<void> {
  const { error } = await supabase.from('merchant_kyb_records').delete().eq('id', id);
  if (error) throw error;
}
