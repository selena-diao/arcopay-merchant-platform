import { useState } from 'react';
import { Merchant, MerchantContract, MerchantSettlementRecord, SettlementAccount } from '../../types';
import { transitionMerchantSettlementStatus, appendDisputeNote } from '../../lib/settlementService';
import { SettlementStatusBadge } from './SettlementStatusBadge';
import { Button } from '../ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
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

interface MerchantSettlementDetailPageProps {
  record: MerchantSettlementRecord;
  merchants: Merchant[];
  merchantContracts: MerchantContract[];
  settlementAccounts: SettlementAccount[];
  onBack: () => void;
  onRecordChange: (record: MerchantSettlementRecord) => void;
}

type ActionType = 'start_reconciliation' | 'confirm_settled' | 'mark_disputed' | 're_reconciliation' | 'force_settle' | 'add_dispute_note';

export function MerchantSettlementDetailPage({
  record,
  merchants,
  merchantContracts,
  settlementAccounts,
  onBack,
  onRecordChange,
}: MerchantSettlementDetailPageProps) {
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [actualAmount, setActualAmount] = useState('');
  const [settledAt, setSettledAt] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const merchant = merchants.find((m) => m.id === record.merchant_id);
  const merchantName = merchant?.name ?? record.merchant_id;
  const contract = merchantContracts.find((c) => c.id === record.merchant_contract_id);
  const account = settlementAccounts.find((a) => a.id === record.settlement_account_id);

  const handleAction = async () => {
    if (!activeAction) return;
    setSaving(true);
    try {
      let updated: MerchantSettlementRecord;
      if (activeAction === 'start_reconciliation') {
        updated = await transitionMerchantSettlementStatus(record.id, 'IN_RECONCILIATION');
      } else if (activeAction === 'confirm_settled' || activeAction === 'force_settle') {
        if (!actualAmount || !settledAt) {
          toast({ title: '请填写实际金额和结算日期', variant: 'destructive' });
          setSaving(false);
          return;
        }
        updated = await transitionMerchantSettlementStatus(record.id, 'SETTLED', {
          actual_amount: parseFloat(actualAmount),
          settled_at: settledAt,
        });
      } else if (activeAction === 'mark_disputed') {
        if (!noteInput.trim()) {
          toast({ title: '请填写争议备注', variant: 'destructive' });
          setSaving(false);
          return;
        }
        updated = await transitionMerchantSettlementStatus(record.id, 'DISPUTED', {
          notes: noteInput,
          operator: 'ops-admin',
        });
      } else if (activeAction === 're_reconciliation') {
        updated = await transitionMerchantSettlementStatus(record.id, 'IN_RECONCILIATION');
      } else if (activeAction === 'add_dispute_note') {
        if (!noteInput.trim()) {
          toast({ title: '请填写备注内容', variant: 'destructive' });
          setSaving(false);
          return;
        }
        updated = await appendDisputeNote('merchant', record.id, noteInput) as MerchantSettlementRecord;
      } else {
        setSaving(false);
        return;
      }
      onRecordChange(updated);
      setActiveAction(null);
      setActualAmount('');
      setSettledAt('');
      setNoteInput('');
      toast({ title: '操作成功' });
    } catch {
      toast({ title: '操作失败', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const actionLabel: Record<ActionType, string> = {
    start_reconciliation: '开始对账',
    confirm_settled: '确认结算',
    mark_disputed: '标记争议',
    re_reconciliation: '重新对账',
    force_settle: '强制结算',
    add_dispute_note: '添加备注',
  };

  const needsAmountAndDate = activeAction === 'confirm_settled' || activeAction === 'force_settle';
  const needsNote = activeAction === 'mark_disputed' || activeAction === 'add_dispute_note';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回游戏方结算列表
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{merchantName} — 结算详情</h1>
          <p className="text-slate-500 mt-1 text-sm">记录 ID: {record.id}</p>
        </div>
        <SettlementStatusBadge status={record.status} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <Field label="游戏方" value={merchantName} />
          <Field label="游戏侧合同" value={contract ? contract.id : record.merchant_contract_id} />
          <Field label="结算账户" value={account?.account_name ?? record.settlement_account_id} />
          {account?.bank_info && <Field label="银行账户" value={account.bank_info} />}
          <Field label="结算周期" value={`${record.period_start} ~ ${record.period_end}`} />
          <Field label="币种" value={record.currency} />
          <Field
            label="应结算金额"
            value={record.expected_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          />
          <Field
            label="实际打款金额"
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

      {record.status !== 'SETTLED' && (
        <div className="flex flex-wrap gap-3 mb-6">
          {record.status === 'PENDING' && (
            <Button onClick={() => setActiveAction('start_reconciliation')}>开始对账</Button>
          )}
          {record.status === 'IN_RECONCILIATION' && (
            <>
              <Button onClick={() => setActiveAction('confirm_settled')}>确认结算</Button>
              <Button variant="destructive" onClick={() => setActiveAction('mark_disputed')}>标记争议</Button>
            </>
          )}
          {record.status === 'DISPUTED' && (
            <>
              <Button variant="outline" onClick={() => setActiveAction('re_reconciliation')}>重新对账</Button>
              <Button onClick={() => setActiveAction('force_settle')}>强制结算</Button>
              <Button variant="outline" onClick={() => setActiveAction('add_dispute_note')}>添加备注</Button>
            </>
          )}
        </div>
      )}

      {record.dispute_history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">争议历史</h2>
          <div className="space-y-4">
            {record.dispute_history.map((entry, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  {i < record.dispute_history.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  )}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700">{entry.operator}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.time).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{entry.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={activeAction !== null} onOpenChange={() => setActiveAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{activeAction ? actionLabel[activeAction] : ''}</DialogTitle>
            <DialogDescription>
              {activeAction === 'start_reconciliation' && '确认开始对账？此操作将状态变更为对账中。'}
              {activeAction === 're_reconciliation' && '确认重新对账？此操作将状态变更为对账中。'}
              {needsAmountAndDate && '请填写实际结算金额和结算日期。'}
              {needsNote && '请填写备注内容。'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {needsAmountAndDate && (
              <>
                <div className="space-y-1.5">
                  <Label>实际打款金额</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>结算日期</Label>
                  <Input
                    type="date"
                    value={settledAt}
                    onChange={(e) => setSettledAt(e.target.value)}
                  />
                </div>
              </>
            )}
            {needsNote && (
              <div className="space-y-1.5">
                <Label>备注</Label>
                <Textarea
                  rows={3}
                  placeholder="请输入备注内容..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveAction(null)}>取消</Button>
            <Button
              onClick={handleAction}
              disabled={saving}
              variant={activeAction === 'mark_disputed' ? 'destructive' : 'default'}
            >
              {saving ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
