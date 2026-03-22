import { MerchantAccountStatus } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  status: MerchantAccountStatus;
}

export function MerchantAccountStatusBadge({ status }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        status === 'ACTIVE'
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-gray-100 text-gray-500 ring-gray-200'
      )}
    >
      {status === 'ACTIVE' ? '启用' : '停用'}
    </span>
  );
}
