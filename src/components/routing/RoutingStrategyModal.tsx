import { useState } from 'react';
import { RoutingStrategy, PaymentMethod } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Info, Loader as Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';

interface RoutingStrategyModalProps {
  open: boolean;
  strategy: RoutingStrategy | null;
  paymentMethods: PaymentMethod[];
  existingStrategies: RoutingStrategy[];
  onClose: () => void;
  onSave: (data: Omit<RoutingStrategy, 'id'>) => Promise<void> | void;
}

export function RoutingStrategyModal({
  open,
  strategy,
  paymentMethods,
  existingStrategies,
  onClose,
  onSave,
}: RoutingStrategyModalProps) {
  const activePaymentMethods = paymentMethods.filter((pm) => pm.status === 'ACTIVE');

  const [paymentMethodId, setPaymentMethodId] = useState(strategy?.payment_method_id ?? '');
  const [type, setType] = useState<'MANUAL' | 'SMART'>(strategy?.type ?? 'MANUAL');
  const [description, setDescription] = useState(strategy?.description ?? '');
  const [saving, setSaving] = useState(false);

  const isEdit = !!strategy;

  const existingForPM = !isEdit && paymentMethodId
    ? existingStrategies.find((s) => s.payment_method_id === paymentMethodId)
    : null;

  const canSave = paymentMethodId && !existingForPM;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({ payment_method_id: paymentMethodId, type, description });
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑路由策略' : '新增路由策略'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">支付方式</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId} disabled={isEdit || saving}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择支付方式..." />
              </SelectTrigger>
              <SelectContent>
                {activePaymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingForPM && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                该支付方式已有路由策略，请直接编辑
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">策略类型</Label>
            <div className="flex gap-2">
              {(['MANUAL', 'SMART'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  disabled={saving}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors text-left',
                    type === t
                      ? t === 'MANUAL'
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-violet-50 border-violet-400 text-violet-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  )}
                >
                  <span className="block font-semibold">{t === 'MANUAL' ? 'MANUAL' : 'SMART'}</span>
                  <span className="block text-xs mt-0.5 font-normal opacity-75">
                    {t === 'MANUAL' ? '人工配置' : '智能路由'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {type === 'SMART' && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
              <span>
                智能路由将根据渠道实时成功率和延迟自动调整权重，手动配置的权重将作为初始值，系统运行后自动覆盖
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">描述 <span className="font-normal text-gray-400">（选填）</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述该策略的用途..."
              className="resize-none h-20"
              disabled={saving}
            />
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
