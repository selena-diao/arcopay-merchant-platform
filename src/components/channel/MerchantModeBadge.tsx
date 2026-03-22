import { MerchantMode } from '../../types';
import { cn } from '../../lib/utils';

const config: Record<MerchantMode, { label: string; className: string }> = {
  MOR: { label: 'MOR 大商户', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  SOR: { label: 'SOR 小商户', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

export function MerchantModeBadge({ mode }: { mode: MerchantMode }) {
  const c = config[mode];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset', c.className)}>
      {c.label}
    </span>
  );
}
