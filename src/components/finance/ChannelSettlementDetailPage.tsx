import { useState, useEffect } from 'react';
import { Channel, ChannelContract, ChannelSettlementRecord, Transaction, PaymentMethod } from '../../types';
import { confirmSettlement, markDisputed, reReconcile, startReconciliation } from '../../lib/settlementService';
import { SettlementStatusBadge } from './SettlementStatusBadge';
import { Button } from '../ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Circle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

interface ChannelSettlementDetailPageProps {
  record: ChannelSettlementRecord;
  channels: Channel[];
  channelContracts: ChannelContract[];
  onBack: () => void;
  onRecordChange: (record: ChannelSettlementRecord) => void;
}

type ModalType = 'start_reconciliation' | 'confirm_settled' | 'mark_disputed' | 're_reconciliation' | 'force_settle' | null;
type TabType = 'info' | 'transactions' | 'history';

const PAGE_SIZE = 20;

export function ChannelSettlementDetailPage({
  record,
  channels,
  channelContracts,
  onBack,
  onRecordChange,
}: ChannelSettlementDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);
  const [openResetConfirm, setOpenResetConfirm] = useState(false);
  const { toast } = useToast();

  const isDemoRecord = record.period_start === '2026-03-01';

  const [startClaimedAmount, setStartClaimedAmount] = useState('');
  const [startNotes, setStartNotes] = useState('');

  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmNotes, setConfirmNotes] = useState('');

  const [disputeReason, setDisputeReason] = useState('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);

  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [successTotal, setSuccessTotal] = useState<number | null>(null);
  const [avgChannelRate, setAvgChannelRate] = useState<number | null>(null);

  const contract = channelContracts.find((c) => c.id === record.channel_contract_id);
  const directCh = channels.find((c) => c.id === record.channel_id);
  const contractCh = contract ? channels.find((c) => c.id === contract.channel_id) : undefined;
  const resolvedCh = directCh ?? contractCh;
  const channelName = resolvedCh?.display_name ?? resolvedCh?.name ?? record.channel_id;

  useEffect(() => {
    loadBreakdown();
  }, []);

  useEffect(() => {
    if (activeTab !== 'transactions') return;
    loadTransactions(txPage);
  }, [activeTab, txPage]);

  const loadBreakdown = async () => {
    setBreakdownLoading(true);
    try {
      const { data: accounts } = await supabase
        .from('merchant_accounts')
        .select('id')
        .eq('channel_id', record.channel_id);
      const accountIds = (accounts ?? []).map((a: { id: string }) => a.id);
      if (accountIds.length === 0) { setSuccessTotal(0); setAvgChannelRate(0); return; }

      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, channel_rate')
        .in('merchant_account_id', accountIds)
        .eq('status', 'SUCCESS')
        .gte('created_at', record.period_start)
        .lte('created_at', record.period_end + 'T23:59:59');

      const rows = txData ?? [];
      const total = rows.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
      const avgRate = rows.length > 0
        ? rows.reduce((sum: number, t: { channel_rate: number }) => sum + t.channel_rate, 0) / rows.length
        : 0;
      setSuccessTotal(total);
      setAvgChannelRate(avgRate);
    } catch {
      setSuccessTotal(null);
      setAvgChannelRate(null);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const loadTransactions = async (page: number) => {
    setTxLoading(true);
    try {
      const { data: accounts } = await supabase
        .from('merchant_accounts')
        .select('id')
        .eq('channel_id', record.channel_id);

      const accountIds = (accounts ?? []).map((a: { id: string }) => a.id);
      if (accountIds.length === 0) { setTransactions([]); setTxTotal(0); setTxLoading(false); return; }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: txData, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .in('merchant_account_id', accountIds)
        .gte('created_at', record.period_start)
        .lte('created_at', record.period_end + 'T23:59:59')
        .order('created_at', { ascending: false })
        .range(from, to);

      setTransactions(txData ?? []);
      setTxTotal(count ?? 0);

      const { data: pmData } = await supabase.from('payment_methods').select('*');
      setPaymentMethods(pmData ?? []);
    } catch {
      toast({ title: '加载交易失败', variant: 'destructive' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleStartReconciliation = async () => {
    if (!startClaimedAmount || parseFloat(startClaimedAmount) < 0) {
      toast({ title: '请填写有效的声称打款金额', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await startReconciliation('channel', record.id, parseFloat(startClaimedAmount), startNotes) as ChannelSettlementRecord;
      onRecordChange(updated);
      setOpenModal(null);
      setStartClaimedAmount('');
      setStartNotes('');
      toast({ title: '已开始对账' });
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSettled = async () => {
    if (!confirmAmount || parseFloat(confirmAmount) < 0) {
      toast({ title: '请填写有效的实际到账金额', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await confirmSettlement('channel', record.id, parseFloat(confirmAmount), confirmNotes) as ChannelSettlementRecord;
      onRecordChange(updated);
      setOpenModal(null);
      setConfirmAmount('');
      setConfirmNotes('');
      toast({ title: '结算已确认' });
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkDisputed = async () => {
    if (!disputeReason.trim()) {
      toast({ title: '请填写争议原因', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const updated = await markDisputed('channel', record.id, disputeReason.trim()) as ChannelSettlementRecord;
      onRecordChange(updated);
      setOpenModal(null);
      setDisputeReason('');
      toast({ title: '已标记为争议' });
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReReconcile = async () => {
    setSaving(true);
    try {
      const updated = await reReconcile('channel', record.id) as ChannelSettlementRecord;
      onRecordChange(updated);
      setOpenModal(null);
      toast({ title: '已重新置为对账中' });
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleForceSettle = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();

      const { data: current } = await supabase
        .from('channel_settlement_records')
        .select('dispute_history')
        .eq('id', record.id)
        .maybeSingle();

      const existing = (current?.dispute_history ?? []) as import('../../types').DisputeHistoryEntry[];
      const forceEntry: import('../../types').DisputeHistoryEntry = {
        time: now,
        operator: 'ops-admin',
        action: '强制结算',
        reason: '争议未能解决，强制终结',
      };

      const { data, error } = await supabase
        .from('channel_settlement_records')
        .update({
          status: 'SETTLED',
          settled_at: today,
          dispute_history: [...existing, forceEntry],
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw error;

      const updated: ChannelSettlementRecord = {
        id: data.id,
        channel_contract_id: data.channel_contract_id,
        channel_id: data.channel_id,
        period_start: data.period_start,
        period_end: data.period_end,
        expected_amount: Number(data.expected_amount),
        actual_amount: data.actual_amount != null ? Number(data.actual_amount) : null,
        currency: data.currency,
        status: data.status,
        settled_at: data.settled_at ?? null,
        notes: data.notes ?? null,
        dispute_history: data.dispute_history ?? [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      onRecordChange(updated);
      setOpenModal(null);
      toast({ title: '已完成强制结算' });
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('channel_settlement_records')
        .update({
          status: 'PENDING',
          actual_amount: null,
          settled_at: null,
          notes: null,
          dispute_history: [],
        })
        .eq('period_start', '2026-03-01')
        .select()
        .single();

      if (error) throw error;

      const updated: ChannelSettlementRecord = {
        id: data.id,
        channel_contract_id: data.channel_contract_id,
        channel_id: data.channel_id,
        period_start: data.period_start,
        period_end: data.period_end,
        expected_amount: Number(data.expected_amount),
        actual_amount: null,
        currency: data.currency,
        status: 'PENDING',
        settled_at: null,
        notes: null,
        dispute_history: [],
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      onRecordChange(updated);
      setOpenResetConfirm(false);
      toast({ title: '演示记录已重置' });
    } catch {
      toast({ title: '重置失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(txTotal / PAGE_SIZE);

  const txStatusLabel: Record<string, string> = {
    SUCCESS: '成功',
    FAILED: '失败',
    REFUNDED: '已退款',
  };

  type HistoryEntry = { time: string; label: string; type: 'create' | 'reconcile' | 'dispute' | 'settle' | 'force_settle' };

  const TYPE_ORDER: Record<string, number> = {
    create: 0,
    reconcile: 1,
    dispute: 2,
    force_settle: 3,
    settle: 3,
  };

  const isForceSettle = record.dispute_history.some((e) => e.action === '强制结算');

  const historyEntries: HistoryEntry[] = ([
    { time: record.created_at ?? '', label: '结算记录创建', type: 'create' as const },
    ...(record.status !== 'PENDING' && record.updated_at && record.actual_amount != null
      ? [{
          time: record.updated_at,
          label: `开始对账 · 对方声称金额 ${record.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          type: 'reconcile' as const,
        }]
      : []),
    ...record.dispute_history.filter((e) => e.action !== '强制结算').map((e) => ({
      time: e.time,
      label: `标记争议 · 声称: ${e.claimed_amount != null ? e.claimed_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'} · ${e.reason ?? e.note ?? ''}`,
      type: 'dispute' as const,
    })),
    ...record.dispute_history.filter((e) => e.action === '强制结算').map((e) => ({
      time: e.time,
      label: `强制结算 · ${e.reason ?? ''}`,
      type: 'force_settle' as const,
    })),
    ...(record.status === 'SETTLED' && record.settled_at && !isForceSettle
      ? [{
          time: record.settled_at,
          label: `确认结算 · 实际到账 ${record.actual_amount != null ? record.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}`,
          type: 'settle' as const,
        }]
      : []),
  ] as HistoryEntry[]).sort((a, b) => {
    const typeDiff = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
    if (typeDiff !== 0) return typeDiff;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: 'info', label: '基本信息' },
    { key: 'transactions', label: '关联交易' },
    { key: 'history', label: '操作历史' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回渠道结算列表
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{channelName} — 结算详情</h1>
          <p className="text-slate-500 mt-1 text-sm">记录 ID: {record.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemoRecord && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-slate-600"
              onClick={() => setOpenResetConfirm(true)}
            >
              重置演示
            </Button>
          )}
          <SettlementStatusBadge status={record.status} />
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Field label="渠道" value={channelName} />
              <Field label="渠道合同" value={contract ? `${contract.id}` : record.channel_contract_id} />
              <Field label="结算周期" value={`${record.period_start} ~ ${record.period_end}`} />
              <Field label="币种" value={record.currency} />
              <Field
                label="应结算金额"
                value={record.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              />
              <Field
                label="实际到账金额"
                value={
                  record.actual_amount != null
                    ? record.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : '—'
                }
              />
              {record.settled_at && <Field label="结算日期" value={record.settled_at} />}
              {record.notes && <Field label="备注" value={record.notes} />}
            </div>
          </div>

          {record.actual_amount != null && (
            <DiffRow expected={record.expected_amount} actual={record.actual_amount} currency={record.currency} />
          )}

          {record.status === 'SETTLED' && record.actual_amount != null && Math.abs(record.actual_amount - record.expected_amount) >= 0.001 && (
            <div className="mb-6 border-l-4 border-slate-300 bg-slate-50 px-4 py-3 rounded-r-lg">
              <p className="text-xs text-slate-500 leading-relaxed">
                此结算记录存在金额差异。如需处理，请通过财务申诉流程跟进，结算状态不再变更。
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">结算金额明细</h2>
            {breakdownLoading ? (
              <p className="text-sm text-slate-400">计算中...</p>
            ) : successTotal === null ? (
              <p className="text-sm text-slate-400">计算失败</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">交易总额（成功）</span>
                  <span className="font-mono text-slate-800">
                    {successTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    扣：渠道通道费
                    {avgChannelRate !== null && (
                      <span className="text-slate-400 ml-1">({(avgChannelRate! * 100).toFixed(2)}%)</span>
                    )}
                  </span>
                  <span className="font-mono text-red-600">
                    -{(successTotal * (avgChannelRate ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-base">应结算金额</span>
                  <span className="font-mono font-bold text-slate-900 text-base">
                    {(successTotal * (1 - (avgChannelRate ?? 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {record.status !== 'SETTLED' && (
            <div className="flex flex-wrap gap-3">
              {record.status === 'PENDING' && (
                <Button
                  onClick={() => {
                    setStartClaimedAmount('');
                    setStartNotes('');
                    setOpenModal('start_reconciliation');
                  }}
                  disabled={saving}
                >
                  开始对账
                </Button>
              )}
              {record.status === 'IN_RECONCILIATION' && (
                <>
                  <Button
                    onClick={() => {
                      setConfirmAmount(record.actual_amount != null ? record.actual_amount.toFixed(2) : record.expected_amount.toFixed(2));
                      setConfirmNotes('');
                      setOpenModal('confirm_settled');
                    }}
                  >
                    确认结算
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDisputeReason('');
                      setOpenModal('mark_disputed');
                    }}
                  >
                    标记争议
                  </Button>
                </>
              )}
              {record.status === 'DISPUTED' && (
                <>
                  <Button variant="outline" onClick={() => setOpenModal('re_reconciliation')}>
                    重新对账
                  </Button>
                  <Button variant="secondary" onClick={() => setOpenModal('force_settle')}>
                    强制结算
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'transactions' && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            {txLoading ? '加载中...' : `${txTotal} 条关联交易`}
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">交易ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">商户号</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">支付方式</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">金额</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">币种</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">渠道费率</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">报价费率</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">交易时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {txLoading ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400 text-sm">加载中...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-400 text-sm">暂无关联交易记录</td></tr>
                ) : (
                  transactions.map((tx) => {
                    const pm = paymentMethods.find((p) => p.id === tx.payment_method_id);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[120px] truncate">{tx.id}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-mono max-w-[120px] truncate">{tx.merchant_account_id}</td>
                        <td className="px-4 py-3 text-slate-700">{pm?.name ?? tx.payment_method_id}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">
                          {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{tx.currency}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(tx.channel_rate * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-slate-600">{(tx.quoted_rate * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-center">
                          <TxStatusBadge status={tx.status} label={txStatusLabel[tx.status] ?? tx.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
              <span>第 {txPage} / {totalPages} 页</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={txPage === 1} onClick={() => setTxPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={txPage === totalPages} onClick={() => setTxPage((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-6">操作历史</h2>
          <div className="space-y-0">
            {historyEntries.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.type === 'settle' || entry.type === 'force_settle'
                      ? 'bg-emerald-50'
                      : entry.type === 'dispute'
                      ? 'bg-red-50'
                      : entry.type === 'reconcile'
                      ? 'bg-blue-50'
                      : 'bg-slate-100'
                  }`}>
                    {entry.type === 'settle' || entry.type === 'force_settle' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : entry.type === 'dispute' ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : entry.type === 'reconcile' ? (
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  {i < historyEntries.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 mt-1 mb-1 min-h-[24px]" />
                  )}
                </div>
                <div className="pb-5 flex-1 pt-1">
                  <p className="text-sm font-medium text-slate-800">{entry.label}</p>
                  {entry.time && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(entry.time).toLocaleString('zh-CN')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {historyEntries.length <= 1 && (
              <p className="text-sm text-slate-400 mt-4 ml-12">暂无操作记录</p>
            )}
          </div>
        </div>
      )}

      {/* 开始对账 Modal */}
      <Dialog open={openModal === 'start_reconciliation'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>开始对账</DialogTitle>
            <DialogDescription>请填写对方声称的打款金额，系统将据此计算差异。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>渠道声称打款金额 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={startClaimedAmount}
                onChange={(e) => setStartClaimedAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>备注（可选）</Label>
              <Textarea
                rows={3}
                placeholder="如有备注请填写..."
                value={startNotes}
                onChange={(e) => setStartNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>取消</Button>
            <Button onClick={handleStartReconciliation} disabled={saving}>
              {saving ? '处理中...' : '开始对账'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认结算 Modal */}
      <Dialog open={openModal === 'confirm_settled'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认结算</DialogTitle>
            <DialogDescription>请确认实际到账金额，系统将记录今日为结算日期。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>实际到账金额 <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
              />
              {record.actual_amount != null && (
                <p className="text-xs text-slate-400">
                  对账时声称金额：{record.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>备注（可选）</Label>
              <Input
                type="text"
                placeholder="如有备注请填写..."
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>取消</Button>
            <Button onClick={handleConfirmSettled} disabled={saving}>
              {saving ? '处理中...' : '确认结算'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 标记争议 Modal */}
      <Dialog open={openModal === 'mark_disputed'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>标记争议</DialogTitle>
            <DialogDescription>请填写争议原因，争议记录将追加到历史中。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>争议原因 <span className="text-red-500">*</span></Label>
              <Textarea
                rows={3}
                placeholder="请描述争议原因..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>取消</Button>
            <Button variant="destructive" onClick={handleMarkDisputed} disabled={saving}>
              {saving ? '处理中...' : '确认标记'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重新对账 Modal */}
      <Dialog open={openModal === 're_reconciliation'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>重新对账</DialogTitle>
            <DialogDescription>
              确认将此结算记录重新置为对账中？争议历史将保留。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>取消</Button>
            <Button onClick={handleReReconcile} disabled={saving}>
              {saving ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置演示 Dialog */}
      <Dialog open={openResetConfirm} onOpenChange={setOpenResetConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>重置演示</DialogTitle>
            <DialogDescription>
              确认重置此结算记录为初始状态？所有操作历史将清空。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenResetConfirm(false)}>取消</Button>
            <Button variant="destructive" onClick={handleResetDemo} disabled={saving}>
              {saving ? '处理中...' : '确认重置'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 强制结算 Modal */}
      <Dialog open={openModal === 'force_settle'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>强制结算</DialogTitle>
            <DialogDescription>
              强制结算将直接终结此争议，以实际到账金额为准完成结算。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-0 border border-slate-200 rounded-lg overflow-hidden text-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-slate-600">应结算金额</span>
              <span className="font-mono font-medium text-slate-800">
                {record.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {record.currency}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <span className="text-slate-600">实际到账金额</span>
              <span className="font-mono font-medium text-slate-800">
                {record.actual_amount != null
                  ? `${record.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${record.currency}`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-slate-600">差异</span>
              {record.actual_amount != null ? (() => {
                const diff = record.actual_amount - record.expected_amount;
                const sign = diff > 0.001 ? '+' : '';
                const color = Math.abs(diff) < 0.001 ? 'text-slate-800' : diff < 0 ? 'text-red-600' : 'text-orange-600';
                return (
                  <span className={`font-mono font-medium ${color}`}>
                    {sign}{diff.toLocaleString('en-US', { minimumFractionDigits: 2 })} {record.currency}
                  </span>
                );
              })() : <span className="text-slate-400">—</span>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)}>取消</Button>
            <Button variant="destructive" onClick={handleForceSettle} disabled={saving}>
              {saving ? '处理中...' : '确认强制结算'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiffRow({ expected, actual, currency }: { expected: number; actual: number; currency: string }) {
  const diff = actual - expected;
  const isEqual = Math.abs(diff) < 0.001;
  const isShort = diff < -0.001;

  const bg = isEqual ? 'bg-emerald-50 border-emerald-200' : isShort ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
  const textColor = isEqual ? 'text-emerald-700' : isShort ? 'text-red-600' : 'text-orange-600';
  const tag = isEqual ? '金额一致' : isShort ? '差额待补' : '存在溢收';
  const tagBg = isEqual ? 'bg-emerald-100 text-emerald-700' : isShort ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
  const sign = diff > 0.001 ? '+' : '';

  return (
    <div className={`rounded-xl border px-5 py-4 mb-6 flex items-center justify-between ${bg}`}>
      <span className="text-sm font-medium text-slate-700">差异</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono font-semibold text-sm ${textColor}`}>
          {sign}{diff.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagBg}`}>{tag}</span>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

function TxStatusBadge({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    FAILED: 'bg-red-50 text-red-700 ring-red-200',
    REFUNDED: 'bg-amber-50 text-amber-700 ring-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${colors[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
      {label}
    </span>
  );
}
