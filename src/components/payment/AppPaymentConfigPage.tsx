import { useState, useMemo } from 'react';
import {
  AppPaymentConfig,
  PaymentMethod,
  SettlementAccount,
  Application,
  Merchant,
  MerchantContract,
  ContractPaymentMethod,
} from '../../types';
import { PaymentMethodTypeBadge } from './PaymentMethodTypeBadge';
import { AppPaymentConfigModal } from './AppPaymentConfigModal';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Pencil, AppWindow, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';

interface AppPaymentConfigPageProps {
  configs: AppPaymentConfig[];
  paymentMethods: PaymentMethod[];
  settlementAccounts: SettlementAccount[];
  applications: Application[];
  merchants: Merchant[];
  merchantContracts: MerchantContract[];
  contractPaymentMethods: ContractPaymentMethod[];
  onSaveConfig: (data: Omit<AppPaymentConfig, 'id'>, existingId?: string) => Promise<void>;
  onToggleConfig: (config: AppPaymentConfig) => Promise<void>;
}

export function AppPaymentConfigPage({
  configs,
  paymentMethods,
  settlementAccounts,
  applications,
  merchants,
  merchantContracts,
  contractPaymentMethods,
  onSaveConfig,
  onToggleConfig,
}: AppPaymentConfigPageProps) {
  const [filterMerchant, setFilterMerchant] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editTarget, setEditTarget] = useState<AppPaymentConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const getApp = (id: string) => applications.find((a) => a.id === id);
  const getMerchant = (id: string) => merchants.find((m) => m.id === id);
  const getPaymentMethod = (id: string) => paymentMethods.find((pm) => pm.id === id);
  const getSettlementAccount = (id: string) => settlementAccounts.find((sa) => sa.id === id);

  const filtered = useMemo(() => {
    return configs.filter((c) => {
      const app = getApp(c.app_id);
      if (!app) return false;
      if (filterMerchant !== 'all' && app.merchant_id !== filterMerchant) return false;
      if (filterPaymentMethod !== 'all' && c.payment_method_id !== filterPaymentMethod) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      return true;
    });
  }, [configs, filterMerchant, filterPaymentMethod, filterStatus]);

  const hasFilters = filterMerchant !== 'all' || filterPaymentMethod !== 'all' || filterStatus !== 'all';

  const handleSave = async (data: Omit<AppPaymentConfig, 'id'>) => {
    try {
      await onSaveConfig(data, editTarget?.id);
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleToggleStatus = async (config: AppPaymentConfig) => {
    try {
      await onToggleConfig(config);
    } catch (err) {
      handleSaveError(err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <AppWindow className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">应用支付配置</h1>
            <p className="text-sm text-gray-500 mt-0.5">管理各应用的支付方式与费率配置</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          + 新增配置
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Select value={filterMerchant} onValueChange={setFilterMerchant}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部游戏方" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部游戏方</SelectItem>
            {merchants.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部支付方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部支付方式</SelectItem>
            {paymentMethods.map((pm) => (
              <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-28 h-8 text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="ACTIVE">启用</SelectItem>
            <SelectItem value="INACTIVE">停用</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-gray-500 hover:text-gray-800"
            onClick={() => { setFilterMerchant('all'); setFilterPaymentMethod('all'); setFilterStatus('all'); }}
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </Button>
        )}

        <span className="ml-auto text-sm text-gray-400">{filtered.length} 条记录</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <div className="opacity-20 mb-3"><AppWindow className="w-10 h-10" /></div>
            <p className="text-sm font-medium">暂无支付配置</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700">应用名称</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">商家</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">支付方式</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24">类型</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24">费率</TableHead>
                <TableHead className="font-semibold text-gray-700">结算账户</TableHead>
                <TableHead className="font-semibold text-gray-700 w-20">状态</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((config) => {
                const app = getApp(config.app_id);
                const merchant = app ? getMerchant(app.merchant_id) : undefined;
                const pm = getPaymentMethod(config.payment_method_id);
                const sa = getSettlementAccount(config.settlement_account_id);
                return (
                  <TableRow key={config.id} className="hover:bg-gray-50/70 transition-colors">
                    <TableCell className="font-medium text-gray-900">{app?.name ?? '—'}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{merchant?.name ?? '—'}</TableCell>
                    <TableCell className="text-gray-800">{pm?.name ?? '—'}</TableCell>
                    <TableCell>{pm && <PaymentMethodTypeBadge type={pm.type} />}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-700">
                      {(config.quoted_rate * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      <div>
                        <p className="text-gray-800 text-sm leading-tight">{sa?.account_name ?? '—'}</p>
                        {sa && <p className="text-gray-400 text-xs">{sa.bank_info}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ConfigStatusBadge status={config.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => { setEditTarget(config); setModalOpen(true); }}
                          title="编辑"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-7 w-7 p-0',
                            config.status === 'ACTIVE'
                              ? 'hover:bg-amber-50 hover:text-amber-600'
                              : 'hover:bg-green-50 hover:text-green-600'
                          )}
                          onClick={() => handleToggleStatus(config)}
                          title={config.status === 'ACTIVE' ? '停用' : '启用'}
                        >
                          {config.status === 'ACTIVE' ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <AppPaymentConfigModal
        open={modalOpen}
        config={editTarget}
        applications={applications}
        merchants={merchants}
        paymentMethods={paymentMethods}
        settlementAccounts={settlementAccounts}
        merchantContracts={merchantContracts}
        contractPaymentMethods={contractPaymentMethods}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

function ConfigStatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        status === 'ACTIVE'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-100 text-gray-500 border-gray-200'
      )}
    >
      {status === 'ACTIVE' ? '启用' : '停用'}
    </span>
  );
}
