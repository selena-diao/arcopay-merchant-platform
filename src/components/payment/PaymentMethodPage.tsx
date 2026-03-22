import { useState, useMemo } from 'react';
import { PaymentMethod } from '../../types';
import { PaymentMethodTypeBadge } from './PaymentMethodTypeBadge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Pencil, Wallet, Info, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaymentMethodPageProps {
  paymentMethods: PaymentMethod[];
  onPaymentMethodStatusChange: (id: string, status: 'ACTIVE' | 'INACTIVE') => Promise<void>;
  onDrillDown: (pm: PaymentMethod) => void;
}

export function PaymentMethodPage({ paymentMethods, onPaymentMethodStatusChange, onDrillDown }: PaymentMethodPageProps) {
  const [editTarget, setEditTarget] = useState<PaymentMethod | null>(null);
  const [filterType, setFilterType] = useState('all');

  const distinctTypes = useMemo(
    () => Array.from(new Set(paymentMethods.map((pm) => pm.type))).sort(),
    [paymentMethods]
  );

  const filtered = useMemo(
    () => paymentMethods.filter((pm) => filterType === 'all' || pm.type === filterType),
    [paymentMethods, filterType]
  );

  const handleSave = async (status: 'ACTIVE' | 'INACTIVE') => {
    if (!editTarget) return;
    await onPaymentMethodStatusChange(editTarget.id, status).catch(() => null);
    setEditTarget(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">支付方式管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">管理平台支持的支付方式，仅限运营人员编辑状态</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 mb-5 text-sm text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>支付方式由平台统一管理，不支持新增或删除。运营人员可调整支付方式的启用状态。</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {distinctTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
              <TableHead className="font-semibold text-gray-700">支付方式名称</TableHead>
              <TableHead className="font-semibold text-gray-700 w-32">类型</TableHead>
              <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
              <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pm) => (
              <TableRow key={pm.id} className="hover:bg-gray-50/70 transition-colors">
                <TableCell>
                  <button
                    onClick={() => onDrillDown(pm)}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                  >
                    {pm.name}
                  </button>
                </TableCell>
                <TableCell>
                  <PaymentMethodTypeBadge type={pm.type} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={pm.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => setEditTarget(pm)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <button
                      onClick={() => onDrillDown(pm)}
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors px-1"
                    >
                      详情
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editTarget && (
        <EditStatusModal
          method={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
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

function EditStatusModal({
  method,
  onClose,
  onSave,
}: {
  method: PaymentMethod;
  onClose: () => void;
  onSave: (status: 'ACTIVE' | 'INACTIVE') => void;
}) {
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(method.status);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>编辑支付方式状态</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">名称</span>
              <span className="font-medium text-gray-800">{method.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">类型</span>
              <PaymentMethodTypeBadge type={method.type} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">状态</p>
            <div className="flex gap-2">
              {(['ACTIVE', 'INACTIVE'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                    status === s
                      ? s === 'ACTIVE'
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'bg-gray-100 border-gray-400 text-gray-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300'
                  )}
                >
                  {s === 'ACTIVE' ? '启用' : '停用'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => onSave(status)}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
