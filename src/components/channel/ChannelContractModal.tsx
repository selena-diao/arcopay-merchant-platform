import { useState, useEffect } from 'react';
import { Channel, ChannelContract, ChannelContractStatus, MerchantMode, MoontonEntity } from '../../types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface ChannelContractModalProps {
  open: boolean;
  channels: Channel[];
  moontonEntities: MoontonEntity[];
  contract?: ChannelContract | null;
  initialChannelId?: string;
  onClose: () => void;
  onSave: (data: Omit<ChannelContract, 'id'>) => Promise<void> | void;
}

export function ChannelContractModal({
  open,
  channels,
  moontonEntities,
  contract,
  initialChannelId,
  onClose,
  onSave,
}: ChannelContractModalProps) {
  const isEdit = !!contract;

  const eligibleEntities = moontonEntities.filter((e) => !e.is_display_only);

  const [moontonEntityId, setMoontonEntityId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [merchantMode, setMerchantMode] = useState<MerchantMode>('MOR');
  const [channelRate, setChannelRate] = useState('');
  const [settlementCycle, setSettlementCycle] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contract) {
      setMoontonEntityId(contract.moonton_entity_id);
      setChannelId(contract.channel_id);
      setMerchantMode(contract.merchant_mode);
      setChannelRate((contract.channel_rate * 100).toFixed(2));
      setSettlementCycle(String(contract.settlement_cycle));
      setSignedAt(contract.signed_at);
      setCurrency(contract.currency || 'USD');
    } else {
      const defaultChannelId = initialChannelId ?? channels[0]?.id ?? '';
      setMoontonEntityId(eligibleEntities[0]?.id ?? '');
      setChannelId(defaultChannelId);
      setMerchantMode(channels.find((c) => c.id === defaultChannelId)?.merchant_mode ?? 'MOR');
      setChannelRate('');
      setSettlementCycle('');
      setSignedAt(new Date().toISOString().split('T')[0]);
      setCurrency('USD');
    }
    setSaving(false);
  }, [contract, open]);

  const handleChannelChange = (id: string) => {
    setChannelId(id);
    const ch = channels.find((c) => c.id === id);
    if (ch) setMerchantMode(ch.merchant_mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(channelRate);
    const cycle = parseInt(settlementCycle, 10);
    if (!moontonEntityId || !channelId || isNaN(rate) || isNaN(cycle) || !signedAt || saving) return;
    setSaving(true);
    try {
      const status: ChannelContractStatus = isEdit ? contract!.status : 'DRAFT';
      await onSave({
        moonton_entity_id: moontonEntityId,
        channel_id: channelId,
        merchant_mode: merchantMode,
        channel_rate: rate / 100,
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
          <DialogTitle>{isEdit ? '编辑渠道合同' : '新增渠道合同'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>平台主体</Label>
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
              <Label>渠道</Label>
              <Select value={channelId} onValueChange={handleChannelChange} disabled={isEdit || saving}>
                <SelectTrigger>
                  <SelectValue placeholder="选择渠道" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>{ch.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>商户模式</Label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
              {merchantMode === 'MOR' ? 'MOR 大商户' : 'SOR 小商户'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="channelRate">渠道费率 (%)</Label>
              <Input
                id="channelRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={channelRate}
                onChange={(e) => setChannelRate(e.target.value)}
                placeholder="3.50"
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settlementCycle">结算周期 (天)</Label>
              <Input
                id="settlementCycle"
                type="number"
                min="1"
                value={settlementCycle}
                onChange={(e) => setSettlementCycle(e.target.value)}
                placeholder="7"
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
