import { AppStatus } from '../../types';
import { cn } from '../../lib/utils';

const config: Record<AppStatus, { label: string; className: string; dotClass: string }> = {
  ACTIVE: {
    label: '运营中',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  INACTIVE: {
    label: '已停用',
    className: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    dotClass: 'bg-gray-400',
  },
};

interface AppStatusBadgeProps {
  status: AppStatus;
}

export function AppStatusBadge({ status }: AppStatusBadgeProps) {
  const { label, className, dotClass } = config[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  );
}
