import { useMemo, useState } from 'react';
import { Channel, ChannelContract, ContractPaymentMethod, MoontonEntity, PaymentMethod } from '../../types';
import { TrendingDown, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MarginReportPageProps {
  channels: Channel[];
  channelContracts: ChannelContract[];
  contractPaymentMethods: ContractPaymentMethod[];
  paymentMethods: PaymentMethod[];
  moontonEntities: MoontonEntity[];
}

interface ChannelRow {
  id: string;
  channelName: string;
  quotedRate: number;
  channelRateRaw: number;
  margin: number;
}

type GroupStatus = 'inverted' | 'normal';

interface PaymentMethodGroup {
  paymentMethodId: string;
  paymentMethodName: string;
  minQuotedRate: number;
  maxQuotedRate: number;
  channelRows: ChannelRow[];
  minChannelRateRaw: number;
  maxChannelRateRaw: number;
  minMargin: number;
  maxMargin: number;
  status: GroupStatus;
}

function fmtQuoted(rate: number) {
  return rate.toFixed(2) + '%';
}

function fmtChannel(rateRaw: number) {
  return (rateRaw * 100).toFixed(2) + '%';
}

function fmtMarginVal(margin: number) {
  return (margin >= 0 ? '+' : '') + margin.toFixed(2) + '%';
}

function calcMargin(quotedRate: number, channelRateRaw: number) {
  return quotedRate - channelRateRaw * 100;
}

const STATUS_ORDER: Record<GroupStatus, number> = { inverted: 0, normal: 1 };

export function MarginReportPage({
  channels,
  channelContracts,
  contractPaymentMethods,
  paymentMethods,
  moontonEntities,
}: MarginReportPageProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const filteredChannelContracts = useMemo(() => {
    if (!selectedEntityId) return channelContracts;
    return channelContracts.filter((cc) => cc.moonton_entity_id === selectedEntityId);
  }, [channelContracts, selectedEntityId]);

  const groups = useMemo<PaymentMethodGroup[]>(() => {
    const map = new Map<string, PaymentMethodGroup>();

    for (const cpm of contractPaymentMethods) {
      if (cpm.status !== 'ACTIVE') continue;
      const pm = paymentMethods.find((p) => p.id === cpm.payment_method_id);
      if (!pm) continue;

      if (!map.has(cpm.payment_method_id)) {
        map.set(cpm.payment_method_id, {
          paymentMethodId: cpm.payment_method_id,
          paymentMethodName: pm.name,
          minQuotedRate: Infinity,
          maxQuotedRate: -Infinity,
          channelRows: [],
          minChannelRateRaw: Infinity,
          maxChannelRateRaw: -Infinity,
          minMargin: Infinity,
          maxMargin: -Infinity,
          status: 'normal',
        });
      }

      const group = map.get(cpm.payment_method_id)!;

      for (const cc of filteredChannelContracts) {
        if (cc.status !== 'ACTIVE') continue;
        const ch = channels.find((c) => c.id === cc.channel_id);
        const margin = calcMargin(cpm.quoted_rate, cc.channel_rate);
        group.channelRows.push({
          id: `${cpm.id}-${cc.id}`,
          channelName: ch?.display_name ?? ch?.name ?? cc.channel_id,
          quotedRate: cpm.quoted_rate,
          channelRateRaw: cc.channel_rate,
          margin,
        });
        if (cpm.quoted_rate < group.minQuotedRate) group.minQuotedRate = cpm.quoted_rate;
        if (cpm.quoted_rate > group.maxQuotedRate) group.maxQuotedRate = cpm.quoted_rate;
        if (cc.channel_rate < group.minChannelRateRaw) group.minChannelRateRaw = cc.channel_rate;
        if (cc.channel_rate > group.maxChannelRateRaw) group.maxChannelRateRaw = cc.channel_rate;
        if (margin < group.minMargin) group.minMargin = margin;
        if (margin > group.maxMargin) group.maxMargin = margin;
      }
    }

    const result = Array.from(map.values()).filter((g) => g.channelRows.length > 0);
    for (const g of result) {
      g.status = g.channelRows.some((r) => r.margin < 0) ? 'inverted' : 'normal';
      g.channelRows.sort((a, b) => a.margin - b.margin);
    }
    result.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.paymentMethodName.localeCompare(b.paymentMethodName));
    return result;
  }, [channels, filteredChannelContracts, contractPaymentMethods, paymentMethods]);

  let invertedCount = 0;
  let normalCount = 0;
  for (const g of groups) {
    for (const row of g.channelRows) {
      if (row.margin < 0) invertedCount++;
      else normalCount++;
    }
  }

  const defaultExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      if (g.status === 'inverted') set.add(g.paymentMethodId);
    }
    return set;
  }, [groups]);

  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">费率差报表</h1>
          <p className="text-slate-500 mt-1 text-sm">
            基于当前有效合同的报价费率与渠道费率对比分析
          </p>
        </div>
        <div className="flex-shrink-0">
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="">全部平台主体</option>
            {moontonEntities.filter((e) => e.name !== 'Global').map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">已倒挂</p>
          <p className={cn('text-3xl font-bold mt-1', invertedCount > 0 ? 'text-red-600' : 'text-slate-900')}>
            {invertedCount}
          </p>
          <p className="text-xs text-slate-400 mt-1">报价低于渠道费率的组合数</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">正常</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{normalCount}</p>
          <p className="text-xs text-slate-400 mt-1">报价高于或等于渠道费率的组合数</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-8" />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                支付方式
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                报价费率
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                渠道费率区间
              </th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                费率差区间
              </th>
              <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                状态
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400 text-sm">
                  暂无数据
                </td>
              </tr>
            )}
            {groups.map((group) => {
              const isExpanded = expanded.has(group.paymentMethodId);
              const sameQuotedRate = group.minQuotedRate === group.maxQuotedRate;
              const sameRate = group.minChannelRateRaw === group.maxChannelRateRaw;
              const sameMargin = group.minMargin === group.maxMargin;
              const invertedRows = group.channelRows.filter((r) => r.margin < 0).length;
              const normalRows = group.channelRows.length - invertedRows;

              return [
                <tr
                  key={group.paymentMethodId}
                  onClick={() => toggle(group.paymentMethodId)}
                  className={cn(
                    'border-t border-slate-200 cursor-pointer select-none transition-colors',
                    group.status === 'inverted'
                      ? 'bg-red-50/60 hover:bg-red-50'
                      : 'bg-white hover:bg-slate-50'
                  )}
                >
                  <td className="pl-5 pr-2 py-4 text-slate-400">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {group.paymentMethodName}
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      {group.channelRows.length} 个渠道
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-semibold text-slate-800">
                    {sameQuotedRate
                      ? fmtQuoted(group.minQuotedRate)
                      : `${fmtQuoted(group.minQuotedRate)} ~ ${fmtQuoted(group.maxQuotedRate)}`}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-600">
                    {sameRate
                      ? fmtChannel(group.minChannelRateRaw)
                      : `${fmtChannel(group.minChannelRateRaw)} ~ ${fmtChannel(group.maxChannelRateRaw)}`}
                  </td>
                  <td className={cn(
                    'px-5 py-4 text-right font-mono font-semibold',
                    group.minMargin < 0 ? 'text-red-600' : 'text-emerald-600'
                  )}>
                    {sameMargin
                      ? fmtMarginVal(group.minMargin)
                      : `${fmtMarginVal(group.minMargin)} ~ ${fmtMarginVal(group.maxMargin)}`}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {invertedRows === 0 ? (
                      <span className="text-xs font-medium text-emerald-700">全部正常</span>
                    ) : (
                      <span className="text-xs font-medium">
                        <span className="text-slate-600">{normalRows} 个正常</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-red-600">{invertedRows} 个倒挂</span>
                      </span>
                    )}
                  </td>
                </tr>,
                isExpanded &&
                  group.channelRows.map((row) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-t border-slate-100 transition-colors',
                        row.margin < 0
                          ? 'bg-red-50/30 hover:bg-red-50/60'
                          : 'bg-slate-50/40 hover:bg-slate-100/60'
                      )}
                    >
                      <td className="pl-5 pr-2 py-3" />
                      <td className="px-5 py-3 text-slate-500 pl-10">
                        <span className="text-slate-400 mr-2">└</span>
                        {row.channelName}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-600 text-xs">
                        {fmtQuoted(row.quotedRate)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-600 text-xs">
                        {fmtChannel(row.channelRateRaw)}
                      </td>
                      <td className={cn(
                        'px-5 py-3 text-right font-mono text-xs font-medium',
                        row.margin < 0 ? 'text-red-600' : 'text-emerald-600'
                      )}>
                        {fmtMarginVal(row.margin)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {row.margin < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <TrendingDown className="w-3 h-3" />
                            已倒挂
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <TrendingUp className="w-3 h-3" />
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  )),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
