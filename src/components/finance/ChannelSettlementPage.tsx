import { useState, useEffect, useMemo } from 'react';
import { Channel, ChannelContract, ChannelSettlementRecord, SettlementRecordStatus } from '../../types';
import {
  fetchChannelSettlementRecords,
  createChannelSettlementRecord,
  calculateExpectedAmount,
} from '../../lib/settlementService';
import { SettlementStatusBadge } from './SettlementStatusBadge';
import { Button } from '../ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';

interface ChannelSettlementPageProps {
  channels: Channel[];
  channelContracts: ChannelContract[];
  onDrillDown: (record: ChannelSettlementRecord) => void;
}

const STATUS_LABELS: Record<string, string> = {
  ALL: '全部',
  PENDING: '待结算',
  IN_RECONCILIATION: '对账中',
  SETTLED: '已结算',
  DISPUTED: '争议中',
};

export function ChannelSettlementPage({ channels, channelContracts, onDrillDown }: ChannelSettlementPageProps) {
  const [records, setRecords] = useState<ChannelSettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | SettlementRecordStatus>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannelSettlementRecords()
      .then(setRecords)
      .catch(() => toast({ title: '加载失败', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return records;
    return records.filter((r) => r.status === statusFilter);
  }, [records, statusFilter]);

  const getChannelName = (record: ChannelSettlementRecord) => {
    const directMatch = channels.find((c) => c.id === record.channel_id);
    if (directMatch) return directMatch.display_name ?? directMatch.name;
    const contract = channelContracts.find((cc) => cc.id === record.channel_contract_id);
    if (contract) {
      const ch = channels.find((c) => c.id === contract.channel_id);
      if (ch) return ch.display_name ?? ch.name;
    }
    return record.channel_id;
  };

  const handleCreated = async (_record: ChannelSettlementRecord) => {
    setShowNewModal(false);
    const data = await fetchChannelSettlementRecords().catch(() => null);
    if (data) setRecords(data);
    toast({ title: '已新增结算记录' });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">渠道结算</h1>
          <p className="text-slate-500 mt-1 text-sm">管理与支付渠道的结算周期和账务对账</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          新增结算记录
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        {(['ALL', 'PENDING', 'IN_RECONCILIATION', 'SETTLED', 'DISPUTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">加载中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">渠道</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">结算周期</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">应结算金额</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">实际到账金额</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">币种</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">暂无数据</td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onDrillDown(r)}
                >
                  <td className="px-5 py-4 font-medium text-slate-900">{getChannelName(r)}</td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {r.period_start} ~ {r.period_end}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-700">
                    {r.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-700">
                    {r.actual_amount != null
                      ? r.actual_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-4 text-center text-slate-600">{r.currency}</td>
                  <td className="px-5 py-4 text-center">
                    <SettlementStatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NewChannelSettlementModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        channelContracts={channelContracts}
        channels={channels}
        onCreated={handleCreated}
      />
    </div>
  );
}

interface NewChannelSettlementModalProps {
  open: boolean;
  onClose: () => void;
  channelContracts: ChannelContract[];
  channels: Channel[];
  onCreated: (record: ChannelSettlementRecord) => void;
}

function NewChannelSettlementModal({ open, onClose, channelContracts, channels, onCreated }: NewChannelSettlementModalProps) {
  const [contractId, setContractId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [expectedAmount, setExpectedAmount] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const activeContracts = channelContracts.filter((c) => c.status === 'ACTIVE');

  const getChannelName = (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    return ch?.display_name ?? ch?.name ?? channelId;
  };

  const selectedContract = channelContracts.find((c) => c.id === contractId);
  const currency = selectedContract?.currency || 'USD';

  useEffect(() => {
    if (!contractId || !periodStart || !periodEnd) {
      setExpectedAmount(null);
      return;
    }
    let cancelled = false;
    setCalculating(true);
    calculateExpectedAmount(contractId, periodStart, periodEnd)
      .then((amount) => { if (!cancelled) setExpectedAmount(amount); })
      .catch(() => { if (!cancelled) toast({ title: '自动计算失败', variant: 'destructive' }); })
      .finally(() => { if (!cancelled) setCalculating(false); });
    return () => { cancelled = true; };
  }, [contractId, periodStart, periodEnd]);

  const handleContractChange = (value: string) => setContractId(value);
  const handlePeriodStartChange = (value: string) => setPeriodStart(value);
  const handlePeriodEndChange = (value: string) => setPeriodEnd(value);

  const handleSubmit = async () => {
    if (!contractId || !periodStart || !periodEnd || expectedAmount == null) {
      toast({ title: '请填写所有必填项', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const record = await createChannelSettlementRecord({
        channel_contract_id: contractId,
        channel_id: selectedContract!.channel_id,
        period_start: periodStart,
        period_end: periodEnd,
        expected_amount: expectedAmount,
        actual_amount: null,
        currency,
        status: 'PENDING',
        settled_at: null,
        notes: null,
        dispute_history: [],
      });
      onCreated(record);
    } catch {
      toast({ title: '创建失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增渠道结算记录</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>渠道合同</Label>
            <Select value={contractId} onValueChange={handleContractChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择渠道合同" />
              </SelectTrigger>
              <SelectContent>
                {activeContracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {getChannelName(c.channel_id)} — {c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>周期开始</Label>
              <Input type="date" value={periodStart} onChange={(e) => handlePeriodStartChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>周期结束</Label>
              <Input type="date" value={periodEnd} onChange={(e) => handlePeriodEndChange(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>应结算金额</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700">
              {calculating ? (
                <span className="text-slate-400">计算中...</span>
              ) : expectedAmount != null ? (
                <span className="font-medium">系统计算：{expectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              ) : (
                <span className="text-slate-400">请选择合同和周期后自动计算</span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>币种</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700">
              {contractId ? (
                <span className="font-medium">{currency}</span>
              ) : (
                <span className="text-slate-400">由合同自动填写</span>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={saving || calculating || expectedAmount == null}>
            {saving ? '保存中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
