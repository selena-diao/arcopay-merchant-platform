import { MerchantContractStatus } from '../../types';
import { cn } from '../../lib/utils';

const config: Record<MerchantContractStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  ACTIVE: { label: '有效', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  TERMINATED: { label: '已终止', className: 'bg-red-50 text-red-600 ring-red-200' },
  VOIDED: { label: '已作废', className: 'bg-gray-100 text-gray-400 ring-gray-200' },
};

export function MerchantContractStatusBadge({ status }: { status: MerchantContractStatus }) {
  const c = config[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset', c.className)}>
      {c.label}
    </span>
  );
}
