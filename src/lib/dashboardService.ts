import { supabase } from './supabase';

export interface DashboardSettlementCounts {
  pending: number;
  inReconciliation: number;
  disputed: number;
}

export interface DashboardSplitSettlementCounts {
  channel: DashboardSettlementCounts;
  merchant: DashboardSettlementCounts;
}

export interface DashboardTransactionCounts {
  total: number;
  success: number;
  failed: number;
}

export interface DashboardDisputedSettlement {
  id: string;
  type: 'channel' | 'merchant';
  name: string;
  period_start: string;
  period_end: string;
  diff_amount: number | null;
  currency: string;
  channel_contract_id?: string;
  merchant_contract_id?: string;
  channel_id?: string;
  merchant_id?: string;
}

export interface DashboardPendingOnboarding {
  id: string;
  channel_name: string;
  merchant_entity_name: string;
  status: string;
  submitted_at: string | null;
  channel_contract_id: string;
}

export interface DashboardReconciliationSettlement {
  id: string;
  type: 'channel' | 'merchant';
  name: string;
  period_start: string;
  period_end: string;
  expected_amount: number | null;
  currency: string;
}

export interface DashboardInvertedContract {
  id: string;
  merchant_name: string;
  moonton_entity_name: string;
  quoted_rate: number;
  min_channel_rate: number;
  margin: number;
}

export interface DashboardData {
  settlementCounts: DashboardSettlementCounts;
  splitSettlementCounts: DashboardSplitSettlementCounts;
  transactionCounts: DashboardTransactionCounts;
  transactionSuccessRate: number | null;
  transactionTotalAmount: number;
  invertedContractCount: number;
  atRiskContractCount: number;
  activeContractCount: number;
  pendingOnboardingCount: number;
  monthlyNewOnboardingCount: number;
  recentDisputedSettlements: DashboardDisputedSettlement[];
  recentReconciliationSettlements: DashboardReconciliationSettlement[];
  recentPendingOnboardings: DashboardPendingOnboarding[];
  recentInvertedContracts: DashboardInvertedContract[];
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    channelSettlementsRes,
    merchantSettlementsRes,
    transactionsRes,
    channelContractsRes,
    merchantContractsRes,
    onboardingsRes,
    channelContractDetailsRes,
    merchantEntitiesRes,
    channelsRes,
    transactionsWithAmountRes,
    activeMerchantContractsRes,
    monthlyOnboardingsRes,
    merchantsRes,
    moontonEntitiesRes,
  ] = await Promise.all([
    supabase.from('channel_settlement_records').select('id, status, expected_amount, actual_amount, currency, period_start, period_end, channel_contract_id, channel_id'),
    supabase.from('merchant_settlement_records').select('id, status, expected_amount, actual_amount, currency, period_start, period_end, merchant_contract_id, merchant_id'),
    supabase.from('transactions').select('status, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('channel_contracts').select('id, moonton_entity_id, channel_rate, status').eq('status', 'ACTIVE'),
    supabase.from('merchant_contracts').select('id, moonton_entity_id, merchant_id, quoted_rate, status').in('status', ['ACTIVE', 'DRAFT']),
    supabase.from('onboardings').select('id, channel_contract_id, merchant_entity_id, status, submitted_at, created_at').in('status', ['SUBMITTED', 'REVIEWING']).order('submitted_at', { ascending: false }),
    supabase.from('channel_contracts').select('id, channel_id'),
    supabase.from('merchant_entities').select('id, name'),
    supabase.from('channels').select('id, display_name, name'),
    supabase.from('transactions').select('status, amount, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('merchant_contracts').select('id').eq('status', 'ACTIVE'),
    supabase.from('onboardings').select('id, created_at').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('merchants').select('id, name'),
    supabase.from('moonton_entities').select('id, name'),
  ]);

  const channelSettlements = channelSettlementsRes.data ?? [];
  const merchantSettlements = merchantSettlementsRes.data ?? [];
  const transactions = transactionsRes.data ?? [];
  const activeChannelContracts = channelContractsRes.data ?? [];
  const activeMerchantContracts = merchantContractsRes.data ?? [];
  const pendingOnboardings = onboardingsRes.data ?? [];
  const allChannelContracts = channelContractDetailsRes.data ?? [];
  const merchantEntities = merchantEntitiesRes.data ?? [];
  const channels = channelsRes.data ?? [];
  const transactionsWithAmount = transactionsWithAmountRes.data ?? [];
  const activeContractCount = (activeMerchantContractsRes.data ?? []).length;
  const monthlyNewOnboardingCount = (monthlyOnboardingsRes.data ?? []).length;
  const merchants = merchantsRes.data ?? [];
  const moontonEntities = moontonEntitiesRes.data ?? [];

  const channelContractChannelMap: Record<string, string> = {};
  for (const cc of allChannelContracts) {
    channelContractChannelMap[cc.id as string] = cc.channel_id as string;
  }

  const channelNameMap: Record<string, string> = {};
  for (const ch of channels) {
    channelNameMap[ch.id as string] = (ch.display_name || ch.name) as string;
  }

  const merchantEntityNameMap: Record<string, string> = {};
  for (const me of merchantEntities) {
    merchantEntityNameMap[me.id as string] = me.name as string;
  }

  const merchantNameMap: Record<string, string> = {};
  for (const m of merchants) {
    merchantNameMap[m.id as string] = m.name as string;
  }

  const moontonEntityNameMap: Record<string, string> = {};
  for (const e of moontonEntities) {
    moontonEntityNameMap[e.id as string] = e.name as string;
  }

  const channelSettlementCounts: DashboardSettlementCounts = {
    pending: channelSettlements.filter((r) => r.status === 'PENDING').length,
    inReconciliation: channelSettlements.filter((r) => r.status === 'IN_RECONCILIATION').length,
    disputed: channelSettlements.filter((r) => r.status === 'DISPUTED').length,
  };

  const merchantSettlementCounts: DashboardSettlementCounts = {
    pending: merchantSettlements.filter((r) => r.status === 'PENDING').length,
    inReconciliation: merchantSettlements.filter((r) => r.status === 'IN_RECONCILIATION').length,
    disputed: merchantSettlements.filter((r) => r.status === 'DISPUTED').length,
  };

  const settlementCounts: DashboardSettlementCounts = {
    pending: channelSettlementCounts.pending + merchantSettlementCounts.pending,
    inReconciliation: channelSettlementCounts.inReconciliation + merchantSettlementCounts.inReconciliation,
    disputed: channelSettlementCounts.disputed + merchantSettlementCounts.disputed,
  };

  const splitSettlementCounts: DashboardSplitSettlementCounts = {
    channel: channelSettlementCounts,
    merchant: merchantSettlementCounts,
  };

  const transactionCounts: DashboardTransactionCounts = {
    total: transactions.length,
    success: transactions.filter((t) => t.status === 'SUCCESS').length,
    failed: transactions.filter((t) => t.status === 'FAILED').length,
  };

  const entityChannelRates: Record<string, { min: number; max: number }> = {};
  for (const cc of activeChannelContracts) {
    const eid = cc.moonton_entity_id as string;
    const rate = Number(cc.channel_rate);
    if (!entityChannelRates[eid]) {
      entityChannelRates[eid] = { min: rate, max: rate };
    } else {
      if (rate < entityChannelRates[eid].min) entityChannelRates[eid].min = rate;
      if (rate > entityChannelRates[eid].max) entityChannelRates[eid].max = rate;
    }
  }

  const invertedContractCount = activeMerchantContracts.filter((mc) => {
    const rates = entityChannelRates[mc.moonton_entity_id as string];
    if (!rates) return false;
    const upperBound = Number(mc.quoted_rate) - rates.min;
    return upperBound <= 0;
  }).length;

  const atRiskContractCount = activeMerchantContracts.filter((mc) => {
    const rates = entityChannelRates[mc.moonton_entity_id as string];
    if (!rates) return false;
    const quoted = Number(mc.quoted_rate);
    const margin = quoted - rates.min;
    return margin > 0 && margin < 0.005;
  }).length;

  const successTxns = transactionsWithAmount.filter((t) => t.status === 'SUCCESS');
  const transactionTotalAmount = successTxns.reduce((sum, t) => sum + Number(t.amount), 0);
  const transactionSuccessRate =
    transactionsWithAmount.length > 0
      ? (successTxns.length / transactionsWithAmount.length) * 100
      : null;

  const pendingOnboardingCount = pendingOnboardings.length;

  const disputedChannel = channelSettlements
    .filter((r) => r.status === 'DISPUTED')
    .sort((a, b) => (b.period_start as string).localeCompare(a.period_start as string))
    .slice(0, 5)
    .map((r): DashboardDisputedSettlement => {
      const channelId = channelContractChannelMap[r.channel_contract_id as string];
      const name = channelId ? channelNameMap[channelId] ?? '未知渠道' : '未知渠道';
      const diff = r.actual_amount != null ? Number(r.actual_amount) - Number(r.expected_amount) : null;
      return {
        id: r.id as string,
        type: 'channel',
        name,
        period_start: r.period_start as string,
        period_end: r.period_end as string,
        diff_amount: diff,
        currency: r.currency as string,
        channel_contract_id: r.channel_contract_id as string,
        channel_id: r.channel_id as string,
      };
    });

  const disputedMerchant = merchantSettlements
    .filter((r) => r.status === 'DISPUTED')
    .sort((a, b) => (b.period_start as string).localeCompare(a.period_start as string))
    .slice(0, 5)
    .map((r): DashboardDisputedSettlement => ({
      id: r.id as string,
      type: 'merchant',
      name: '商户结算',
      period_start: r.period_start as string,
      period_end: r.period_end as string,
      diff_amount: r.actual_amount != null ? Number(r.actual_amount) - Number(r.expected_amount) : null,
      currency: r.currency as string,
      merchant_contract_id: r.merchant_contract_id as string,
      merchant_id: r.merchant_id as string,
    }));

  const allDisputed = [...disputedChannel, ...disputedMerchant]
    .sort((a, b) => b.period_start.localeCompare(a.period_start))
    .slice(0, 3);

  const reconciliationChannel = channelSettlements
    .filter((r) => r.status === 'IN_RECONCILIATION')
    .sort((a, b) => (b.period_start as string).localeCompare(a.period_start as string))
    .slice(0, 3)
    .map((r): DashboardReconciliationSettlement => {
      const channelId = channelContractChannelMap[r.channel_contract_id as string];
      const name = channelId ? channelNameMap[channelId] ?? '未知渠道' : '未知渠道';
      return {
        id: r.id as string,
        type: 'channel',
        name,
        period_start: r.period_start as string,
        period_end: r.period_end as string,
        expected_amount: r.expected_amount != null ? Number(r.expected_amount) : null,
        currency: r.currency as string,
      };
    });

  const reconciliationMerchant = merchantSettlements
    .filter((r) => r.status === 'IN_RECONCILIATION')
    .sort((a, b) => (b.period_start as string).localeCompare(a.period_start as string))
    .slice(0, 3)
    .map((r): DashboardReconciliationSettlement => ({
      id: r.id as string,
      type: 'merchant',
      name: '商户结算',
      period_start: r.period_start as string,
      period_end: r.period_end as string,
      expected_amount: r.expected_amount != null ? Number(r.expected_amount) : null,
      currency: r.currency as string,
    }));

  const allReconciliation = [...reconciliationChannel, ...reconciliationMerchant]
    .sort((a, b) => b.period_start.localeCompare(a.period_start))
    .slice(0, 3);

  const recentInvertedContracts: DashboardInvertedContract[] = activeMerchantContracts
    .filter((mc) => {
      const rates = entityChannelRates[mc.moonton_entity_id as string];
      if (!rates) return false;
      return Number(mc.quoted_rate) - rates.min <= 0;
    })
    .slice(0, 3)
    .map((mc): DashboardInvertedContract => {
      const rates = entityChannelRates[mc.moonton_entity_id as string];
      const quoted = Number(mc.quoted_rate);
      const minRate = rates ? rates.min : 0;
      return {
        id: mc.id as string,
        merchant_name: mc.merchant_id ? merchantNameMap[mc.merchant_id as string] ?? '未知商家' : '未知商家',
        moonton_entity_name: mc.moonton_entity_id ? moontonEntityNameMap[mc.moonton_entity_id as string] ?? '未知主体' : '未知主体',
        quoted_rate: quoted,
        min_channel_rate: minRate,
        margin: quoted - minRate,
      };
    });

  const recentPendingOnboardings: DashboardPendingOnboarding[] = pendingOnboardings
    .slice(0, 5)
    .map((ob) => {
      const channelId = channelContractChannelMap[ob.channel_contract_id as string];
      const channelName = channelId ? channelNameMap[channelId] ?? '未知渠道' : '未知渠道';
      const merchantEntityName = ob.merchant_entity_id
        ? merchantEntityNameMap[ob.merchant_entity_id as string] ?? '未知商家主体'
        : '未知商家主体';
      return {
        id: ob.id as string,
        channel_name: channelName,
        merchant_entity_name: merchantEntityName,
        status: ob.status as string,
        submitted_at: ob.submitted_at as string | null,
        channel_contract_id: ob.channel_contract_id as string,
      };
    });

  return {
    settlementCounts,
    splitSettlementCounts,
    transactionCounts,
    transactionSuccessRate,
    transactionTotalAmount,
    invertedContractCount,
    atRiskContractCount,
    activeContractCount,
    pendingOnboardingCount,
    monthlyNewOnboardingCount,
    recentDisputedSettlements: allDisputed,
    recentReconciliationSettlements: allReconciliation,
    recentPendingOnboardings,
    recentInvertedContracts,
  };
}
