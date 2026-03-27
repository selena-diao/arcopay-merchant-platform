import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TriangleAlert as AlertTriangle, TrendingDown, FileText, Activity, ArrowRight, LayoutDashboard, Clock, CircleAlert as AlertCircle, CirclePlus as PlusCircle, CircleCheck as CheckCircle, DollarSign, FileCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  fetchDashboardData,
  DashboardData,
  DashboardDisputedSettlement,
  DashboardReconciliationSettlement,
  DashboardPendingOnboarding,
  DashboardInvertedContract,
} from '../../lib/dashboardService';
import { NavPage } from '../../types';

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return dateStr.slice(0, 10);
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) return '—';
  return `${amount >= 0 ? '+' : ''}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatExpectedAmount(amount: number | null, currency: string): string {
  if (amount === null) return '—';
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${amount.toFixed(2)}`;
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(3)}%`;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-16 bg-gray-200 rounded mt-3" />
          <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

function SkeletonSettlementSummaryCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div className="h-3.5 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50">
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 bg-gray-200 rounded" />
            <div className="h-3 w-28 bg-gray-100 rounded" />
          </div>
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  subLabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
  alertLabel?: string;
  warning?: boolean;
  warningLabel?: string;
  onClick: () => void;
}

function MetricCard({
  label,
  value,
  subLabel,
  icon,
  iconBg,
  iconColor,
  alert,
  alertLabel,
  warning,
  warningLabel,
  onClick,
}: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-white rounded-xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group',
        alert
          ? 'border-red-200 bg-red-50/40'
          : warning
          ? 'border-orange-200 bg-orange-50/20'
          : 'border-gray-100'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium',
              alert ? 'text-red-700' : warning ? 'text-orange-700' : 'text-gray-500'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'text-3xl font-bold mt-2 tabular-nums',
              alert ? 'text-red-700' : warning ? 'text-orange-700' : 'text-gray-900'
            )}
          >
            {value}
          </p>
          {subLabel && <p className="text-xs text-gray-400 mt-1.5">{subLabel}</p>}
          {alert && alertLabel && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-inset ring-red-200">
              <AlertTriangle className="w-3 h-3" />
              {alertLabel}
            </span>
          )}
          {warning && warningLabel && !alert && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200">
              <AlertTriangle className="w-3 h-3" />
              {warningLabel}
            </span>
          )}
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            iconBg
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
        <span>查看详情</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

interface SettlementSummaryRow {
  label: string;
  count: number;
  isAlert?: boolean;
  onClick: () => void;
}

function SettlementSummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: SettlementSummaryRow[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
      <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
      <div>
        {rows.map((row, idx) => (
          <button
            key={idx}
            onClick={row.onClick}
            className={cn(
              'w-full flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group transition-colors rounded-lg px-2 -mx-2 hover:bg-gray-50/70'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', row.isAlert && row.count > 0 ? 'text-red-700' : 'text-gray-600')}>
                {row.label}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {row.isAlert && row.count > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                  需关注
                </span>
              )}
              <span className={cn(
                'text-xl font-bold tabular-nums min-w-[2rem] text-right',
                row.isAlert && row.count > 0 ? 'text-red-700' : 'text-gray-900'
              )}>
                {row.count}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function OnboardingStatusBadge({ status }: { status: string }) {
  if (status === 'SUBMITTED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
        待审核
      </span>
    );
  }
  if (status === 'REVIEWING') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200">
        审核中
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200">
      {status}
    </span>
  );
}

interface FollowUpColumnProps {
  title: string;
  count: number;
  countColor?: string;
  onViewAll: () => void;
  loading: boolean;
  emptyIcon: React.ReactNode;
  emptyText: string;
  children: React.ReactNode;
}

function FollowUpColumn({
  title,
  count,
  countColor = 'bg-gray-100 text-gray-600',
  onViewAll,
  loading,
  emptyIcon,
  emptyText,
  children,
}: FollowUpColumnProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {!loading && count > 0 && (
            <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold', countColor)}>
              {count}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
        >
          查看全部
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1">
        {loading ? (
          <SkeletonList />
        ) : count === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-gray-400">
            <div className="mb-2 opacity-20">{emptyIcon}</div>
            <p className="text-xs">{emptyText}</p>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  );
}

function DisputedSettlementRow({
  item,
  onClick,
}: {
  item: DashboardDisputedSettlement;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-900 truncate">{item.name}</span>
          <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 text-gray-500 flex-shrink-0">
            {item.type === 'channel' ? '渠道' : '商家'}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatDate(item.period_start)} ~ {formatDate(item.period_end)}
        </p>
        {item.diff_amount !== null && (
          <span className={cn('text-xs font-semibold tabular-nums', item.diff_amount < 0 ? 'text-red-600' : 'text-emerald-600')}>
            {formatCurrency(item.diff_amount, item.currency)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">
          争议中
        </span>
        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </button>
  );
}

function ReconciliationRow({
  item,
  onClick,
}: {
  item: DashboardReconciliationSettlement;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-gray-900 truncate">{item.name}</span>
          <span className="inline-flex items-center px-1 py-0 rounded text-[10px] font-medium bg-gray-100 text-gray-500 flex-shrink-0">
            {item.type === 'channel' ? '渠道' : '商家'}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatDate(item.period_start)} ~ {formatDate(item.period_end)}
        </p>
        {item.expected_amount !== null && (
          <span className="text-xs font-medium text-gray-600 tabular-nums">
            {formatExpectedAmount(item.expected_amount, item.currency)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200">
          对账中
        </span>
        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </button>
  );
}

function PendingOnboardingRow({
  item,
  onClick,
}: {
  item: DashboardPendingOnboarding;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">{item.channel_name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.merchant_entity_name}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <OnboardingStatusBadge status={item.status} />
        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </button>
  );
}

function InvertedContractRow({
  item,
  onClick,
}: {
  item: DashboardInvertedContract;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-2 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 rounded-lg px-2 -mx-2 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate">{item.merchant_name}</p>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{item.moonton_entity_name}</p>
        <span className="text-xs font-semibold text-red-600 tabular-nums">
          差 {formatRate(item.margin)} ({formatRate(item.quoted_rate)} vs {formatRate(item.min_channel_rate)})
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 ring-1 ring-inset ring-red-200">
          已倒挂
        </span>
        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>
    </button>
  );
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const result = await fetchDashboardData();
      setData(result);
      setLastRefreshed(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatRefreshTime = (date: Date) =>
    date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const successRate = data?.transactionSuccessRate;
  const rateColor =
    successRate == null
      ? 'text-gray-900'
      : successRate >= 90
      ? 'text-emerald-700'
      : successRate >= 80
      ? 'text-orange-700'
      : 'text-red-700';
  const rateIconColor =
    successRate == null
      ? 'text-gray-400'
      : successRate >= 90
      ? 'text-emerald-600'
      : successRate >= 80
      ? 'text-orange-600'
      : 'text-red-600';
  const rateIconBg =
    successRate == null
      ? 'bg-gray-50'
      : successRate >= 90
      ? 'bg-emerald-50'
      : successRate >= 80
      ? 'bg-orange-50'
      : 'bg-red-50';

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ArcoPay 运营概览</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[42px]">
            数据实时更新
            {!loading && (
              <span className="ml-2 text-gray-400">
                · 最后刷新 {formatRefreshTime(lastRefreshed)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 shadow-sm',
            refreshing && 'opacity-60 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          刷新
        </button>
      </div>

      <div className="space-y-7">
        {/* 合同 */}
        <div>
          <SectionHeader label="合同" />
          <div className="grid grid-cols-3 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <MetricCard
                  label="有效合同"
                  value={data?.activeContractCount ?? 0}
                  icon={<FileCheck className="w-5 h-5" />}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  onClick={() => onNavigate('merchant-contracts')}
                />
                <MetricCard
                  label="费率倒挂"
                  value={data?.invertedContractCount ?? 0}
                  icon={<TrendingDown className="w-5 h-5" />}
                  iconBg={(data?.invertedContractCount ?? 0) > 0 ? 'bg-red-50' : 'bg-gray-50'}
                  iconColor={(data?.invertedContractCount ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}
                  alert={(data?.invertedContractCount ?? 0) > 0}
                  alertLabel="需处理"
                  onClick={() => onNavigate('merchant-contracts')}
                />
                <MetricCard
                  label="倒挂风险"
                  value={data?.atRiskContractCount ?? 0}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  iconBg={(data?.atRiskContractCount ?? 0) > 0 ? 'bg-orange-50' : 'bg-gray-50'}
                  iconColor={(data?.atRiskContractCount ?? 0) > 0 ? 'text-orange-600' : 'text-gray-400'}
                  warning={(data?.atRiskContractCount ?? 0) > 0}
                  warningLabel="需关注"
                  onClick={() => onNavigate('merchant-contracts')}
                />
              </>
            )}
          </div>
        </div>

        {/* 进件 */}
        <div>
          <SectionHeader label="进件" />
          <div className="grid grid-cols-2 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <MetricCard
                  label="待审核进件"
                  value={data?.pendingOnboardingCount ?? 0}
                  icon={<Clock className="w-5 h-5" />}
                  iconBg={(data?.pendingOnboardingCount ?? 0) > 0 ? 'bg-orange-50' : 'bg-gray-50'}
                  iconColor={(data?.pendingOnboardingCount ?? 0) > 0 ? 'text-orange-600' : 'text-gray-400'}
                  warning={(data?.pendingOnboardingCount ?? 0) > 0}
                  onClick={() => onNavigate('onboarding')}
                />
                <MetricCard
                  label="本月新增进件"
                  value={data?.monthlyNewOnboardingCount ?? 0}
                  icon={<PlusCircle className="w-5 h-5" />}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  onClick={() => onNavigate('onboarding')}
                />
              </>
            )}
          </div>
        </div>

        {/* 交易 */}
        <div>
          <SectionHeader label="交易" />
          <div className="grid grid-cols-3 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <MetricCard
                  label="近 30 天交易笔数"
                  value={data?.transactionCounts.total ?? 0}
                  subLabel={
                    data
                      ? `成功 ${data.transactionCounts.success} · 失败 ${data.transactionCounts.failed}`
                      : undefined
                  }
                  icon={<Activity className="w-5 h-5" />}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  onClick={() => onNavigate('transaction-ledger')}
                />
                <button
                  onClick={() => onNavigate('transaction-ledger')}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">近 30 天成功率</p>
                      <p className={cn('text-3xl font-bold mt-2 tabular-nums', rateColor)}>
                        {successRate != null ? `${successRate.toFixed(1)}%` : '—'}
                      </p>
                      {successRate != null && successRate < 90 && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset',
                            successRate < 80
                              ? 'bg-red-100 text-red-700 ring-red-200'
                              : 'bg-orange-100 text-orange-700 ring-orange-200'
                          )}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {successRate < 80 ? '需关注' : '偏低'}
                        </span>
                      )}
                    </div>
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', rateIconBg)}>
                      <CheckCircle className={cn('w-5 h-5', rateIconColor)} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                    <span>查看详情</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
                <button
                  onClick={() => onNavigate('transaction-ledger')}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">近 30 天交易总额</p>
                      <p className="text-3xl font-bold mt-2 text-gray-900 tabular-nums">
                        {data ? formatAmount(data.transactionTotalAmount) : '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1.5">仅含成功交易</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
                    <span>查看详情</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 结算 */}
        <div>
          <SectionHeader label="结算" />
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              <SkeletonSettlementSummaryCard />
              <SkeletonSettlementSummaryCard />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <SettlementSummaryCard
                title="渠道结算"
                rows={[
                  {
                    label: '待处理',
                    count: data?.splitSettlementCounts.channel.pending ?? 0,
                    onClick: () => onNavigate('channel-settlement'),
                  },
                  {
                    label: '对账中',
                    count: data?.splitSettlementCounts.channel.inReconciliation ?? 0,
                    onClick: () => onNavigate('channel-settlement'),
                  },
                  {
                    label: '争议中',
                    count: data?.splitSettlementCounts.channel.disputed ?? 0,
                    isAlert: true,
                    onClick: () => onNavigate('channel-settlement'),
                  },
                ]}
              />
              <SettlementSummaryCard
                title="商家结算"
                rows={[
                  {
                    label: '待处理',
                    count: data?.splitSettlementCounts.merchant.pending ?? 0,
                    onClick: () => onNavigate('merchant-settlement'),
                  },
                  {
                    label: '对账中',
                    count: data?.splitSettlementCounts.merchant.inReconciliation ?? 0,
                    onClick: () => onNavigate('merchant-settlement'),
                  },
                  {
                    label: '争议中',
                    count: data?.splitSettlementCounts.merchant.disputed ?? 0,
                    isAlert: true,
                    onClick: () => onNavigate('merchant-settlement'),
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* 需跟进事项 */}
        <div>
          <SectionHeader label="需跟进事项" />
          <div className="grid grid-cols-4 gap-4">
            {/* 争议中结算 */}
            <FollowUpColumn
              title="争议中结算"
              count={data?.recentDisputedSettlements.length ?? 0}
              countColor="bg-red-100 text-red-700"
              onViewAll={() => onNavigate('channel-settlement')}
              loading={loading}
              emptyIcon={<AlertCircle className="w-8 h-8" />}
              emptyText="暂无争议结算"
            >
              {data?.recentDisputedSettlements.map((item) => (
                <DisputedSettlementRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onClick={() =>
                    onNavigate(item.type === 'channel' ? 'channel-settlement' : 'merchant-settlement')
                  }
                />
              ))}
            </FollowUpColumn>

            {/* 对账中结算 */}
            <FollowUpColumn
              title="对账中结算"
              count={data?.recentReconciliationSettlements.length ?? 0}
              countColor="bg-orange-100 text-orange-700"
              onViewAll={() => onNavigate('channel-settlement')}
              loading={loading}
              emptyIcon={<RefreshCw className="w-8 h-8" />}
              emptyText="暂无对账中结算"
            >
              {data?.recentReconciliationSettlements.map((item) => (
                <ReconciliationRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onClick={() =>
                    onNavigate(item.type === 'channel' ? 'channel-settlement' : 'merchant-settlement')
                  }
                />
              ))}
            </FollowUpColumn>

            {/* 待审核进件 */}
            <FollowUpColumn
              title="待审核进件"
              count={data?.recentPendingOnboardings.length ?? 0}
              countColor="bg-orange-100 text-orange-700"
              onViewAll={() => onNavigate('onboarding')}
              loading={loading}
              emptyIcon={<FileText className="w-8 h-8" />}
              emptyText="暂无待审核进件"
            >
              {data?.recentPendingOnboardings.map((item) => (
                <PendingOnboardingRow
                  key={item.id}
                  item={item}
                  onClick={() => onNavigate('onboarding')}
                />
              ))}
            </FollowUpColumn>

            {/* 费率倒挂合同 */}
            <FollowUpColumn
              title="费率倒挂合同"
              count={data?.recentInvertedContracts.length ?? 0}
              countColor="bg-red-100 text-red-700"
              onViewAll={() => onNavigate('merchant-contracts')}
              loading={loading}
              emptyIcon={<TrendingDown className="w-8 h-8" />}
              emptyText="暂无倒挂合同"
            >
              {data?.recentInvertedContracts.map((item) => (
                <InvertedContractRow
                  key={item.id}
                  item={item}
                  onClick={() => onNavigate('merchant-contracts')}
                />
              ))}
            </FollowUpColumn>
          </div>
        </div>
      </div>
    </div>
  );
}
