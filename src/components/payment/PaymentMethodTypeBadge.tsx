import { PaymentMethodType } from '../../types';
import { cn } from '../../lib/utils';

const typeConfig: Record<PaymentMethodType, { label: string; className: string }> = {
  DIGITAL_WALLET: { label: 'DIGITAL WALLET', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  CARD: { label: 'CARD', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PREPAID: { label: 'PREPAID', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  BANK_TRANSFER: { label: 'BANK TRANSFER', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  BNPL: { label: 'BNPL', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CRYPTO: { label: 'CRYPTO', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const fallbackConfig = { label: 'UNKNOWN', className: 'bg-gray-100 text-gray-500 border-gray-200' };

export function PaymentMethodTypeBadge({ type }: { type: PaymentMethodType }) {
  const config = typeConfig[type] ?? fallbackConfig;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}
