import { useState, useEffect } from 'react';
import { ContractPaymentMethod, ContractPaymentMethodStatus, PaymentMethod } from '../../types';
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
import { TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface ContractPaymentMethodModalProps {
  open: boolean;
  record: ContractPaymentMethod | null;
  contractId: string;
  existingForContract: ContractPaymentMethod[];
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onSave: (data: Omit<ContractPaymentMethod, 'id'>) => Promise<void> | void;
}

export function ContractPaymentMethodModal({
  open,
  record,
  contractId,
  existingForContract,
  paymentMethods,
  onClose,
  onSave,
}: ContractPaymentMethodModalProps) {
  const isEdit = !!record;

  const [paymentMethodId, setPaymentMethodId] = useState(record?.payment_method_id ?? '');
  const [rateStr, setRateStr] = useState(record ? (record.quoted_rate * 100).toFixed(2) : '');
  const [status, setStatus] = useState<ContractPaymentMethodStatus>(record?.status ?? 'ACTIVE');
  const [duplicateError, setDuplicateError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPaymentMethodId(record?.payment_method_id ?? '');
      setRateStr(record ? (record.quoted_rate * 100).toFixed(2) : '');
      setStatus(record?.status ?? 'ACTIVE');
      setDuplicateError(false);
      setSaving(false);
    }
  }, [open, record]);

  const activePaymentMethods = paymentMethods.filter((pm) => pm.status === 'ACTIVE');

  const handlePaymentMethodChange = (pmId: string) => {
    setPaymentMethodId(pmId);
    const isDuplicate = existingForContract.some(
      (e) => e.payment_method_id === pmId && e.id !== record?.id
    );
    setDuplicateError(isDuplicate);
  };

  const rate = parseFloat(rateStr) / 100;
  const rateValid = !isNaN(rate) && rate > 0;
  const rateIsLow = rateValid && rate < 0.02;

  const canSave = paymentMethodId && rateValid && !duplicateError;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        merchant_contract_id: contractId,
        payment_method_id: paymentMethodId,
        quoted_rate: rate,
        status,
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
          <DialogTitle>{isEdit ? '编辑约定支付方式' : '新增约定支付方式'}</DialogTitle>
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
              <p className="text-xs text-red-500">该合同已约定此支付方式，请直接编辑</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">费率 (%)</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rateStr}
                onChange={(e) => setRateStr(e.target.value)}
                placeholder="例如 4.50"
                className="pr-8"
                disabled={saving}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            {rateIsLow && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>费率低于 2%，请确认是否正确</span>
              </div>
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
