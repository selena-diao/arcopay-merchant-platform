import { useState } from 'react';
import {
  ChannelContract,
  Channel,
  MoontonEntity,
  Onboarding,
  MerchantEntity,
  MerchantAccount,
} from '../../types';
import { ChannelContractStatusBadge } from '../channel/ChannelStatusBadge';
import { MerchantModeBadge } from '../channel/MerchantModeBadge';
import { OnboardingStatusBadge } from '../onboarding/OnboardingStatusBadge';
import { ChannelContractModal } from '../channel/ChannelContractModal';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { ArrowLeft, FileText, Ban, Pencil, ChevronDown, ArrowRight, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { handleSaveError } from '../../lib/errorHandler';
import {
  activateChannelContract,
  terminateChannelContract,
  voidChannelContract,
  upsertChannelContract,
} from '../../lib/contractService';

interface ChannelContractDetailPageProps {
  contract: ChannelContract;
  allContracts: ChannelContract[];
  channels: Channel[];
  moontonEntities: MoontonEntity[];
  onboardings: Onboarding[];
  merchantEntities: MerchantEntity[];
  onContractsChange: (contracts: ChannelContract[]) => void;
  onOnboardingsChange: (onboardings: Onboarding[]) => void;
  onMerchantAccountsChange: (accounts: MerchantAccount[]) => void;
  onBack: () => void;
  onViewOnboarding: (onboarding: Onboarding) => void;
}

export function ChannelContractDetailPage({
  contract,
  allContracts,
  channels,
  moontonEntities,
  onboardings,
  merchantEntities,
  onContractsChange,
  onOnboardingsChange,
  onMerchantAccountsChange,
  onBack,
  onViewOnboarding,
}: ChannelContractDetailPageProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const channel = channels.find((c) => c.id === contract.channel_id);
  const entity = moontonEntities.find((e) => e.id === contract.moonton_entity_id);

  const contractOnboardings = onboardings.filter(
    (ob) => ob.channel_contract_id === contract.id
  );

  const historicalContracts = allContracts
    .filter(
      (c) =>
        c.id !== contract.id &&
        c.channel_id === contract.channel_id &&
        c.moonton_entity_id === contract.moonton_entity_id &&
        c.status !== 'ACTIVE' &&
        c.status !== 'DRAFT'
    )
    .sort((a, b) => (b.signed_at > a.signed_at ? 1 : -1));

  const getSubjectType = (ob: Onboarding) =>
    ob.moonton_entity_id ? '平台主体' : '商家主体';

  const getSubjectName = (ob: Onboarding) => {
    if (ob.moonton_entity_id) {
      return moontonEntities.find((e) => e.id === ob.moonton_entity_id)?.name ?? ob.moonton_entity_id;
    }
    if (ob.merchant_entity_id) {
      return merchantEntities.find((e) => e.id === ob.merchant_entity_id)?.name ?? ob.merchant_entity_id;
    }
    return '—';
  };

  const patchContracts = (updated: ChannelContract) => {
    onContractsChange(allContracts.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleEdit = async (data: Omit<ChannelContract, 'id'>) => {
    const merged: ChannelContract = { ...contract, ...data };
    try {
      const saved = await upsertChannelContract(merged);
      patchContracts(saved);
      setEditOpen(false);
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const updated = await activateChannelContract(contract.id);
      patchContracts(updated);
      toast.success('合同已激活');
    } catch (err) {
      toast.error('激活失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
      setActivateOpen(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminateReason.trim()) return;
    setLoading(true);
    try {
      const updated = await terminateChannelContract(contract.id, terminateReason.trim());
      patchContracts(updated);
      toast.success('合同已终止');
    } catch (err) {
      toast.error('终止失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
      setTerminateOpen(false);
      setTerminateReason('');
    }
  };

  const hasActiveOnboardings = contractOnboardings.some(
    (ob) => ob.status !== 'VOIDED' && ob.status !== 'REJECTED' && ob.status !== 'DRAFT' && ob.status !== 'SUSPENDED'
  );
  const shouldCascade = contract.status === 'ACTIVE' || hasActiveOnboardings;

  const handleVoid = async () => {
    setLoading(true);
    try {
      const result = await voidChannelContract(contract.id, shouldCascade);
      patchContracts(result.contract);

      if (result.onboardings.length > 0) {
        onOnboardingsChange(
          onboardings.map((ob) => {
            const updated = result.onboardings.find((u) => u.id === ob.id);
            return updated ?? ob;
          })
        );
      }

      if (result.merchantAccounts.length > 0) {
        onMerchantAccountsChange(result.merchantAccounts);
      }

      if (shouldCascade && (result.onboardings.length > 0 || result.merchantAccounts.length > 0)) {
        toast.success('合同已作废，关联进件及商户号已冻结');
      } else {
        toast.success('合同已作废');
      }
    } catch (err) {
      toast.error('作废失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
      setVoidOpen(false);
    }
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回渠道合同列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {channel?.display_name ?? contract.channel_id}
                </h1>
                <span className="text-gray-400 text-lg font-light">·</span>
                <span className="text-xl font-semibold text-gray-700">
                  {entity?.name ?? contract.moonton_entity_id}
                </span>
                <MerchantModeBadge mode={contract.merchant_mode} />
                <ChannelContractStatusBadge status={contract.status} />
              </div>
              <p className="text-sm text-gray-400 font-mono mt-1">{contract.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {contract.status === 'DRAFT' && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setActivateOpen(true)}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  激活合同
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-gray-500 border-gray-200 hover:bg-gray-50"
                  onClick={() => setVoidOpen(true)}
                >
                  <Ban className="w-3.5 h-3.5" />
                  作废合同
                </Button>
              </>
            )}
            {contract.status === 'ACTIVE' && (
              <>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setTerminateOpen(true)}
                >
                  <Ban className="w-3.5 h-3.5" />
                  终止合同
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-gray-500 border-gray-200 hover:bg-gray-50"
                  onClick={() => setVoidOpen(true)}
                >
                  <Ban className="w-3.5 h-3.5" />
                  作废合同
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 ml-16 grid grid-cols-4 gap-6">
          <InfoCell label="渠道费率" value={`${(contract.channel_rate * 100).toFixed(2)}%`} mono />
          <InfoCell label="结算周期" value={`${contract.settlement_cycle} 天`} />
          <InfoCell label="签署日期" value={contract.signed_at} />
          {contract.status === 'TERMINATED' && contract.termination_reason && (
            <InfoCell label="终止原因" value={contract.termination_reason} muted />
          )}
          {contract.status === 'VOIDED' && contract.void_reason && (
            <InfoCell label="作废原因" value={contract.void_reason} muted />
          )}
        </div>
      </div>

      <Tabs defaultValue="onboardings">
        <TabsList className="h-9 mb-4">
          <TabsTrigger value="onboardings" className="text-sm px-4">
            进件列表
            {contractOnboardings.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-normal">
                {contractOnboardings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm px-4">
            历史合同
            {historicalContracts.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-normal">
                {historicalContracts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboardings" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {contractOnboardings.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <div className="opacity-20 mb-3">
                  <FileText className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium">暂无进件记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700 w-36">进件ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24">主体类型</TableHead>
                    <TableHead className="font-semibold text-gray-700">主体名称</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">提交时间</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractOnboardings.map((ob) => (
                    <TableRow key={ob.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="font-mono text-xs text-gray-500">{ob.id}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
                            ob.moonton_entity_id
                              ? 'bg-blue-50 text-blue-700 ring-blue-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          )}
                        >
                          {getSubjectType(ob)}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {getSubjectName(ob)}
                      </TableCell>
                      <TableCell>
                        <OnboardingStatusBadge status={ob.status} />
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {ob.submitted_at ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => onViewOnboarding(ob)}
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >
                          查看详情
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          {historicalContracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 flex flex-col items-center justify-center text-gray-400">
              <div className="opacity-20 mb-3">
                <Ban className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium">暂无历史合同</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setHistoryOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-gray-400" />
                  历史合同
                  <span className="text-xs text-gray-400 font-normal">
                    ({historicalContracts.length} 条)
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-gray-400 transition-transform duration-200',
                    historyOpen ? 'rotate-180' : 'rotate-0'
                  )}
                />
              </button>
              {historyOpen && (
                <div className="border-t border-gray-100">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                        <TableHead className="font-semibold text-gray-700 w-28">商户模式</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-28">渠道费率</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-28">结算周期</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-28">签署日期</TableHead>
                        <TableHead className="font-semibold text-gray-700">终止/作废原因</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalContracts.map((c) => (
                        <TableRow key={c.id} className="hover:bg-gray-50/50 opacity-75 transition-colors">
                          <TableCell>
                            <MerchantModeBadge mode={c.merchant_mode} />
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums text-sm text-gray-700">
                            {(c.channel_rate * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {c.settlement_cycle} 天
                          </TableCell>
                          <TableCell>
                            <ChannelContractStatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{c.signed_at}</TableCell>
                          <TableCell className="text-gray-400 text-xs max-w-48 truncate" title={c.termination_reason ?? c.void_reason}>
                            {c.termination_reason ?? c.void_reason ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {editOpen && (
        <ChannelContractModal
          open={editOpen}
          channels={channels}
          moontonEntities={moontonEntities}
          contract={contract}
          onClose={() => setEditOpen(false)}
          onSave={handleEdit}
        />
      )}

      <Dialog open={activateOpen} onOpenChange={(v) => !v && !loading && setActivateOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>激活合同</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">确认激活该合同？激活后合同状态将变为「有效」。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateOpen(false)} disabled={loading}>取消</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={handleActivate}
              disabled={loading}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              确认激活
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={terminateOpen} onOpenChange={(v) => { if (!v && !loading) { setTerminateOpen(false); setTerminateReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>终止合同</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-sm font-medium text-gray-700">终止原因 <span className="text-red-500">*</span></Label>
            <Textarea
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="请输入终止原因..."
              className="resize-none"
              rows={3}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTerminateOpen(false); setTerminateReason(''); }} disabled={loading}>取消</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={handleTerminate}
              disabled={!terminateReason.trim() || loading}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              确认终止
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={voidOpen} onOpenChange={(v) => !v && !loading && setVoidOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>作废合同</DialogTitle>
          </DialogHeader>
          {shouldCascade ? (
            <div className="flex items-start gap-2.5 py-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">该合同下存在进行中的进件或已生效的商户号，作废后将触发级联冻结。确认作废？</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 py-2">确认作废该合同？此操作不可撤销。</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)} disabled={loading}>取消</Button>
            <Button
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-100 gap-1.5"
              onClick={handleVoid}
              disabled={loading}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              确认作废
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCell({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={cn('text-sm font-semibold', mono ? 'tabular-nums' : '', muted ? 'text-gray-400 font-normal' : 'text-gray-800')}>
        {value}
      </p>
    </div>
  );
}
