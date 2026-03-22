import { supabase } from './supabase';
import { MoontonEntity, MoontonKYBRecord } from '../types';

export async function fetchMoontonEntities(): Promise<MoontonEntity[]> {
  const { data, error } = await supabase
    .from('moonton_entities')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    full_legal_name: row.full_legal_name,
    region: row.region,
    created_at: row.created_at,
    is_display_only: row.is_display_only ?? false,
  }));
}

export async function createMoontonEntity(
  data: Omit<MoontonEntity, 'id' | 'created_at' | 'is_display_only'>
): Promise<MoontonEntity> {
  const { data: row, error } = await supabase
    .from('moonton_entities')
    .insert({ ...data, is_display_only: false })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    name: row.name,
    full_legal_name: row.full_legal_name,
    region: row.region,
    created_at: row.created_at,
    is_display_only: row.is_display_only ?? false,
  };
}

export async function updateMoontonEntity(
  id: string,
  data: Omit<MoontonEntity, 'id' | 'created_at' | 'is_display_only'>
): Promise<void> {
  const { error } = await supabase
    .from('moonton_entities')
    .update({ name: data.name, full_legal_name: data.full_legal_name, region: data.region })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMoontonEntity(id: string): Promise<void> {
  const { error } = await supabase
    .from('moonton_entities')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchMoontonKybRecords(): Promise<MoontonKYBRecord[]> {
  const { data, error } = await supabase
    .from('moonton_kyb_records')
    .select('*')
    .order('submitted_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    moonton_entity_id: row.moonton_entity_id,
    channel_id: row.channel_id,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at ?? null,
    notes: row.notes ?? null,
  }));
}

export async function createMoontonKybRecord(
  moonton_entity_id: string,
  data: { channel_id: string; status: string; submitted_at: string; reviewed_at: string | null; notes: string | null }
): Promise<MoontonKYBRecord> {
  const { data: row, error } = await supabase
    .from('moonton_kyb_records')
    .insert({ moonton_entity_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    moonton_entity_id: row.moonton_entity_id,
    channel_id: row.channel_id,
    status: row.status,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at ?? null,
    notes: row.notes ?? null,
  } as MoontonKYBRecord;
}

export async function updateMoontonKybRecord(
  id: string,
  data: { channel_id: string; status: string; submitted_at: string; reviewed_at: string | null; notes: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('moonton_kyb_records')
    .update(data)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMoontonKybRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('moonton_kyb_records')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
