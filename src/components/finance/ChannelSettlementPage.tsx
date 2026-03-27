import { useState, useEffect, useMemo } from 'react';
import { Channel, ChannelContract, ChannelSettlementRecord, SettlementRecordStatus } from '../../types';
import {
  fetchChannelSettlementRecords,
  createChannelSettlementRecord,
  calculateExpectedAmount,
} from '../../lib/settlementService';
import { SettlementStatusBadge } from './SettlementStatusBadge';
import { Button } from '../ui/button';
import { Plus, ChevronRight, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
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
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannelSettlementRecords()
      .then(setRecords)
      .catch(() => toast({ title: '加载失败', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (channelFilter !== 'ALL') {
        const matchDirect = r.channel_id === channelFilter;
        if (!matchDirect) {
          const contract = channelContracts.find((cc) => cc.id === r.channel_contract_id);
          if (!contract || contract.channel_id !== channelFilter) return false;
        }
      }
      if (dateStart && r.period_start < dateStart) return false;
      if (dateEnd && r.period_end > dateEnd) return false;
      return true;
    });
  }, [records, statusFilter, channelFilter, dateStart, dateEnd, channelContracts]);

  const handleReset = () => {
    setChannelFilter('ALL');
    setStatusFilter('ALL');
    setDateStart('');
    setDateEnd('');
  };

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
          发起结算
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部渠道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部渠道</SelectItem>
            {channels.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.display_name ?? c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'ALL' | SettlementRecordStatus)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            {(['ALL', 'PENDING', 'IN_RECONCILIATION', 'SETTLED', 'DISPUTED'] as const).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-40 text-sm"
            placeholder="开始日期"
          />
          <span className="text-slate-400 text-sm">—</span>
          <Input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-40 text-sm"
            placeholder="结束日期"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-slate-500">
          <RotateCcw className="w-3.5 h-3.5" />
          重置
        </Button>
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

  const today = new Date();
  const periodEnd = today.toISOString().slice(0, 10);
  const periodStart = selectedContract
    ? (() => {
        const d = new Date(today);
        d.setDate(d.getDate() - selectedContract.settlement_cycle);
        return d.toISOString().slice(0, 10);
      })()
    : '';

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

  const handleClose = () => {
    setContractId('');
    setExpectedAmount(null);
    onClose();
  };

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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新建结算周期</DialogTitle>
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

          <div className="space-y-1.5">
            <Label>结算周期</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700">
              {selectedContract ? (
                <span className="font-medium">{periodStart} ~ {periodEnd}</span>
              ) : (
                <span className="text-slate-400">选择合同后自动计算</span>
              )}
            </div>
            {selectedContract && (
              <p className="text-xs text-slate-400">
                基于合同结算周期 {selectedContract.settlement_cycle} 天，结束日期为今日
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>应结算金额</Label>
            <div className="h-10 flex items-center px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-700">
              {calculating ? (
                <span className="text-slate-400">计算中...</span>
              ) : expectedAmount != null ? (
                <span className="font-medium">系统计算：{expectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              ) : (
                <span className="text-slate-400">请先选择合同</span>
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
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={saving || calculating || expectedAmount == null}>
            {saving ? '保存中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
