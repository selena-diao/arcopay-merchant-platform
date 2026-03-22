import { SettlementRecordStatus } from '../../types';
import { cn } from '../../lib/utils';

interface SettlementStatusBadgeProps {
  status: SettlementRecordStatus;
}

const CONFIG: Record<SettlementRecordStatus, { label: string; className: string }> = {
  PENDING: {
    label: '待结算',
    className: 'bg-slate-100 text-slate-600',
  },
  IN_RECONCILIATION: {
    label: '对账中',
    className: 'bg-blue-100 text-blue-700',
  },
  SETTLED: {
    label: '已结算',
    className: 'bg-emerald-100 text-emerald-700',
  },
  DISPUTED: {
    label: '争议中',
    className: 'bg-red-100 text-red-700',
  },
};

export function SettlementStatusBadge({ status }: SettlementStatusBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  );
}
