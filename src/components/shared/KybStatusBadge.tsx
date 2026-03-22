import { KybStatus } from '../../types';
import { cn } from '../../lib/utils';

const statusConfig: Record<KybStatus, { label: string; className: string }> = {
  PENDING: {
    label: '审核中',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  APPROVED: {
    label: '已通过',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  REJECTED: {
    label: '已拒绝',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
};

interface KybStatusBadgeProps {
  status: KybStatus;
}

export function KybStatusBadge({ status }: KybStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'PENDING' && 'bg-amber-500',
          status === 'APPROVED' && 'bg-emerald-500',
          status === 'REJECTED' && 'bg-red-500'
        )}
      />
      {config.label}
    </span>
  );
}
