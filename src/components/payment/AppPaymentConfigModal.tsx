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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface AppPaymentConfigModalProps {
  open: boolean;
  config: AppPaymentConfig | null;
  preselectedAppId?: string;
  applications: Application[];
  merchants: Merchant[];
  paymentMethods: PaymentMethod[];
  settlementAccounts: SettlementAccount[];
  merchantContracts: MerchantContract[];
  contractPaymentMethods: ContractPaymentMethod[];
  onClose: () => void;
  onSave: (data: Omit<AppPaymentConfig, 'id'>) => Promise<void> | void;
}

export function AppPaymentConfigModal({
  open,
  config,
  preselectedAppId,
  applications,
  merchants,
  paymentMethods,
  settlementAccounts,
  merchantContracts,
  contractPaymentMethods,
  onClose,
  onSave,
}: AppPaymentConfigModalProps) {
  const isEdit = !!config;

  const [appId, setAppId] = useState(config?.app_id ?? preselectedAppId ?? '');
  const [merchantContractId, setMerchantContractId] = useState(config?.merchant_contract_id ?? '');
  const [paymentMethodId, setPaymentMethodId] = useState(config?.payment_method_id ?? '');
  const [settlementAccountId, setSettlementAccountId] = useState(config?.settlement_account_id ?? '');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(config?.status ?? 'ACTIVE');
  const [quotedRate, setQuotedRate] = useState<number>(config?.quoted_rate ?? 0);
  const [saving, setSaving] = useState(false);

  const selectedApp = applications.find((a) => a.id === appId);
  const merchantId = selectedApp?.merchant_id ?? '';

  const activeMerchantContracts = useMemo(() => {
    if (!merchantId) return [];
    return merchantContracts.filter(
      (mc) => mc.merchant_id === merchantId && mc.status === 'ACTIVE'
    );
  }, [merchantContracts, merchantId]);

const contractPms = useMemo(() => {
    if (!merchantContractId) return [];
    return contractPaymentMethods.filter(
      (cpm) => cpm.merchant_contract_id === merchantContractId && cpm.status === 'ACTIVE'
    );
  }, [contractPaymentMethods, merchantContractId]);

  const contractPmIds = useMemo(() => {
    if (!merchantContractId) return null;
    return contractPms.map((cpm) => cpm.payment_method_id);
  }, [contractPms, merchantContractId]);

  const handleAppChange = (v: string) => {
    setAppId(v);
    setMerchantContractId('');
    setPaymentMethodId('');
    setSettlementAccountId('');
    setQuotedRate(0);
  };

  const handleContractChange = (v: string) => {
    setMerchantContractId(v);
    setPaymentMethodId('');
    setQuotedRate(0);
  };

  const handlePaymentMethodChange = (pmId: string) => {
    setPaymentMethodId(pmId);
    const matched = contractPms.find((cpm) => cpm.payment_method_id === pmId);
    setQuotedRate(matched ? matched.quoted_rate / 100 : 0);
  };

  const activePaymentMethods = useMemo(() => {
    const active = paymentMethods.filter((pm) => pm.status === 'ACTIVE');
    if (contractPmIds === null) return active;
    return active.filter((pm) => contractPmIds.includes(pm.id));
  }, [paymentMethods, contractPmIds]);

  const filteredSettlementAccounts = useMemo(() => {
    if (!merchantId) return settlementAccounts;
    return settlementAccounts.filter((sa) => sa.merchant_id === merchantId);
  }, [settlementAccounts, merchantId]);

  const getMoontonEntityLabel = (mc: MerchantContract) => {
    return `${mc.id} · ${mc.currency} · ${(mc.quoted_rate * 100).toFixed(2)}%`;
  };

  const canSave = isEdit ? true : !!(appId && merchantContractId && paymentMethodId && settlementAccountId);

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (isEdit && config) {
        await onSave({
          app_id: config.app_id,
          merchant_contract_id: config.merchant_contract_id,
          payment_method_id: config.payment_method_id,
          settlement_account_id: config.settlement_account_id,
          quoted_rate: config.quoted_rate,
          status,
        });
      } else {
        await onSave({
          app_id: appId,
          merchant_contract_id: merchantContractId,
          payment_method_id: paymentMethodId,
          settlement_account_id: settlementAccountId,
          quoted_rate: quotedRate,
          status,
        });
      }
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  const getMerchantForApp = (app: Application) => merchants.find((m) => m.id === app.merchant_id)?.name ?? '';
  const editApp = isEdit ? applications.find((a) => a.id === config?.app_id) : undefined;
  const editContract = isEdit ? merchantContracts.find((mc) => mc.id === config?.merchant_contract_id) : undefined;
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id === (isEdit ? config?.payment_method_id : paymentMethodId));
  const selectedSettlementAccount = settlementAccounts.find((sa) => sa.id === (isEdit ? config?.settlement_account_id : settlementAccountId));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑支付配置' : '开启支付方式'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isEdit ? (
            <>
              <div className="space-y-3">
                <ReadOnlyField label="店铺" value={editApp?.name ?? config?.app_id ?? '—'} />
                <ReadOnlyField
                  label="商户合同"
                  value={editContract ? getMoontonEntityLabel(editContract) : config?.merchant_contract_id ?? '—'}
                />
                <ReadOnlyField label="支付方式" value={selectedPaymentMethod?.name ?? config?.payment_method_id ?? '—'} />
                <ReadOnlyField
                  label="合同费率"
                  value={config ? `${(config.quoted_rate * 100).toFixed(2)}%` : '—'}
                  mono
                />
                <ReadOnlyField
                  label="结算账户"
                  value={selectedSettlementAccount
                    ? `${selectedSettlementAccount.account_name} · ${selectedSettlementAccount.bank_info}`
                    : config?.settlement_account_id ?? '—'}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-sm font-medium text-gray-700">状态</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{status === 'ACTIVE' ? '启用' : '停用'}</span>
                  <Switch
                    checked={status === 'ACTIVE'}
                    onCheckedChange={(v) => setStatus(v ? 'ACTIVE' : 'INACTIVE')}
                    disabled={saving}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {!preselectedAppId && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">店铺</Label>
                  <Select value={appId} onValueChange={handleAppChange} disabled={saving}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择店铺..." />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.name}
                          <span className="text-gray-400 ml-1">({getMerchantForApp(app)})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {preselectedAppId && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm">
                  <span className="text-gray-500">店铺：</span>
                  <span className="font-medium text-gray-800">{selectedApp?.name ?? preselectedAppId}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">商户合同</Label>
                <Select
                  value={merchantContractId}
                  onValueChange={handleContractChange}
                  disabled={!appId || saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={appId ? '请选择合同...' : '请先选择店铺'} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMerchantContracts.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-400">暂无有效合同</div>
                    ) : (
                      activeMerchantContracts.map((mc) => (
                        <SelectItem key={mc.id} value={mc.id}>
                          {getMoontonEntityLabel(mc)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">支付方式</Label>
                <Select
                  value={paymentMethodId}
                  onValueChange={handlePaymentMethodChange}
                  disabled={!merchantContractId || saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={merchantContractId ? '请选择支付方式...' : '请先选择合同'} />
                  </SelectTrigger>
                  <SelectContent>
                    {merchantContractId && activePaymentMethods.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        该合同暂无支付方式费率配置，请先在商户合同中补充
                      </div>
                    ) : (
                      activePaymentMethods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-500">合同费率</span>
                <span className="font-mono text-sm font-medium text-gray-800">
                  {paymentMethodId ? `${(quotedRate * 100).toFixed(2)}%` : '—'}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">结算账户</Label>
                <Select value={settlementAccountId} onValueChange={setSettlementAccountId} disabled={(!appId && !preselectedAppId) || saving}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={appId || preselectedAppId ? '请选择结算账户...' : '请先选择店铺'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSettlementAccounts.map((sa) => (
                      <SelectItem key={sa.id} value={sa.id}>
                        <span>{sa.account_name}</span>
                        <span className="text-gray-400 ml-1">· {sa.bank_info}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {appId && filteredSettlementAccounts.length === 0 && (
                  <p className="text-xs text-gray-400">该游戏方暂无结算账户</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-sm font-medium text-gray-700">状态</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{status === 'ACTIVE' ? '启用' : '停用'}</span>
                  <Switch
                    checked={status === 'ACTIVE'}
                    onCheckedChange={(v) => setStatus(v ? 'ACTIVE' : 'INACTIVE')}
                    disabled={saving}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                保存中...
              </>
            ) : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
