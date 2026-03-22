import { useState, useEffect } from 'react';
import { ChannelPaymentMethod, ChannelPaymentMethodCountry, PaymentMethod } from '../../types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { X, Plus, Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface ChannelPaymentMethodModalProps {
  open: boolean;
  record: ChannelPaymentMethod | null;
  channelId: string;
  existingForChannel: ChannelPaymentMethod[];
  paymentMethods: PaymentMethod[];
  channelPaymentMethodCountries: ChannelPaymentMethodCountry[];
  onClose: () => void;
  onSave: (data: Omit<ChannelPaymentMethod, 'id'>, countries: string[]) => Promise<void> | void;
}

export function ChannelPaymentMethodModal({
  open,
  record,
  channelId,
  existingForChannel,
  paymentMethods,
  channelPaymentMethodCountries,
  onClose,
  onSave,
}: ChannelPaymentMethodModalProps) {
  const isEdit = !!record;

  const existingCountries = record
    ? channelPaymentMethodCountries
        .filter((c) => c.channel_payment_method_id === record.id)
        .map((c) => c.country_code)
    : [];

  const [paymentMethodId, setPaymentMethodId] = useState(record?.payment_method_id ?? '');
  const [countries, setCountries] = useState<string[]>(existingCountries);
  const [countryInput, setCountryInput] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const initCountries = record
        ? channelPaymentMethodCountries
            .filter((c) => c.channel_payment_method_id === record.id)
            .map((c) => c.country_code)
        : [];
      setPaymentMethodId(record?.payment_method_id ?? '');
      setCountries(initCountries);
      setCountryInput('');
      setDuplicateError(false);
      setSaving(false);
    }
  }, [open, record, channelPaymentMethodCountries]);

  const activePaymentMethods = paymentMethods.filter((pm) => pm.status === 'ACTIVE');

  const handlePaymentMethodChange = (pmId: string) => {
    setPaymentMethodId(pmId);
    const isDuplicate = existingForChannel.some(
      (e) => e.payment_method_id === pmId && e.id !== record?.id
    );
    setDuplicateError(isDuplicate);
  };

  const handleAddCountry = () => {
    const cc = countryInput.trim().toUpperCase();
    if (!cc) return;
    if (!countries.includes(cc)) {
      setCountries((prev) => [...prev, cc]);
    }
    setCountryInput('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddCountry();
    }
  };

  const handleRemoveCountry = (cc: string) => {
    setCountries((prev) => prev.filter((c) => c !== cc));
  };

  const canSave = paymentMethodId && countries.length > 0 && !duplicateError;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({ channel_id: channelId, payment_method_id: paymentMethodId }, countries);
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑支付方式支持' : '新增支付方式支持'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">支付方式</Label>
            <Select
              value={paymentMethodId}
              onValueChange={handlePaymentMethodChange}
              disabled={isEdit || saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择支付方式..." />
              </SelectTrigger>
              <SelectContent>
                {activePaymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && <p className="text-xs text-gray-400">支付方式不可更改</p>}
            {duplicateError && (
              <p className="text-xs text-red-500">该渠道已配置此支付方式，请直接编辑</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">支持国家</Label>
            <div className="flex gap-2">
              <Input
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
                onKeyDown={handleInputKeyDown}
                placeholder="输入国家代码，如 PH"
                maxLength={3}
                className="font-mono uppercase"
                disabled={saving}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCountry}
                disabled={!countryInput.trim() || saving}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">按 Enter 或空格快速添加；输入 ISO 国家代码</p>
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {countries.map((cc) => (
                  <span
                    key={cc}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                  >
                    {cc}
                    <button
                      type="button"
                      onClick={() => handleRemoveCountry(cc)}
                      disabled={saving}
                      className="text-blue-400 hover:text-blue-700 transition-colors disabled:opacity-40"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {countries.length === 0 && paymentMethodId && (
              <p className="text-xs text-red-500">请至少添加一个支持国家</p>
            )}
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
