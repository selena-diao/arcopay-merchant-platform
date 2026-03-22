import { useState } from 'react';
import { RoutingRule, RoutingRuleCountry, PaymentMethod, Channel, ChannelPaymentMethod, ChannelPaymentMethodCountry } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';
import { Check, Globe, X, Loader as Loader2 } from 'lucide-react';

interface RoutingRuleModalProps {
  open: boolean;
  rule: RoutingRule | null;
  paymentMethods: PaymentMethod[];
  channels: Channel[];
  channelPaymentMethods: ChannelPaymentMethod[];
  channelPaymentMethodCountries: ChannelPaymentMethodCountry[];
  routingRuleCountries: RoutingRuleCountry[];
  onClose: () => void;
  onSave: (data: Omit<RoutingRule, 'id'>, countries: string[] | null) => Promise<void> | void;
}

export function RoutingRuleModal({
  open,
  rule,
  paymentMethods,
  channels,
  channelPaymentMethods,
  channelPaymentMethodCountries,
  routingRuleCountries,
  onClose,
  onSave,
}: RoutingRuleModalProps) {
  const activePaymentMethods = paymentMethods.filter((pm) => pm.status === 'ACTIVE');
  const activeChannels = channels.filter((c) => c.status === 'ACTIVE');

  const existingCountryCodes = rule
    ? routingRuleCountries
        .filter((rc) => rc.routing_rule_id === rule.id)
        .map((rc) => rc.country_code)
    : [];
  const existingIsGlobal = rule
    ? routingRuleCountries.filter((rc) => rc.routing_rule_id === rule.id).length === 0
    : true;

  const [paymentMethodId, setPaymentMethodId] = useState(rule?.payment_method_id ?? '');
  const [channelId, setChannelId] = useState(rule?.channel_id ?? '');
  const [priority, setPriority] = useState(rule ? String(rule.priority) : '1');
  const [weight, setWeight] = useState(rule ? String(rule.weight) : '100');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(existingCountryCodes);
  const [isGlobal, setIsGlobal] = useState(existingIsGlobal);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(rule?.status ?? 'ACTIVE');
  const [saving, setSaving] = useState(false);

  const priorityNum = parseInt(priority);
  const weightNum = parseFloat(weight);

  const priorityValid = !isNaN(priorityNum) && priorityNum >= 1 && Number.isInteger(priorityNum);
  const weightValid = !isNaN(weightNum) && weightNum > 0 && weightNum <= 100;
  const countryValid = isGlobal || selectedCountries.length > 0;
  const canSave = paymentMethodId && channelId && priorityValid && weightValid && countryValid;

  const selectedPM = paymentMethods.find((pm) => pm.id === paymentMethodId);
  const selectedChannel = channels.find((c) => c.id === channelId);

  const filteredChannels = selectedPM
    ? activeChannels.filter((c) =>
        channelPaymentMethods.some(
          (cpm) => cpm.channel_id === c.id && cpm.payment_method_id === selectedPM.id
        )
      )
    : activeChannels;

  const getCountriesForCpm = (cpmId: string) =>
    channelPaymentMethodCountries
      .filter((c) => c.channel_payment_method_id === cpmId)
      .map((c) => c.country_code);

  const availableCountries: string[] = selectedPM && selectedChannel
    ? (() => {
        const cpm = channelPaymentMethods.find(
          (c) => c.channel_id === selectedChannel.id && c.payment_method_id === selectedPM.id
        );
        return cpm ? getCountriesForCpm(cpm.id) : [];
      })()
    : selectedPM
    ? Array.from(
        new Set(
          channelPaymentMethods
            .filter((cpm) => cpm.payment_method_id === selectedPM.id)
            .flatMap((cpm) => getCountriesForCpm(cpm.id))
        )
      ).sort()
    : Array.from(
        new Set(channelPaymentMethods.flatMap((cpm) => getCountriesForCpm(cpm.id)))
      ).sort();

  const handlePaymentMethodChange = (newPmId: string) => {
    setPaymentMethodId(newPmId);
    setChannelId('');
    setSelectedCountries([]);
    setIsGlobal(false);
  };

  const handleChannelChange = (newChannelId: string) => {
    setChannelId(newChannelId);
    setSelectedCountries([]);
    setIsGlobal(false);
  };

  const handleToggleGlobal = () => {
    setIsGlobal(true);
    setSelectedCountries([]);
  };

  const handleToggleCountry = (cc: string) => {
    setIsGlobal(false);
    setSelectedCountries((prev) =>
      prev.includes(cc) ? prev.filter((c) => c !== cc) : [...prev, cc]
    );
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(
        { payment_method_id: paymentMethodId, channel_id: channelId, priority: priorityNum, weight: weightNum, status },
        isGlobal ? null : selectedCountries
      );
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rule ? '编辑路由规则' : '新增路由规则'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">支付方式</Label>
            <Select value={paymentMethodId} onValueChange={handlePaymentMethodChange} disabled={!!rule || saving}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择支付方式..." />
              </SelectTrigger>
              <SelectContent>
                {activePaymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rule && <p className="text-xs text-gray-400">支付方式不可更改</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">渠道</Label>
            <Select value={channelId} onValueChange={handleChannelChange} disabled={!!rule || saving}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择渠道..." />
              </SelectTrigger>
              <SelectContent>
                {filteredChannels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rule
              ? <p className="text-xs text-gray-400">渠道不可更改</p>
              : selectedPM && filteredChannels.length === 0 && (
                  <p className="text-xs text-amber-500">该支付方式暂无可用渠道</p>
                )
            }
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">国家</Label>
            <div className="border border-gray-200 rounded-lg p-2.5 space-y-2 bg-gray-50/50">
              <button
                type="button"
                onClick={handleToggleGlobal}
                disabled={saving}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isGlobal
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                全球兜底
                {isGlobal && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
              {availableCountries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {availableCountries.map((cc) => {
                    const active = selectedCountries.includes(cc);
                    return (
                      <button
                        key={cc}
                        type="button"
                        onClick={() => handleToggleCountry(cc)}
                        disabled={saving}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-colors',
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {cc}
                        {active && <X className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {!countryValid && (
              <p className="text-xs text-red-500">请选择「全球兜底」或至少一个国家</p>
            )}
            <p className="text-xs text-gray-400">
              {selectedChannel && selectedPM
                ? '仅显示该渠道支持该支付方式的国家；选择「全球兜底」时对所有国家生效'
                : selectedPM
                ? '选择渠道后将进一步筛选国家范围'
                : '选择支付方式和渠道后将筛选对应国家范围'}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">优先级</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="例如 1"
              disabled={saving}
            />
            <p className="text-xs text-gray-400">数字越小优先级越高，相同优先级的渠道按权重分流</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">权重 (%)</Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如 60"
                className="pr-8"
                disabled={saving}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-400">同优先级的所有规则权重之和应为 100%</p>
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
