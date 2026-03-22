import { useState, useEffect, useMemo } from 'react';
import {
  Merchant,
  MerchantContract,
  MerchantSettlementRecord,
  SettlementAccount,
  SettlementRecordStatus,
} from '../../types';
import {
  fetchMerchantSettlementRecords,
  createMerchantSettlementRecord,
  calculateMerchantExpectedAmount,
} from '../../lib/settlementService';
import { SettlementStatusBadge } from './SettlementStatusBadge';
import { Button } from '../ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';

interface MerchantSettlementPageProps {
  merchants: Merchant[];
  merchantContracts: MerchantContract[];
  settlementAccounts: SettlementAccount[];
  onDrillDown: (record: MerchantSettlementRecord) => void;
}

const STATUS_LABELS: Record<string, string> = {
  ALL: '全部',
  PENDING: '待结算',
  IN_RECONCILIATION: '对账中',
  SETTLED: '已结算',
  DISPUTED: '争议中',
};

export function MerchantSettlementPage({
  merchants,
  merchantContracts,
  settlementAccounts,
  onDrillDown,
}: MerchantSettlementPageProps) {
  const [records, setRecords] = useState<MerchantSettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | SettlementRecordStatus>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMerchantSettlementRecords()
      .then(setRecords)
      .catch(() => toast({ title: '加载失败', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return records;
    return records.filter((r) => r.status === statusFilter);
  }, [records, statusFilter]);

  const getMerchantName = (merchantId: string) => {
    return merchants.find((m) => m.id === merchantId)?.name ?? merchantId;
  };

  const getAccountName = (accountId: string) => {
    return settlementAccounts.find((a) => a.id === accountId)?.account_name ?? accountId;
  };

  const handleCreated = async (_record: MerchantSettlementRecord) => {
    setShowNewModal(false);
    const data = await fetchMerchantSettlementRecords().catch(() => null);
    if (data) setRecords(data);
    toast({ title: '已新增结算记录' });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">游戏方结算</h1>
          <p className="text-slate-500 mt-1 text-sm">管理与游戏方的结算周期和打款账务</p>
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
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">游戏方</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">结算账户</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">结算周期</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">应结算金额</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">实际打款金额</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">币种</th>
                <th className="text-center px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">状态</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 text-sm">暂无数据</td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => onDrillDown(r)}
                >
                  <td className="px-5 py-4 font-medium text-slate-900">{getMerchantName(r.merchant_id)}</td>
                  <td className="px-5 py-4 text-slate-600 max-w-[180px] truncate">
                    {getAccountName(r.settlement_account_id)}
                  </td>
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

      <NewMerchantSettlementModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        merchants={merchants}
        merchantContracts={merchantContracts}
        settlementAccounts={settlementAccounts}
        onCreated={handleCreated}
      />
    </div>
  );
}

interface NewMerchantSettlementModalProps {
  open: boolean;
  onClose: () => void;
  merchants: Merchant[];
  merchantContracts: MerchantContract[];
  settlementAccounts: SettlementAccount[];
  onCreated: (record: MerchantSettlementRecord) => void;
}

function NewMerchantSettlementModal({
  open,
  onClose,
  merchants,
  merchantContracts,
  settlementAccounts,
  onCreated,
}: NewMerchantSettlementModalProps) {
  const [contractId, setContractId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [expectedAmount, setExpectedAmount] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const activeContracts = merchantContracts.filter((c) => c.status === 'ACTIVE');

  const selectedContract = merchantContracts.find((c) => c.id === contractId);
  const currency = selectedContract?.currency || 'USD';

  const filteredAccounts = useMemo(() => {
    if (!selectedContract) return [];
    return settlementAccounts.filter((a) => a.merchant_id === selectedContract.merchant_id && a.status === 'ACTIVE');
  }, [selectedContract, settlementAccounts]);

  const getMerchantName = (merchantId: string) =>
    merchants.find((m) => m.id === merchantId)?.name ?? merchantId;

  useEffect(() => {
    if (!contractId || !periodStart || !periodEnd) {
      setExpectedAmount(null);
      return;
    }
    let cancelled = false;
    setCalculating(true);
    calculateMerchantExpectedAmount(contractId, periodStart, periodEnd)
      .then((amount) => { if (!cancelled) setExpectedAmount(amount); })
      .catch(() => { if (!cancelled) toast({ title: '自动计算失败', variant: 'destructive' }); })
      .finally(() => { if (!cancelled) setCalculating(false); });
    return () => { cancelled = true; };
  }, [contractId, periodStart, periodEnd]);

  const handleContractChange = (value: string) => { setContractId(value); setAccountId(''); };
  const handlePeriodStartChange = (value: string) => setPeriodStart(value);
  const handlePeriodEndChange = (value: string) => setPeriodEnd(value);

  const handleSubmit = async () => {
    if (!contractId || !accountId || !periodStart || !periodEnd || expectedAmount == null) {
      toast({ title: '请填写所有必填项', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const record = await createMerchantSettlementRecord({
        merchant_contract_id: contractId,
        merchant_id: selectedContract!.merchant_id,
        settlement_account_id: accountId,
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
          <DialogTitle>新增游戏方结算记录</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>游戏侧合同</Label>
            <Select value={contractId} onValueChange={handleContractChange}>
              <SelectTrigger>
                <SelectValue placeholder="选择游戏侧合同" />
              </SelectTrigger>
              <SelectContent>
                {activeContracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {getMerchantName(c.merchant_id)} — {c.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>结算账户</Label>
            <Select
              value={accountId}
              onValueChange={setAccountId}
              disabled={!contractId}
            >
              <SelectTrigger>
                <SelectValue placeholder={contractId ? '选择结算账户' : '请先选择合同'} />
              </SelectTrigger>
              <SelectContent>
                {filteredAccounts.length === 0 && (
                  <SelectItem value="__none__" disabled>该游戏方暂无有效结算账户</SelectItem>
                )}
                {filteredAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.account_name}
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
