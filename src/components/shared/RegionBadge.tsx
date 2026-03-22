import { Region } from '../../types';
import { cn } from '../../lib/utils';

const regionConfig: Record<string, { label: string; className: string }> = {
  CN_MAINLAND: {
    label: '中国大陆',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
  CN: {
    label: '中国大陆',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
  HK: {
    label: '香港',
    className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  },
  SG: {
    label: '新加坡',
    className: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  },
  OTHER: {
    label: '其他',
    className: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  },
};

interface RegionBadgeProps {
  region: Region | null;
}

export function RegionBadge({ region }: RegionBadgeProps) {
  if (!region) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 ring-1 ring-slate-200">
        签约策略
      </span>
    );
  }
  const config = regionConfig[region];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 ring-1 ring-slate-200">
        {region}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
