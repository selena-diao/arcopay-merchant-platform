import { supabase } from './supabase';
import { Channel, ChannelPaymentMethod, ChannelPaymentMethodCountry } from '../types';

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function fetchChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    display_name: row.display_name,
    merchant_mode: row.merchant_mode,
    success_rate: Number(row.success_rate),
    status: row.status,
    created_at: row.created_at,
  }));
}

export async function createChannel(
  data: Omit<Channel, 'id' | 'created_at'>
): Promise<Channel> {
  const id = data.name.toLowerCase().replace(/\s+/g, '-');
  const created_at = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('channels')
    .insert({ id, ...data, created_at });
  if (error) throw error;
  return { id, ...data, created_at };
}

export async function updateChannel(
  id: string,
  data: Omit<Channel, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabase
    .from('channels')
    .update({
      display_name: data.display_name,
      merchant_mode: data.merchant_mode,
      success_rate: data.success_rate,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteChannel(id: string): Promise<void> {
  const { error } = await supabase.from('channels').delete().eq('id', id);
  if (error) throw error;
}

// ─── Channel Payment Methods ──────────────────────────────────────────────────

export async function fetchChannelPaymentMethods(): Promise<ChannelPaymentMethod[]> {
  const { data, error } = await supabase
    .from('channel_payment_methods')
    .select('*');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    channel_id: row.channel_id,
    payment_method_id: row.payment_method_id,
  }));
}

export async function createChannelPaymentMethod(
  channel_id: string,
  payment_method_id: string
): Promise<ChannelPaymentMethod> {
  const { data, error } = await supabase
    .from('channel_payment_methods')
    .insert({ channel_id, payment_method_id })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, channel_id: data.channel_id, payment_method_id: data.payment_method_id };
}

export async function deleteChannelPaymentMethod(id: string): Promise<void> {
  const { error } = await supabase.from('channel_payment_methods').delete().eq('id', id);
  if (error) throw error;
}

// ─── Channel Payment Method Countries ─────────────────────────────────────────

export async function fetchChannelPaymentMethodCountries(): Promise<ChannelPaymentMethodCountry[]> {
  const { data, error } = await supabase
    .from('channel_payment_method_country')
    .select('*');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    channel_payment_method_id: row.channel_payment_method_id,
    country_code: row.country_code,
  }));
}

export async function createChannelPaymentMethodCountry(
  channel_payment_method_id: string,
  country_code: string
): Promise<ChannelPaymentMethodCountry> {
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('channel_payment_method_country')
    .insert({ id, channel_payment_method_id, country_code });
  if (error) throw error;
  return { id, channel_payment_method_id, country_code };
}

export async function deleteChannelPaymentMethodCountriesByMethodId(
  channel_payment_method_id: string
): Promise<void> {
  const { error } = await supabase
    .from('channel_payment_method_country')
    .delete()
    .eq('channel_payment_method_id', channel_payment_method_id);
  if (error) throw error;
}
