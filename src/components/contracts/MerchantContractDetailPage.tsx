import { useState } from 'react';
import {
  MerchantContract,
  ContractPaymentMethod,
  PaymentMethod,
  Merchant,
  MoontonEntity,
} from '../../types';
import { MerchantContractStatusBadge } from './MerchantContractStatusBadge';
import { MerchantContractModal } from './MerchantContractModal';
import { toast } from 'sonner';
import { handleSaveError } from '../../lib/errorHandler';
import {
  activateMerchantContract,
  terminateMerchantContract,
  voidMerchantContract,
  upsertMerchantContract,
  insertContractPaymentMethod,
  upsertContractPaymentMethod,
} from '../../lib/contractService';
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
import { Switch } from '../ui/switch';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { ArrowLeft, Handshake, Plus, Pencil, Info, Ban, ChevronDown, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ContractPaymentMethodModal } from './ContractPaymentMethodModal';

interface MerchantContractDetailPageProps {
  contract: MerchantContract;
  allContracts: MerchantContract[];
  merchants: Merchant[];
  moontonEntities: MoontonEntity[];
  contractPaymentMethods: ContractPaymentMethod[];
  paymentMethods: PaymentMethod[];
  onContractsChange: (contracts: MerchantContract[]) => void;
  onContractPaymentMethodsChange: (methods: ContractPaymentMethod[]) => void;
  onBack: () => void;
}

export function MerchantContractDetailPage({
  contract,
  allContracts,
  merchants,
  moontonEntities,
  contractPaymentMethods,
  paymentMethods,
  onContractsChange,
  onContractPaymentMethodsChange,
  onBack,
}: MerchantContractDetailPageProps) {
  const [cpmModalOpen, setCpmModalOpen] = useState(false);
  const [editingCpm, setEditingCpm] = useState<ContractPaymentMethod | null>(null);
  const [disablingCpm, setDisablingCpm] = useState<ContractPaymentMethod | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const merchant = merchants.find((m) => m.id === contract.merchant_id);
  const entity = moontonEntities.find((e) => e.id === contract.moonton_entity_id);

  const contractCpms = contractPaymentMethods.filter(
    (cpm) => cpm.merchant_contract_id === contract.id
  );

  const historicalContracts = allContracts
    .filter(
      (c) =>
        c.id !== contract.id &&
        c.merchant_id === contract.merchant_id &&
        c.moonton_entity_id === contract.moonton_entity_id &&
        c.status !== 'ACTIVE' &&
        c.status !== 'DRAFT'
    )
    .sort((a, b) => (b.signed_at > a.signed_at ? 1 : -1));

  const getPaymentMethodName = (pmId: string) =>
    paymentMethods.find((pm) => pm.id === pmId)?.name ?? pmId;

  const patchContracts = (updated: MerchantContract) => {
    onContractsChange(allContracts.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleSaveCpm = async (data: Omit<ContractPaymentMethod, 'id'>) => {
    if (editingCpm) {
      const updated = { ...editingCpm, ...data };
      try {
        const saved = await upsertContractPaymentMethod(updated);
        onContractPaymentMethodsChange(
          contractPaymentMethods.map((cpm) => cpm.id === editingCpm.id ? saved : cpm)
        );
        setCpmModalOpen(false);
        setEditingCpm(null);
      } catch (err) {
        handleSaveError(err);
      }
    } else {
      try {
        const saved = await insertContractPaymentMethod(data);
        onContractPaymentMethodsChange([...contractPaymentMethods, saved]);
        setCpmModalOpen(false);
        setEditingCpm(null);
      } catch (err) {
        handleSaveError(err);
      }
    }
  };

  const handleDisable = async () => {
    if (!disablingCpm) return;
    const updated = { ...disablingCpm, status: 'INACTIVE' as const };
    try {
      const saved = await upsertContractPaymentMethod(updated);
      onContractPaymentMethodsChange(
        contractPaymentMethods.map((cpm) => cpm.id === disablingCpm.id ? saved : cpm)
      );
    } catch (err) {
      handleSaveError(err);
    }
    setDisablingCpm(null);
  };

  const handleToggleStatus = async (cpm: ContractPaymentMethod) => {
    if (cpm.status === 'ACTIVE') {
      setDisablingCpm(cpm);
    } else {
      const updated = { ...cpm, status: 'ACTIVE' as const };
      try {
        const saved = await upsertContractPaymentMethod(updated);
        onContractPaymentMethodsChange(
          contractPaymentMethods.map((c) => c.id === cpm.id ? saved : c)
        );
      } catch (err) {
        handleSaveError(err);
      }
    }
  };

  const handleEdit = async (data: Omit<MerchantContract, 'id'>) => {
    const merged: MerchantContract = { ...contract, ...data };
    try {
      const saved = await upsertMerchantContract(merged);
      patchContracts(saved);
      setEditOpen(false);
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const updated = await activateMerchantContract(contract.id);
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
      const updated = await terminateMerchantContract(contract.id, terminateReason.trim());
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

  const handleVoid = async () => {
    setLoading(true);
    try {
      const updated = await voidMerchantContract(contract.id);
      patchContracts(updated);
      toast.success('合同已作废');
    } catch (err) {
      toast.error('作废失败，请重试');
      console.error(err);
    } finally {
      setLoading(false);
      setVoidOpen(false);
    }
  };

  const hasActiveCpms = contractCpms.some((cpm) => cpm.status === 'ACTIVE');

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回合同列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Handshake className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {merchant?.name ?? contract.merchant_id}
                </h1>
                <span className="text-gray-400 text-lg font-light">·</span>
                <span className="text-xl font-semibold text-gray-700">
                  {entity?.name ?? contract.moonton_entity_id}
                </span>
                <MerchantContractStatusBadge status={contract.status} />
              </div>
              <p className="text-sm text-gray-400 font-mono mt-1">{contract.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right mr-4">
              <div className="text-2xl font-bold tabular-nums text-gray-800">
                {(contract.quoted_rate * 100).toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400 mt-0.5">游戏侧费率</div>
            </div>
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
          <InfoCell label="结算周期" value={`${contract.settlement_cycle} 天`} />
          <InfoCell label="签署日期" value={contract.signed_at} />
          <InfoCell label="约定支付方式" value={`${contractCpms.length} 种`} />
          {contract.status === 'TERMINATED' && contract.terminated_reason && (
            <InfoCell label="终止原因" value={contract.terminated_reason} muted />
          )}
          {contract.status === 'VOIDED' && contract.void_reason && (
            <InfoCell label="作废原因" value={contract.void_reason} muted />
          )}
        </div>
      </div>

      <Tabs defaultValue="payment-methods">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="payment-methods" className="text-sm px-4">
              支付方式与费率
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
          <TabsContent value="payment-methods" className="mt-0">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { setEditingCpm(null); setCpmModalOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" />
              新增约定支付方式
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="payment-methods" className="mt-0 space-y-3">
          <div className="flex items-start gap-1.5 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>此处约定的支付方式为游戏方可使用的范围，应用支付配置只能从此列表中选择</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {contractCpms.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <div className="opacity-20 mb-3">
                  <Handshake className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium">暂无约定支付方式</p>
                <p className="text-xs mt-1">点击「新增约定支付方式」添加</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700 w-40">支付方式</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-32">费率</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-36 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractCpms.map((cpm) => (
                    <TableRow key={cpm.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {getPaymentMethodName(cpm.payment_method_id)}
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-sm text-gray-700">
                        {(cpm.quoted_rate * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                            cpm.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-gray-100 text-gray-500 ring-gray-200'
                          }`}
                        >
                          {cpm.status === 'ACTIVE' ? '启用' : '停用'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => { setEditingCpm(cpm); setCpmModalOpen(true); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Switch
                            checked={cpm.status === 'ACTIVE'}
                            onCheckedChange={() => handleToggleStatus(cpm)}
                          />
                        </div>
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
                        <TableHead className="font-semibold text-gray-700 w-28">游戏侧费率</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-28">结算周期</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
                        <TableHead className="font-semibold text-gray-700 w-28">签署日期</TableHead>
                        <TableHead className="font-semibold text-gray-700">终止/作废原因</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalContracts.map((c) => (
                        <TableRow key={c.id} className="hover:bg-gray-50/50 opacity-75 transition-colors">
                          <TableCell className="font-semibold tabular-nums text-sm text-gray-700">
                            {(c.quoted_rate * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{c.settlement_cycle} 天</TableCell>
                          <TableCell>
                            <MerchantContractStatusBadge status={c.status} />
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">{c.signed_at}</TableCell>
                          <TableCell className="text-gray-400 text-xs max-w-48 truncate" title={c.terminated_reason ?? c.void_reason}>
                            {c.terminated_reason ?? c.void_reason ?? '—'}
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

      <ContractPaymentMethodModal
        open={cpmModalOpen}
        record={editingCpm}
        contractId={contract.id}
        existingForContract={contractCpms}
        paymentMethods={paymentMethods}
        onClose={() => { setCpmModalOpen(false); setEditingCpm(null); }}
        onSave={handleSaveCpm}
      />

      <ConfirmDialog
        open={!!disablingCpm}
        title="确认停用"
        description="停用后游戏方将无法使用该支付方式，确认停用？"
        onConfirm={handleDisable}
        onCancel={() => setDisablingCpm(null)}
      />

      <MerchantContractModal
        open={editOpen}
        moontonEntities={moontonEntities}
        merchants={merchants}
        channelContracts={[]}
        contract={contract}
        onClose={() => setEditOpen(false)}
        onSave={handleEdit}
      />

      <Dialog open={activateOpen} onOpenChange={(v) => !v && !loading && setActivateOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>激活合同</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">确认激活该合同？激活后合同状态将变为「有效」。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateOpen(false)} disabled={loading}>取消</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" onClick={handleActivate} disabled={loading}>
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
          {contract.status === 'ACTIVE' || hasActiveCpms ? (
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
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={cn('text-sm font-semibold', muted ? 'text-gray-400 font-normal' : 'text-gray-800')}>
        {value}
      </p>
    </div>
  );
}
