import { useState } from 'react';
import { RoutingStrategy, PaymentMethod } from '../../types';
import { RoutingStrategyModal } from './RoutingStrategyModal';
import { insertRoutingStrategy } from '../../lib/routingService';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Plus, Pencil, ArrowRight, LayoutList } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';

interface RoutingStrategyPageProps {
  strategies: RoutingStrategy[];
  paymentMethods: PaymentMethod[];
  onStrategiesChange: (strategies: RoutingStrategy[], changedStrategy?: RoutingStrategy) => void;
  onNavigateToRules: (paymentMethodId: string) => void;
}

export function RoutingStrategyPage({
  strategies,
  paymentMethods,
  onStrategiesChange,
  onNavigateToRules,
}: RoutingStrategyPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoutingStrategy | null>(null);

  const getPaymentMethod = (id: string) => paymentMethods.find((pm) => pm.id === id);

  const handleSave = async (data: Omit<RoutingStrategy, 'id'>) => {
    if (editTarget) {
      const updated = { ...editTarget, ...data };
      onStrategiesChange(strategies.map((s) => (s.id === editTarget.id ? updated : s)), updated);
      setModalOpen(false);
      setEditTarget(null);
    } else {
      try {
        await insertRoutingStrategy(data);
        onStrategiesChange(strategies);
        setModalOpen(false);
        setEditTarget(null);
      } catch (err) {
        handleSaveError(err);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <LayoutList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">路由策略</h1>
            <p className="text-sm text-gray-500 mt-0.5">配置各支付方式的路由策略类型</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          新增路由策略
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {strategies.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-400">
            <div className="opacity-20 mb-3"><LayoutList className="w-10 h-10" /></div>
            <p className="text-sm font-medium">暂无路由策略</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700 w-32">支付方式</TableHead>
                <TableHead className="font-semibold text-gray-700 w-32">策略类型</TableHead>
                <TableHead className="font-semibold text-gray-700">描述</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategies.map((strategy) => {
                const pm = getPaymentMethod(strategy.payment_method_id);
                return (
                  <TableRow key={strategy.id} className="hover:bg-gray-50/70 transition-colors">
                    <TableCell className="font-medium text-gray-900">{pm?.name ?? strategy.payment_method_id}</TableCell>
                    <TableCell>
                      <StrategyTypeBadge type={strategy.type} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{strategy.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => onNavigateToRules(strategy.payment_method_id)}
                        >
                          查看规则
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => { setEditTarget(strategy); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
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

      <RoutingStrategyModal
        open={modalOpen}
        strategy={editTarget}
        paymentMethods={paymentMethods}
        existingStrategies={strategies}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

function StrategyTypeBadge({ type }: { type: 'MANUAL' | 'SMART' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        type === 'MANUAL'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-violet-50 text-violet-700 border-violet-200'
      )}
    >
      {type === 'MANUAL' ? 'MANUAL' : 'SMART'}
    </span>
  );
}
