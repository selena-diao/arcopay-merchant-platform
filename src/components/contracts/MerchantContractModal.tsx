import { useState, useEffect } from 'react';
import {
  MerchantContract,
  MerchantContractStatus,
  MoontonEntity,
  Merchant,
  ChannelContract,
} from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface MerchantContractModalProps {
  open: boolean;
  moontonEntities: MoontonEntity[];
  merchants: Merchant[];
  channelContracts: ChannelContract[];
  contract?: MerchantContract | null;
  onClose: () => void;
  onSave: (data: Omit<MerchantContract, 'id'>) => Promise<void> | void;
}

export function MerchantContractModal({
  open,
  moontonEntities,
  merchants,
  channelContracts,
  contract,
  onClose,
  onSave,
}: MerchantContractModalProps) {
  const isEdit = !!contract;

  const eligibleEntities = moontonEntities.filter((e) => !e.is_display_only);

  const [moontonEntityId, setMoontonEntityId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [quotedRate, setQuotedRate] = useState('');
  const [settlementCycle, setSettlementCycle] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contract) {
      setMoontonEntityId(contract.moonton_entity_id);
      setMerchantId(contract.merchant_id);
      setQuotedRate((contract.quoted_rate * 100).toFixed(2));
      setSettlementCycle(String(contract.settlement_cycle));
      setSignedAt(contract.signed_at);
      setCurrency(contract.currency || 'USD');
    } else {
      setMoontonEntityId(eligibleEntities[0]?.id ?? '');
      setMerchantId(merchants[0]?.id ?? '');
      setQuotedRate('');
      setSettlementCycle('');
      setSignedAt(new Date().toISOString().split('T')[0]);
      setCurrency('USD');
    }
    setSaving(false);
  }, [contract, open]);

  const rateValue = parseFloat(quotedRate);
  const activeChannelRates = channelContracts
    .filter((c) => c.status === 'ACTIVE')
    .map((c) => c.channel_rate);
  const minChannelRate = activeChannelRates.length > 0 ? Math.min(...activeChannelRates) : null;
  const showRateWarning =
    !isNaN(rateValue) && minChannelRate !== null && rateValue / 100 < minChannelRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(quotedRate);
    const cycle = parseInt(settlementCycle, 10);
    if (!moontonEntityId || !merchantId || isNaN(rate) || rate <= 0 || isNaN(cycle) || !signedAt || saving) return;
    setSaving(true);
    try {
      const status: MerchantContractStatus = isEdit ? contract!.status : 'DRAFT';
      await onSave({
        moonton_entity_id: moontonEntityId,
        merchant_id: merchantId,
        quoted_rate: rate / 100,
        settlement_cycle: cycle,
        currency,
        status,
        signed_at: signedAt,
      });
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑商户合同' : '新增商户合同'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>平台签约主体</Label>
              <Select value={moontonEntityId} onValueChange={setMoontonEntityId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="选择平台主体" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEntities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>商家</Label>
              <Select value={merchantId} onValueChange={setMerchantId} disabled={saving}>
                <SelectTrigger>
                  <SelectValue placeholder="选择商家" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quotedRate">商户费率 (%)</Label>
              <Input
                id="quotedRate"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={quotedRate}
                onChange={(e) => setQuotedRate(e.target.value)}
                placeholder="4.50"
                required
                disabled={saving}
              />
              {showRateWarning && (
                <div className="flex items-start gap-1.5 text-amber-600 text-xs mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>费率低于当前最低渠道费率 ({((minChannelRate ?? 0) * 100).toFixed(2)}%)，存在费率倒挂风险</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settlementCycle">结算周期 (天)</Label>
              <Input
                id="settlementCycle"
                type="number"
                min="1"
                value={settlementCycle}
                onChange={(e) => setSettlementCycle(e.target.value)}
                placeholder="14"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="signedAt">签署日期</Label>
              <Input
                id="signedAt"
                type="date"
                value={signedAt}
                onChange={(e) => setSignedAt(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>结算币种</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'CNY', 'HKD', 'SGD', 'PHP'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>取消</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  保存中...
                </>
              ) : isEdit ? '保存更改' : '创建合同'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
