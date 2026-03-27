import { useState, useEffect, useCallback, useMemo } from 'react';
import { Channel, Merchant, TransactionStatus } from '../../types';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Search, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

interface TransactionRow {
  id: string;
  merchant_account_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  channel_rate: number;
  quoted_rate: number;
  created_at: string;
  channel_name: string;
  payment_method_name: string;
}

interface TransactionLedgerPageProps {
  channels: Channel[];
  merchants: Merchant[];
}

const STATUS_LABEL: Record<TransactionStatus, string> = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

function StatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        status === 'SUCCESS' && 'bg-emerald-100 text-emerald-700',
        status === 'FAILED' && 'bg-red-100 text-red-700',
        status === 'REFUNDED' && 'bg-orange-100 text-orange-700'
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function fmtRate(rate: number) {
  return (rate * 100).toFixed(2) + '%';
}

function fmtAmount(amount: number) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

const SELECT_STYLE =
  'h-9 rounded-lg border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 appearance-none';

const CHEVRON_BG =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`;

export function TransactionLedgerPage({ channels, merchants }: TransactionLedgerPageProps) {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [channelFilter, setChannelFilter] = useState('');
  const [merchantFilter, setMerchantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | TransactionStatus>('');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const merchantAccountChannelMap = useMemo<Map<string, string>>(() => new Map(), []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    let txQuery = supabase
      .from('transactions')
      .select('id, merchant_account_id, payment_method_id, amount, currency, status, channel_rate, quoted_rate, created_at')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      txQuery = txQuery.eq('status', statusFilter);
    }
    if (startDate) {
      txQuery = txQuery.gte('created_at', startDate + 'T00:00:00.000Z');
    }
    if (endDate) {
      txQuery = txQuery.lte('created_at', endDate + 'T23:59:59.999Z');
    }

    const { data: txData, error: txError } = await txQuery;

    if (txError || !txData) {
      setLoading(false);
      return;
    }

    const maIds = [...new Set((txData as any[]).map((t) => t.merchant_account_id).filter(Boolean))];
    const pmIds = [...new Set((txData as any[]).map((t) => t.payment_method_id).filter(Boolean))];

    const [maResult, pmResult] = await Promise.all([
      maIds.length > 0
        ? supabase.from('merchant_accounts').select('id, channel_id, onboarding_id').in('id', maIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      pmIds.length > 0
        ? supabase.from('payment_methods').select('id, name').in('id', pmIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    const maMap = new Map<string, { channel_id: string; onboarding_id: string }>(
      ((maResult.data ?? []) as any[]).map((ma) => [ma.id, ma])
    );
    const pmMap = new Map<string, string>(
      ((pmResult.data ?? []) as any[]).map((pm) => [pm.id, pm.name])
    );

    let rows: TransactionRow[] = (txData as any[]).map((t) => {
      const ma = maMap.get(t.merchant_account_id);
      const channelId = ma?.channel_id ?? '';
      const ch = channels.find((c) => c.id === channelId);
      if (channelId) merchantAccountChannelMap.set(t.merchant_account_id, channelId);
      return {
        id: t.id,
        merchant_account_id: t.merchant_account_id,
        payment_method_id: t.payment_method_id,
        amount: t.amount,
        currency: t.currency,
        status: t.status as TransactionStatus,
        channel_rate: t.channel_rate,
        quoted_rate: t.quoted_rate,
        created_at: t.created_at,
        channel_name: ch?.display_name ?? ch?.name ?? channelId,
        payment_method_name: pmMap.get(t.payment_method_id) ?? t.payment_method_id,
      };
    });

    if (channelFilter) {
      rows = rows.filter((r) => {
        const ma = maMap.get(r.merchant_account_id);
        return ma?.channel_id === channelFilter;
      });
    }

    if (merchantFilter) {
      const onboardingIds = [...new Set(
        [...maMap.values()].map((ma) => ma.onboarding_id).filter(Boolean)
      )];

      const { data: obData } = await supabase
        .from('onboardings')
        .select('id, merchant_entity_id')
        .in('id', onboardingIds);

      if (obData) {
        const merchantEntityIds = (obData as any[]).map((ob) => ob.merchant_entity_id).filter(Boolean);
        const { data: meData } = await supabase
          .from('merchant_entities')
          .select('id, merchant_id')
          .in('id', merchantEntityIds)
          .eq('merchant_id', merchantFilter);

        if (meData) {
          const validMeIds = new Set((meData as any[]).map((me) => me.id));
          const validObIds = new Set(
            (obData as any[])
              .filter((ob) => validMeIds.has(ob.merchant_entity_id))
              .map((ob) => ob.id)
          );
          const validMaIds = new Set(
            [...maMap.entries()]
              .filter(([, ma]) => validObIds.has(ma.onboarding_id))
              .map(([id]) => id)
          );
          rows = rows.filter((r) => validMaIds.has(r.merchant_account_id));
        }
      }
    }

    setTransactions(rows);
    setLoading(false);
  }, [channels, channelFilter, merchantFilter, statusFilter, startDate, endDate, merchantAccountChannelMap]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [channelFilter, merchantFilter, statusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const pagedTransactions = transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rangeStart = transactions.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, transactions.length);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">交易流水</h1>
          <p className="text-slate-500 mt-1 text-sm">查看所有交易记录明细</p>
        </div>
        <div className="text-sm text-slate-500 mt-1 flex-shrink-0">
          {!loading && transactions.length > 0 && (
            <>
              <span className="font-medium text-slate-700">{rangeStart}-{rangeEnd}</span>
              {' / '}
              <span className="font-medium text-slate-700">{transactions.length}</span>
              {' 条交易记录'}
            </>
          )}
          {!loading && transactions.length === 0 && '0 条交易记录'}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">渠道</label>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className={SELECT_STYLE}
            style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="">全部渠道</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.display_name || ch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">商家</label>
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className={SELECT_STYLE}
            style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="">全部商家</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium">状态</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as '' | TransactionStatus)}
            className={SELECT_STYLE}
            style={{ backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="">全部</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            时间范围
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
            <span className="text-slate-400 text-sm">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
        </div>

        <button
          onClick={() => {
            setChannelFilter('');
            setMerchantFilter('');
            setStatusFilter('');
            setStartDate('');
            setEndDate('');
          }}
          className="h-9 px-3 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
        >
          重置
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">交易ID</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">商户号</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">支付方式</th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">金额</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">币种</th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">渠道费率</th>
              <th className="text-right px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">报价费率</th>
              <th className="text-center px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">交易时间</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="text-center py-16">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                    <Search className="w-4 h-4 animate-pulse" />
                    加载中...
                  </div>
                </td>
              </tr>
            )}
            {!loading && transactions.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-16 text-slate-400 text-sm">
                  暂无交易记录
                </td>
              </tr>
            )}
            {!loading && pagedTransactions.map((tx, i) => (
              <tr
                key={tx.id}
                className={cn(
                  'border-t border-slate-100 hover:bg-slate-50 transition-colors',
                  i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                )}
              >
                <td className="px-4 py-3.5 font-mono text-xs text-slate-500 max-w-[120px] truncate" title={tx.id}>
                  {tx.id.substring(0, 8)}...
                </td>
                <td className="px-4 py-3.5 text-slate-700 font-mono text-xs max-w-[120px] truncate" title={tx.merchant_account_id}>
                  {tx.merchant_account_id}
                </td>
                <td className="px-4 py-3.5 text-slate-800 font-medium">
                  {tx.payment_method_name}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-900 font-semibold">
                  {fmtAmount(tx.amount)}
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-xs font-medium">
                  {tx.currency}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-600 text-xs">
                  {fmtRate(tx.channel_rate)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-600 text-xs">
                  {fmtRate(tx.quoted_rate)}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                  {fmtDateTime(tx.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              第 <span className="font-semibold text-slate-700">{currentPage}</span> / <span className="font-semibold text-slate-700">{totalPages}</span> 页
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                上一页
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
