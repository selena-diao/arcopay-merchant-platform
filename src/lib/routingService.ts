import { supabase } from './supabase';
import { RoutingRule, RoutingRuleCountry, RoutingStrategy } from '../types';

// ─── Routing Rules ─────────────────────────────────────────────────────────────

export async function fetchRoutingRules(): Promise<RoutingRule[]> {
  const { data, error } = await supabase
    .from('routing_rules')
    .select('*')
    .order('priority', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    payment_method_id: row.payment_method_id,
    channel_id: row.channel_id,
    priority: Number(row.priority),
    weight: Number(row.weight),
    status: row.status as RoutingRule['status'],
  }));
}

export async function insertRoutingRule(rule: Omit<RoutingRule, 'id'>): Promise<RoutingRule> {
  const { data, error } = await supabase
    .from('routing_rules')
    .insert({
      payment_method_id: rule.payment_method_id,
      channel_id: rule.channel_id,
      priority: rule.priority,
      weight: Math.round(rule.weight),
      status: rule.status,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    payment_method_id: data.payment_method_id,
    channel_id: data.channel_id,
    priority: Number(data.priority),
    weight: Number(data.weight),
    status: data.status as RoutingRule['status'],
  };
}

export async function upsertRoutingRule(rule: RoutingRule): Promise<void> {
  const { error } = await supabase
    .from('routing_rules')
    .upsert({
      id: rule.id,
      payment_method_id: rule.payment_method_id,
      channel_id: rule.channel_id,
      priority: rule.priority,
      weight: Math.round(rule.weight),
      status: rule.status,
    });
  if (error) throw error;
}

export async function updateRoutingRuleStatus(id: string, status: RoutingRule['status']): Promise<void> {
  const { error } = await supabase
    .from('routing_rules')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ─── Routing Rule Countries ────────────────────────────────────────────────────

export async function fetchRoutingRuleCountries(): Promise<RoutingRuleCountry[]> {
  const { data, error } = await supabase
    .from('routing_rule_country')
    .select('*');
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    routing_rule_id: row.routing_rule_id,
    country_code: row.country_code,
  }));
}

export async function replaceRoutingRuleCountries(
  ruleId: string,
  countryCodes: string[]
): Promise<void> {
  const { error: delError } = await supabase
    .from('routing_rule_country')
    .delete()
    .eq('routing_rule_id', ruleId);
  if (delError) throw delError;

  if (countryCodes.length === 0) return;

  const rows = countryCodes.map((code) => ({
    id: crypto.randomUUID(),
    routing_rule_id: ruleId,
    country_code: code,
  }));
  const { error: insError } = await supabase
    .from('routing_rule_country')
    .insert(rows);
  if (insError) throw insError;
}

// ─── Routing Strategies ────────────────────────────────────────────────────────

export async function fetchRoutingStrategies(): Promise<RoutingStrategy[]> {
  const { data, error } = await supabase
    .from('routing_strategies')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    payment_method_id: row.payment_method_id,
    type: row.type as RoutingStrategy['type'],
    description: row.description ?? '',
  }));
}

export async function insertRoutingStrategy(strategy: Omit<RoutingStrategy, 'id'>): Promise<RoutingStrategy> {
  const { data, error } = await supabase
    .from('routing_strategies')
    .insert({
      payment_method_id: strategy.payment_method_id,
      type: strategy.type,
      description: strategy.description ?? '',
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    payment_method_id: data.payment_method_id,
    type: data.type as RoutingStrategy['type'],
    description: data.description ?? '',
  };
}

export async function upsertRoutingStrategy(strategy: RoutingStrategy): Promise<void> {
  const { error } = await supabase
    .from('routing_strategies')
    .upsert({
      id: strategy.id,
      payment_method_id: strategy.payment_method_id,
      type: strategy.type,
      description: strategy.description ?? '',
    });
  if (error) throw error;
}

export async function deleteRoutingStrategy(id: string): Promise<void> {
  const { error } = await supabase
    .from('routing_strategies')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
