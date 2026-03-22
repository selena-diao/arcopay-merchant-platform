import { OnboardingStatus } from '../../types';
import { cn } from '../../lib/utils';

const statusConfig: Record<OnboardingStatus, { label: string; className: string }> = {
  DRAFT: { label: '待提交', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  SUBMITTED: { label: '已提交', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REVIEWING: { label: '审核中', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  APPROVED: { label: '已通过', className: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: '已拒绝', className: 'bg-red-50 text-red-700 border-red-200' },
  VOIDED: { label: '已作废', className: 'bg-gray-100 text-gray-400 border-gray-200' },
  SUSPENDED: { label: '已冻结', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export function OnboardingStatusBadge({ status }: { status: OnboardingStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
