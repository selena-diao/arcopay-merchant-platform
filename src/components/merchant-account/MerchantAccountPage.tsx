import { useState, useMemo } from 'react';
import {
  MerchantAccount,
  Channel,
  ChannelContract,
  Onboarding,
} from '../../types';
import { MerchantAccountStatusBadge } from './MerchantAccountStatusBadge';
import { MerchantModeBadge } from '../channel/MerchantModeBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { KeyRound, X, ArrowRight, ExternalLink } from 'lucide-react';

interface MerchantAccountPageProps {
  merchantAccounts: MerchantAccount[];
  channels: Channel[];
  channelContracts: ChannelContract[];
  onboardings: Onboarding[];
  onDrillDown: (account: MerchantAccount) => void;
  onViewContract: (contract: ChannelContract) => void;
  onViewOnboarding: (onboarding: Onboarding) => void;
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return '••••••••' + key.slice(-8);
}

export function MerchantAccountPage({
  merchantAccounts,
  channels,
  channelContracts,
  onboardings,
  onDrillDown,
  onViewContract,
  onViewOnboarding,
}: MerchantAccountPageProps) {
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const getChannel = (id: string) => channels.find((c) => c.id === id);
  const getContract = (id: string) => channelContracts.find((c) => c.id === id);
  const getOnboarding = (id: string) => onboardings.find((ob) => ob.id === id);

  const filtered = useMemo(() => {
    return merchantAccounts.filter((ma) => {
      if (filterChannel !== 'all' && ma.channel_id !== filterChannel) return false;
      if (filterMode !== 'all') {
        const contract = getContract(ma.channel_contract_id);
        if (!contract || contract.merchant_mode !== filterMode) return false;
      }
      if (filterStatus !== 'all' && ma.status !== filterStatus) return false;
      return true;
    });
  }, [merchantAccounts, filterChannel, filterMode, filterStatus]);

  const hasFilters = filterChannel !== 'all' || filterMode !== 'all' || filterStatus !== 'all';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商户号管理</h1>
          <p className="text-sm text-gray-500 mt-1">进件审核通过后自动生成的渠道商户号</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <KeyRound className="w-4 h-4 flex-shrink-0 text-amber-500" />
        商户号由进件审核通过后自动生成，如需变更请重新发起进件
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="全部渠道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道</SelectItem>
            {channels.map((ch) => (
              <SelectItem key={ch.id} value={ch.id}>{ch.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMode} onValueChange={setFilterMode}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部模式</SelectItem>
            <SelectItem value="MOR">MOR</SelectItem>
            <SelectItem value="SOR">SOR</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="ACTIVE">启用</SelectItem>
            <SelectItem value="INACTIVE">停用</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-gray-500 hover:text-gray-800"
            onClick={() => { setFilterChannel('all'); setFilterMode('all'); setFilterStatus('all'); }}
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </Button>
        )}

        <span className="ml-auto text-sm text-gray-400">
          共 {filtered.length} 条记录
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700 w-32">商户号ID</TableHead>
                <TableHead className="font-semibold text-gray-700 w-32">渠道</TableHead>
                <TableHead className="font-semibold text-gray-700 w-40">所属合同</TableHead>
                <TableHead className="font-semibold text-gray-700 w-36">来源进件</TableHead>
                <TableHead className="font-semibold text-gray-700">API Key</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24">模式</TableHead>
                <TableHead className="font-semibold text-gray-700 w-20">状态</TableHead>
                <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ma) => {
                const channel = getChannel(ma.channel_id);
                const contract = getContract(ma.channel_contract_id);
                const onboarding = getOnboarding(ma.onboarding_id);
                return (
                  <TableRow
                    key={ma.id}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => onDrillDown(ma)}
                  >
                    <TableCell className="font-mono text-xs text-gray-500">{ma.id}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {channel?.display_name ?? ma.channel_id}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {contract ? (
                        <button
                          onClick={() => onViewContract(contract)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <span className="font-mono">{contract.id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {onboarding ? (
                        <button
                          onClick={() => onViewOnboarding(onboarding)}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <span className="font-mono">{onboarding.id}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">
                      {maskApiKey(ma.api_key)}
                    </TableCell>
                    <TableCell>
                      {contract ? (
                        <MerchantModeBadge mode={contract.merchant_mode} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <MerchantAccountStatusBadge status={ma.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onDrillDown(ma)}
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                      >
                        详情
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
      <div className="opacity-20 mb-3">
        <KeyRound className="w-10 h-10" />
      </div>
      <p className="text-sm font-medium">暂无商户号记录</p>
      <p className="text-xs mt-1">进件审核通过后将自动生成</p>
    </div>
  );
}
