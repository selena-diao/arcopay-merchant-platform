import { useState } from 'react';
import { updateOnboarding, createMerchantAccount } from '../../lib/contractService';
import {
  Onboarding,
  OnboardingStatus,
  ChannelContract,
  Channel,
  MoontonEntity,
  MerchantEntity,
  MerchantAccount,
} from '../../types';
import { OnboardingStatusBadge } from './OnboardingStatusBadge';
import { MerchantModeBadge } from '../channel/MerchantModeBadge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { ArrowLeft, CircleCheck as CheckCircle2, Circle, Eye, EyeOff, Send, ThumbsUp, ThumbsDown, RotateCcw, Key, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface OnboardingDetailPageProps {
  onboarding: Onboarding;
  channelContracts: ChannelContract[];
  channels: Channel[];
  moontonEntities: MoontonEntity[];
  merchantEntities: MerchantEntity[];
  onOnboardingChange: (updated: Onboarding) => void;
  onMerchantAccountCreated?: () => Promise<void>;
  allMerchantAccounts: MerchantAccount[];
  onBack: () => void;
}

function generateApiKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `mk_live_${result}`;
}

function generateSecretKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return `sk_live_${result}`;
}

export function OnboardingDetailPage({
  onboarding,
  channelContracts,
  channels,
  moontonEntities,
  merchantEntities,
  onOnboardingChange,
  onMerchantAccountCreated,
  allMerchantAccounts,
  onBack,
}: OnboardingDetailPageProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const [confirmReceiptOpen, setConfirmReceiptOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const contract = channelContracts.find((c) => c.id === onboarding.channel_contract_id);
  const channel = contract ? channels.find((c) => c.id === contract.channel_id) : undefined;
  const moontonEntity = onboarding.moonton_entity_id
    ? moontonEntities.find((e) => e.id === onboarding.moonton_entity_id)
    : undefined;
  const merchantEntity = onboarding.merchant_entity_id
    ? merchantEntities.find((e) => e.id === onboarding.merchant_entity_id)
    : undefined;
  const subjectName = moontonEntity?.name ?? merchantEntity?.name ?? '—';
  const subjectType = onboarding.moonton_entity_id ? '平台主体' : '商家主体';

  const linkedAccount = onboarding.merchant_account_id
    ? allMerchantAccounts.find((a) => a.id === onboarding.merchant_account_id)
    : undefined;

  const handleSubmit = async () => {
    const today = new Date().toISOString().slice(0, 10);
    setActionLoading(true);
    try {
      const updated = await updateOnboarding(onboarding.id, { status: 'SUBMITTED', submitted_at: today });
      onOnboardingChange(updated);
    } catch (err) {
      console.error('Failed to submit onboarding:', err);
      toast.error('提交失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    const today = new Date().toISOString().slice(0, 10);
    setActionLoading(true);
    try {
      const newAccount = await createMerchantAccount({
        channel_id: contract?.channel_id ?? '',
        channel_contract_id: onboarding.channel_contract_id,
        onboarding_id: onboarding.id,
        api_key: generateApiKey(),
        secret_key: generateSecretKey(),
        mode: 'LIVE',
        status: 'ACTIVE',
        created_at: today,
      });

      const updated = await updateOnboarding(onboarding.id, {
        status: 'APPROVED',
        approved_at: today,
        merchant_account_id: newAccount.id,
      });
      onOnboardingChange(updated);

      if (onMerchantAccountCreated) {
        await onMerchantAccountCreated();
      }
    } catch (err) {
      console.error('Failed to approve onboarding:', err);
      toast.error('审核通过失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await updateOnboarding(onboarding.id, {
        status: 'REJECTED',
        rejected_reason: rejectReason.trim(),
      });
      onOnboardingChange(updated);
      setRejectDialogOpen(false);
      setRejectReason('');
    } catch (err) {
      console.error('Failed to reject onboarding:', err);
      toast.error('操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setActionLoading(true);
    try {
      const updated = await updateOnboarding(onboarding.id, { status: 'REVIEWING' });
      onOnboardingChange(updated);
      setConfirmReceiptOpen(false);
    } catch (err) {
      console.error('Failed to confirm receipt:', err);
      toast.error('操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = async () => {
    const today = new Date().toISOString().slice(0, 10);
    setActionLoading(true);
    try {
      const updated = await updateOnboarding(onboarding.id, {
        status: 'SUBMITTED',
        submitted_at: today,
        rejected_reason: null,
      });
      onOnboardingChange(updated);
    } catch (err) {
      console.error('Failed to resubmit onboarding:', err);
      toast.error('重新提交失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const isTerminal = onboarding.status === 'APPROVED' || onboarding.status === 'VOIDED' || onboarding.status === 'SUSPENDED';
  const showActionsPanel = !isTerminal;
  const isCascadeFrozen = onboarding.status === 'VOIDED' || onboarding.status === 'SUSPENDED';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        返回进件列表
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{subjectName}</h1>
            <OnboardingStatusBadge status={onboarding.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{channel?.display_name ?? '—'}</span>
            <span className="text-gray-300">·</span>
            {contract && <MerchantModeBadge mode={contract.merchant_mode} />}
            <span className="text-gray-300">·</span>
            <span>{subjectType}</span>
          </div>
        </div>

      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">审核进度</h2>
        <StatusTimeline status={onboarding.status} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <DetailRow label="渠道" value={channel?.display_name ?? '—'} />
          <DetailRow label="进件主体" value={subjectName} />
          <DetailRow label="主体类型" value={subjectType} />
          {contract && (
            <>
              <DetailRow label="合同模式" value={<MerchantModeBadge mode={contract.merchant_mode} />} />
              <DetailRow label="渠道费率" value={`${(contract.channel_rate * 100).toFixed(2)}%`} />
              <DetailRow label="结算周期" value={`${contract.settlement_cycle} 天`} />
            </>
          )}
          <DetailRow label="提交日期" value={onboarding.submitted_at ?? '—'} />
          <DetailRow label="审核日期" value={onboarding.approved_at ?? '—'} />
        </div>

        {onboarding.status === 'REJECTED' && onboarding.rejected_reason && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-xs font-semibold text-red-600 mb-1">拒绝原因</p>
            <p className="text-sm text-red-700">{onboarding.rejected_reason}</p>
          </div>
        )}
      </div>

      {linkedAccount && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-green-600" />
            <h2 className="text-sm font-semibold text-gray-700">已生成商户号</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <DetailRow label="商户号 ID" value={linkedAccount.id} />
            <DetailRow label="模式" value={linkedAccount.mode} />
            <DetailRow label="创建日期" value={linkedAccount.created_at} />
            <div />
            <div className="col-span-2">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-500">API Key</span>
                <span className="text-sm font-mono text-gray-900">{linkedAccount.api_key}</span>
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-500">Secret Key</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-900">
                    {secretVisible ? linkedAccount.secret_key : '••••••••••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => setSecretVisible((v) => !v)}
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {secretVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showActionsPanel && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">操作</h2>
          {isCascadeFrozen ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <Info className="w-4 h-4 flex-shrink-0 text-gray-400" />
              该进件已因合同作废被系统冻结
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {onboarding.status === 'DRAFT' && (
                <Button className="gap-1.5" onClick={handleSubmit} disabled={actionLoading}>
                  <Send className="w-4 h-4" />
                  提交审核
                </Button>
              )}
              {onboarding.status === 'SUBMITTED' && (
                <Button className="gap-1.5" onClick={() => setConfirmReceiptOpen(true)} disabled={actionLoading}>
                  <Info className="w-4 h-4" />
                  确认渠道已收件
                </Button>
              )}
              {onboarding.status === 'REVIEWING' && (
                <>
                  <Button
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    标记已通过
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={actionLoading}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    标记已拒绝
                  </Button>
                </>
              )}
              {onboarding.status === 'REJECTED' && (
                <Button className="gap-1.5" onClick={handleResubmit} disabled={actionLoading}>
                  <RotateCcw className="w-4 h-4" />
                  重新提交
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={confirmReceiptOpen} onOpenChange={(v) => !v && setConfirmReceiptOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认渠道已收件</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">确认渠道已收件？此操作不可撤销，进件状态将更新为「审核中」。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReceiptOpen(false)} disabled={actionLoading}>取消</Button>
            <Button onClick={handleConfirmReceipt} disabled={actionLoading}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={(v) => !v && setRejectDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>标记已拒绝</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-sm font-medium text-gray-700">拒绝原因 <span className="text-red-500">*</span></Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="resize-none"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>取消</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={!rejectReason.trim() || actionLoading}
            >
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusTimeline({ status }: { status: OnboardingStatus }) {
  const isRejected = status === 'REJECTED';

  const node2Label = status === 'REVIEWING' ? '审核中' : '已提交';
  const node3Label = isRejected ? '已拒绝' : '已通过';

  type StepKey = 'node1' | 'node2' | 'node3';
  const steps: { key: StepKey; label: string }[] = [
    { key: 'node1', label: '待提交' },
    { key: 'node2', label: node2Label },
    { key: 'node3', label: node3Label },
  ];

  const getNodeVisualState = (nodeKey: StepKey): 'done' | 'active-blue' | 'active-red' | 'pending' => {
    if (nodeKey === 'node1') {
      if (status === 'DRAFT') return 'active-blue';
      return 'done';
    }
    if (nodeKey === 'node2') {
      if (status === 'DRAFT') return 'pending';
      if (status === 'SUBMITTED' || status === 'REVIEWING') return 'active-blue';
      return 'done';
    }
    if (nodeKey === 'node3') {
      if (status === 'APPROVED') return 'done';
      if (isRejected) return 'active-red';
      return 'pending';
    }
    return 'pending';
  };

  const getConnectorFilled = (afterNodeKey: StepKey): boolean => {
    if (afterNodeKey === 'node2') {
      return status !== 'DRAFT';
    }
    if (afterNodeKey === 'node3') {
      return status === 'APPROVED' || isRejected;
    }
    return false;
  };

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const vs = getNodeVisualState(step.key);
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  vs === 'done' ? 'bg-green-500 text-white' :
                  vs === 'active-blue' ? 'bg-blue-600 text-white' :
                  vs === 'active-red' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-400'
                )}
              >
                {vs === 'done' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs whitespace-nowrap font-medium',
                  vs === 'done' ? 'text-green-600' :
                  vs === 'active-blue' ? 'text-blue-600' :
                  vs === 'active-red' ? 'text-red-600' :
                  'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mb-5 rounded',
                  getConnectorFilled(steps[i + 1].key) ? 'bg-green-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
