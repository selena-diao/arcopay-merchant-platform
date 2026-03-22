import { useState } from 'react';
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
import { Plus, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';

interface AppPaymentConfigTabProps {
  app: Application;
  merchants: Merchant[];
  configs: AppPaymentConfig[];
  paymentMethods: PaymentMethod[];
  settlementAccounts: SettlementAccount[];
  merchantContracts: MerchantContract[];
  contractPaymentMethods: ContractPaymentMethod[];
  onSaveConfig: (data: Omit<AppPaymentConfig, 'id'>, existingId?: string) => Promise<void>;
  onToggleConfig: (config: AppPaymentConfig) => Promise<void>;
  onNavigateToGlobal: () => void;
}

export function AppPaymentConfigTab({
  app,
  merchants,
  configs,
  paymentMethods,
  settlementAccounts,
  merchantContracts,
  contractPaymentMethods,
  onSaveConfig,
  onToggleConfig,
  onNavigateToGlobal,
}: AppPaymentConfigTabProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const appConfigs = configs.filter((c) => c.app_id === app.id);

  const getPaymentMethod = (id: string) => paymentMethods.find((pm) => pm.id === id);
  const getSettlementAccount = (id: string) => settlementAccounts.find((sa) => sa.id === id);

  const handleSave = async (data: Omit<AppPaymentConfig, 'id'>) => {
    try {
      await onSaveConfig(data);
      setModalOpen(false);
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleToggle = async (config: AppPaymentConfig) => {
    try {
      await onToggleConfig(config);
    } catch (err) {
      handleSaveError(err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm text-gray-500">
          共 <span className="font-medium text-gray-900">{appConfigs.length}</span> 个支付配置
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-gray-500 text-xs"
            onClick={onNavigateToGlobal}
          >
            <ExternalLink className="w-3 h-3" />
            编辑请前往应用支付配置
          </Button>
          <Button
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            开启支付方式
          </Button>
        </div>
      </div>

      {appConfigs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
          <p className="text-sm font-medium">暂无支付配置</p>
          <p className="text-xs mt-1">点击「开启支付方式」添加支付方式</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
              <TableHead className="font-semibold text-gray-700 w-32">支付方式</TableHead>
              <TableHead className="font-semibold text-gray-700 w-24">类型</TableHead>
              <TableHead className="font-semibold text-gray-700 w-24">费率</TableHead>
              <TableHead className="font-semibold text-gray-700">结算账户</TableHead>
              <TableHead className="font-semibold text-gray-700 w-20">状态</TableHead>
              <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appConfigs.map((config) => {
              const pm = getPaymentMethod(config.payment_method_id);
              const sa = getSettlementAccount(config.settlement_account_id);
              return (
                <TableRow key={config.id} className="hover:bg-gray-50/70 transition-colors">
                  <TableCell className="font-medium text-gray-800">{pm?.name ?? '—'}</TableCell>
                  <TableCell>{pm && <PaymentMethodTypeBadge type={pm.type} />}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-700">
                    {(config.quoted_rate * 100).toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-gray-800 text-sm leading-tight">{sa?.account_name ?? '—'}</p>
                      {sa && <p className="text-gray-400 text-xs">{sa.bank_info}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                        config.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      )}
                    >
                      {config.status === 'ACTIVE' ? '启用' : '停用'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-7 w-7 p-0',
                        config.status === 'ACTIVE'
                          ? 'hover:bg-amber-50 hover:text-amber-600'
                          : 'hover:bg-green-50 hover:text-green-600'
                      )}
                      onClick={() => handleToggle(config)}
                      title={config.status === 'ACTIVE' ? '停用' : '启用'}
                    >
                      {config.status === 'ACTIVE' ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <AppPaymentConfigModal
        open={modalOpen}
        config={null}
        preselectedAppId={app.id}
        applications={[app]}
        merchants={merchants}
        paymentMethods={paymentMethods}
        settlementAccounts={settlementAccounts}
        merchantContracts={merchantContracts}
        contractPaymentMethods={contractPaymentMethods}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
