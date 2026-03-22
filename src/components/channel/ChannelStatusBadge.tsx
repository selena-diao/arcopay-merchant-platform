import { ChannelStatus, ChannelContractStatus } from '../../types';
import { cn } from '../../lib/utils';

const channelStatusConfig: Record<ChannelStatus, { label: string; className: string }> = {
  ACTIVE: { label: '运营中', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  INACTIVE: { label: '已停用', className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  MAINTENANCE: { label: '维护中', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
};

const contractStatusConfig: Record<ChannelContractStatus, { label: string; className: string }> = {
  DRAFT: { label: '草稿', className: 'bg-gray-100 text-gray-500 ring-gray-200' },
  ACTIVE: { label: '有效', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  TERMINATED: { label: '已终止', className: 'bg-red-50 text-red-600 ring-red-200' },
  VOIDED: { label: '已作废', className: 'bg-gray-100 text-gray-400 ring-gray-200' },
};

export function ChannelStatusBadge({ status }: { status: ChannelStatus }) {
  const config = channelStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset', config.className)}>
      {config.label}
    </span>
  );
}

export function ChannelContractStatusBadge({ status }: { status: ChannelContractStatus }) {
  const config = contractStatusConfig[status];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset', config.className)}>
      {config.label}
    </span>
  );
}
