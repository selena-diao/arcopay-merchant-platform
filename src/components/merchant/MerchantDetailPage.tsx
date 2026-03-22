import { useState } from 'react';
import {
  Merchant,
  MerchantEntity,
  Application,
  MerchantKYBRecord,
  KYBRecordBase,
  SettlementAccount,
  AppPaymentConfig,
  PaymentMethod,
  MerchantContract,
  ContractPaymentMethod,
  Channel,
} from '../../types';
import {
  createMerchantEntity,
  updateMerchantEntity,
  deleteMerchantEntity,
  createApplication,
  updateApplication,
  deleteApplication,
  createMerchantKybRecord,
  updateMerchantKybRecord,
  deleteMerchantKybRecord,
} from '../../lib/merchantService';
import { RegionBadge } from '../shared/RegionBadge';
import { KybStatusBadge } from '../shared/KybStatusBadge';
import { AppStatusBadge } from '../shared/AppStatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { MerchantEntityModal } from './MerchantEntityModal';
import { ApplicationModal } from './ApplicationModal';
import { KybRecordsSection } from '../kyb/KybRecordsSection';
import { AppPaymentConfigTab } from '../payment/AppPaymentConfigTab';
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
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  FileText,
  Calendar,
  Layers,
  AppWindow,
  ChevronRight,
  Building2,
  Info,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';
import { toast } from 'sonner';

interface MerchantDetailPageProps {
  merchant: Merchant;
  allEntities: MerchantEntity[];
  allApplications: Application[];
  merchantKybRecords: MerchantKYBRecord[];
  channels: Channel[];
  settlementAccounts: SettlementAccount[];
  appPaymentConfigs: AppPaymentConfig[];
  paymentMethods: PaymentMethod[];
  allMerchants: Merchant[];
  merchantContracts: MerchantContract[];
  contractPaymentMethods: ContractPaymentMethod[];
  onRefreshEntities: () => void;
  onRefreshApplications: () => void;
  onRefreshMerchantKybRecords: () => void;
  onSettlementAccountSave: (data: Omit<SettlementAccount, 'id' | 'merchant_id'>, merchantId: string, existingId?: string) => Promise<void>;
  onAppPaymentConfigSave: (data: Omit<AppPaymentConfig, 'id'>, existingId?: string) => Promise<void>;
  onAppPaymentConfigToggle: (config: AppPaymentConfig) => Promise<void>;
  onNavigateToAppPaymentConfigs: () => void;
  onBack: () => void;
}

export function MerchantDetailPage({
  merchant,
  allEntities,
  allApplications,
  merchantKybRecords,
  channels,
  settlementAccounts,
  appPaymentConfigs,
  paymentMethods,
  allMerchants,
  merchantContracts,
  contractPaymentMethods,
  onRefreshEntities,
  onRefreshApplications,
  onRefreshMerchantKybRecords,
  onSettlementAccountSave,
  onAppPaymentConfigSave,
  onAppPaymentConfigToggle,
  onNavigateToAppPaymentConfigs,
  onBack,
}: MerchantDetailPageProps) {
  const entities = allEntities.filter((e) => e.merchant_id === merchant.id);
  const applications = allApplications.filter((a) => a.merchant_id === merchant.id);
  const merchantSettlementAccounts = settlementAccounts.filter((sa) => sa.merchant_id === merchant.id);

  const [selectedEntity, setSelectedEntity] = useState<MerchantEntity | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [editEntityTarget, setEditEntityTarget] = useState<MerchantEntity | null>(null);
  const [deleteEntityTarget, setDeleteEntityTarget] = useState<MerchantEntity | null>(null);

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editAppTarget, setEditAppTarget] = useState<Application | null>(null);
  const [deleteAppTarget, setDeleteAppTarget] = useState<Application | null>(null);

  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [editSettlementTarget, setEditSettlementTarget] = useState<SettlementAccount | null>(null);

  const getKybCount = (entityId: string) =>
    merchantKybRecords.filter((r) => r.merchant_entity_id === entityId).length;

  const getKybSummaryStatus = (entityId: string) => {
    const records = merchantKybRecords.filter((r) => r.merchant_entity_id === entityId);
    if (records.length === 0) return null;
    if (records.some((r) => r.status === 'REJECTED')) return 'REJECTED' as const;
    if (records.some((r) => r.status === 'PENDING')) return 'PENDING' as const;
    return 'APPROVED' as const;
  };

  const handleSaveEntity = async (data: Omit<MerchantEntity, 'id' | 'created_at'>) => {
    try {
      if (editEntityTarget) {
        await updateMerchantEntity(editEntityTarget.id, data);
      } else {
        await createMerchantEntity(data);
      }
      setEntityModalOpen(false);
      setEditEntityTarget(null);
      onRefreshEntities();
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleDeleteEntity = async () => {
    if (!deleteEntityTarget) return;
    if (selectedEntity?.id === deleteEntityTarget.id) setSelectedEntity(null);
    try {
      await deleteMerchantEntity(deleteEntityTarget.id);
      toast.success('法律主体已删除');
    } catch (err) {
      handleSaveError(err);
    }
    setDeleteEntityTarget(null);
    onRefreshEntities();
  };

  const handleSaveApp = async (data: Omit<Application, 'id' | 'created_at'>) => {
    try {
      if (editAppTarget) {
        await updateApplication(editAppTarget.id, data);
      } else {
        await createApplication(data);
      }
      setAppModalOpen(false);
      setEditAppTarget(null);
      onRefreshApplications();
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleDeleteApp = async () => {
    if (!deleteAppTarget) return;
    try {
      await deleteApplication(deleteAppTarget.id);
      toast.success('应用已删除');
    } catch (err) {
      handleSaveError(err);
    }
    setDeleteAppTarget(null);
    onRefreshApplications();
  };

  const handleSaveSettlement = async (data: Omit<SettlementAccount, 'id' | 'merchant_id'>) => {
    try {
      await onSettlementAccountSave(data, merchant.id, editSettlementTarget?.id);
      setSettlementModalOpen(false);
      setEditSettlementTarget(null);
    } catch (err) {
      handleSaveError(err);
    }
  };

  if (selectedEntity) {
    const entityRecords: KYBRecordBase[] = merchantKybRecords
      .filter((r) => r.merchant_entity_id === selectedEntity.id)
      .map(({ id, channel_id, status, submitted_at, reviewed_at, notes }) => ({
        id, channel_id, status, submitted_at, reviewed_at, notes,
      }));

    const handleKybSave = async (data: Omit<KYBRecordBase, 'id'>, existingId?: string) => {
      try {
        if (existingId) {
          await updateMerchantKybRecord(existingId, data);
        } else {
          await createMerchantKybRecord(selectedEntity.id, data);
        }
        onRefreshMerchantKybRecords();
      } catch (err) {
        handleSaveError(err);
      }
    };

    const handleKybDelete = async (id: string) => {
      try {
        await deleteMerchantKybRecord(id);
        toast.success('KYB 记录已删除');
      } catch (err) {
        handleSaveError(err);
      }
      onRefreshMerchantKybRecords();
    };

    return (
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">商家管理</button>
          <span className="text-gray-300">/</span>
          <button onClick={() => setSelectedEntity(null)} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">{merchant.name}</button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium">{selectedEntity.name}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedEntity.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{selectedEntity.full_legal_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 ml-[52px]">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />创建于 {selectedEntity.created_at}</span>
            <RegionBadge region={selectedEntity.region} />
          </div>
        </div>
        <KybRecordsSection records={entityRecords} channels={channels} onSave={handleKybSave} onDelete={handleKybDelete} />
      </div>
    );
  }

  if (selectedApp) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">商家管理</button>
          <span className="text-gray-300">/</span>
          <button onClick={() => setSelectedApp(null)} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">{merchant.name}</button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium">{selectedApp.name}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <AppWindow className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedApp.name}</h1>
              <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">{selectedApp.bundle_id}</code>
            </div>
            <div className="ml-2">
              <AppStatusBadge status={selectedApp.status} />
            </div>
          </div>
        </div>
        <AppPaymentConfigTab
          app={selectedApp}
          merchants={allMerchants}
          configs={appPaymentConfigs}
          paymentMethods={paymentMethods}
          settlementAccounts={settlementAccounts}
          merchantContracts={merchantContracts}
          contractPaymentMethods={contractPaymentMethods}
          onSaveConfig={onAppPaymentConfigSave}
          onToggleConfig={onAppPaymentConfigToggle}
          onNavigateToGlobal={onNavigateToAppPaymentConfigs}
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回商家列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <span className="text-lg font-bold text-teal-700">{merchant.name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
        </div>
        <div className="flex items-center gap-5 text-sm text-gray-500 ml-[52px]">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />创建于 {merchant.created_at}</span>
          <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" />{entities.length} 个法律主体</span>
          <span className="flex items-center gap-1.5"><AppWindow className="w-3.5 h-3.5" />{applications.length} 个应用</span>
        </div>
      </div>

      <Tabs defaultValue="entities">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="entities" className="text-sm px-4">法律主体</TabsTrigger>
            <TabsTrigger value="applications" className="text-sm px-4">店铺</TabsTrigger>
            <TabsTrigger value="settlement" className="text-sm px-4">结算账户</TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="mt-0">
            <Button size="sm" className="gap-1.5" onClick={() => { setEditEntityTarget(null); setEntityModalOpen(true); }}>
              <Plus className="w-4 h-4" />新增主体
            </Button>
          </TabsContent>
          <TabsContent value="applications" className="mt-0">
            <Button size="sm" className="gap-1.5" onClick={() => { setEditAppTarget(null); setAppModalOpen(true); }}>
              <Plus className="w-4 h-4" />新增店铺
            </Button>
          </TabsContent>
          <TabsContent value="settlement" className="mt-0">
            <Button size="sm" className="gap-1.5" onClick={() => { setEditSettlementTarget(null); setSettlementModalOpen(true); }}>
              <Plus className="w-4 h-4" />新增结算账户
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="entities" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {entities.length === 0 ? (
              <EmptyState icon={<FileText className="w-10 h-10" />} text="暂无法律主体" hint="点击「新增主体」添加第一个法律主体" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700 w-36">显示名称</TableHead>
                    <TableHead className="font-semibold text-gray-700">法律全称</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">注册地区</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-44">KYB 记录</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">创建日期</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map((entity) => {
                    const kybCount = getKybCount(entity.id);
                    const summaryStatus = getKybSummaryStatus(entity.id);
                    return (
                      <TableRow key={entity.id} className="hover:bg-gray-50/70 transition-colors">
                        <TableCell>
                          <button
                            onClick={() => setSelectedEntity(entity)}
                            className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors group"
                          >
                            {entity.name}
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">{entity.full_legal_name}</TableCell>
                        <TableCell><RegionBadge region={entity.region} /></TableCell>
                        <TableCell>
                          {kybCount === 0 ? (
                            <span className="text-xs text-gray-400">暂无记录</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{kybCount}</span>
                              {summaryStatus && <KybStatusBadge status={summaryStatus} />}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{entity.created_at}</TableCell>
                        <TableCell className="text-right">
                          <RowActions
                            onEdit={() => { setEditEntityTarget(entity); setEntityModalOpen(true); }}
                            onDelete={() => setDeleteEntityTarget(entity)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {applications.length === 0 ? (
              <EmptyState icon={<AppWindow className="w-10 h-10" />} text="暂无应用" hint="点击「新增店铺」添加第一个应用" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700">店铺名称</TableHead>
                    <TableHead className="font-semibold text-gray-700">店铺域名</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">状态</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">创建日期</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors group"
                        >
                          {app.name}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{app.bundle_id}</code>
                      </TableCell>
                      <TableCell><AppStatusBadge status={app.status} /></TableCell>
                      <TableCell className="text-gray-500 text-sm">{app.created_at}</TableCell>
                      <TableCell className="text-right">
                        <RowActions
                          onEdit={() => { setEditAppTarget(app); setAppModalOpen(true); }}
                          onDelete={() => setDeleteAppTarget(app)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settlement" className="mt-0">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-4 text-sm text-amber-700">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>结算账户由 ArcoPay 运营团队录入，请联系运营人员添加或修改。</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {merchantSettlementAccounts.length === 0 ? (
              <EmptyState icon={<Wallet className="w-10 h-10" />} text="暂无结算账户" hint="请联系运营人员添加结算账户" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700">账户名称</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-52">银行信息</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchantSettlementAccounts.map((sa) => (
                    <TableRow key={sa.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="font-medium text-gray-900">{sa.account_name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{sa.bank_info}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                          sa.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        )}>
                          {sa.status === 'ACTIVE' ? '启用' : '停用'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => { setEditSettlementTarget(sa); setSettlementModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <MerchantEntityModal
        open={entityModalOpen}
        merchantId={merchant.id}
        entity={editEntityTarget}
        onClose={() => { setEntityModalOpen(false); setEditEntityTarget(null); }}
        onSave={handleSaveEntity}
      />

      <ApplicationModal
        open={appModalOpen}
        merchantId={merchant.id}
        application={editAppTarget}
        onClose={() => { setAppModalOpen(false); setEditAppTarget(null); }}
        onSave={handleSaveApp}
      />

      <SettlementAccountModal
        open={settlementModalOpen}
        account={editSettlementTarget}
        onClose={() => { setSettlementModalOpen(false); setEditSettlementTarget(null); }}
        onSave={handleSaveSettlement}
      />

      <ConfirmDialog
        open={!!deleteEntityTarget}
        title="确认删除法律主体"
        description={`即将删除法律主体「${deleteEntityTarget?.name}」，此操作不可撤销，是否继续？`}
        onConfirm={handleDeleteEntity}
        onCancel={() => setDeleteEntityTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteAppTarget}
        title="确认删除应用"
        description={`即将删除应用「${deleteAppTarget?.name}」，此操作不可撤销，是否继续？`}
        onConfirm={handleDeleteApp}
        onCancel={() => setDeleteAppTarget(null)}
      />
    </div>
  );
}

function SettlementAccountModal({
  open,
  account,
  onClose,
  onSave,
}: {
  open: boolean;
  account: SettlementAccount | null;
  onClose: () => void;
  onSave: (data: Omit<SettlementAccount, 'id' | 'merchant_id'>) => void;
}) {
  const [accountName, setAccountName] = useState(account?.account_name ?? '');
  const [bankInfo, setBankInfo] = useState(account?.bank_info ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(account?.status ?? 'ACTIVE');

  const canSave = accountName.trim() && bankInfo.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? '编辑结算账户' : '新增结算账户'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">账户名称</Label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="公司全称" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">银行信息</Label>
            <Input value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder="例如 HSBC Hong Kong ****5678" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'ACTIVE' | 'INACTIVE')}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button
            disabled={!canSave}
            onClick={() => { if (canSave) onSave({ account_name: accountName.trim(), bank_info: bankInfo.trim(), status }); }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon, text, hint }: { icon: React.ReactNode; text: string; hint: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
      <div className="opacity-25 mb-3">{icon}</div>
      <p className="text-sm font-medium">{text}</p>
      <p className="text-xs mt-1">{hint}</p>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={onEdit}>
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" onClick={onDelete}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
