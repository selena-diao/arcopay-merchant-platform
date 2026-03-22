import { useState, useMemo } from 'react';
import { Channel, ChannelContract, MoontonEntity } from '../../types';
import { ChannelContractStatusBadge } from '../channel/ChannelStatusBadge';
import { MerchantModeBadge } from '../channel/MerchantModeBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Button } from '../ui/button';
import { handleSaveError } from '../../lib/errorHandler';
import { toast } from 'sonner';
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
import { FileText, Ban, ChevronDown, X, Plus, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChannelContractModal } from '../channel/ChannelContractModal';
import { insertChannelContract, deleteChannelContract } from '../../lib/contractService';

interface ChannelContractsPageProps {
  contracts: ChannelContract[];
  channels: Channel[];
  moontonEntities: MoontonEntity[];
  onRefresh: () => Promise<void>;
  onDrillDown: (contract: ChannelContract) => void;
  initialChannelFilter?: string;
}

export function ChannelContractsPage({
  contracts,
  channels,
  moontonEntities,
  onRefresh,
  onDrillDown,
  initialChannelFilter,
}: ChannelContractsPageProps) {
  const [filterChannel, setFilterChannel] = useState(initialChannelFilter ?? 'all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteContract, setDeleteContract] = useState<ChannelContract | null>(null);
  const [newContractModalOpen, setNewContractModalOpen] = useState(false);
  const [newContractChannelId, setNewContractChannelId] = useState<string>('');

  const getChannel = (id: string) => channels.find((c) => c.id === id);
  const getEntity = (id: string) => moontonEntities.find((e) => e.id === id);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (filterChannel !== 'all' && c.channel_id !== filterChannel) return false;
      if (filterEntity !== 'all' && c.moonton_entity_id !== filterEntity) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      return true;
    });
  }, [contracts, filterChannel, filterEntity, filterStatus]);

  const activeContracts = filtered.filter((c) => c.status === 'ACTIVE' || c.status === 'DRAFT');
  const historicalContracts = filtered.filter((c) => c.status === 'TERMINATED' || c.status === 'VOIDED');

  const handleDelete = async () => {
    if (!deleteContract) return;
    const target = deleteContract;
    setDeleteContract(null);
    try {
      await deleteChannelContract(target.id);
      toast.success('合同已删除');
    } catch (err) {
      handleSaveError(err);
    }
    await onRefresh();
  };

  const handleNewContract = async (data: Omit<ChannelContract, 'id'>) => {
    try {
      await insertChannelContract(data);
      setNewContractModalOpen(false);
      await onRefresh();
    } catch (err) {
      handleSaveError(err);
    }
  };

  const openNewContractModal = () => {
    const channelId = filterChannel !== 'all' ? filterChannel : (channels[0]?.id ?? '');
    setNewContractChannelId(channelId);
    setNewContractModalOpen(true);
  };

  const hasFilters = filterChannel !== 'all' || filterEntity !== 'all' || filterStatus !== 'all';

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">渠道合同</h1>
          <p className="text-sm text-gray-500 mt-1">所有渠道的合同汇总视图</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNewContractModal}>
          <Plus className="w-4 h-4" />
          新增合同
        </Button>
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

        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="全部平台主体" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台主体</SelectItem>
            {moontonEntities.filter((e) => !e.is_display_only).map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="DRAFT">草稿</SelectItem>
            <SelectItem value="ACTIVE">有效</SelectItem>
            <SelectItem value="TERMINATED">已终止</SelectItem>
            <SelectItem value="VOIDED">已作废</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-gray-500 hover:text-gray-800"
            onClick={() => { setFilterChannel('all'); setFilterEntity('all'); setFilterStatus('all'); }}
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </Button>
        )}

        <span className="ml-auto text-sm text-gray-400">
          {activeContracts.length} 份有效合同
          {historicalContracts.length > 0 && `，${historicalContracts.length} 份历史合同`}
        </span>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {activeContracts.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <ContractTableHeader />
              </TableHeader>
              <TableBody>
                {activeContracts.map((contract) => (
                  <ContractRow
                    key={contract.id}
                    contract={contract}
                    channel={getChannel(contract.channel_id)}
                    entity={getEntity(contract.moonton_entity_id)}
                    onView={() => onDrillDown(contract)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {historicalContracts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-gray-400" />
                历史合同
                <span className="text-xs text-gray-400 font-normal">({historicalContracts.length} 条)</span>
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-gray-400 transition-transform duration-200',
                  historyOpen ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>
            {historyOpen && (
              <div className="border-t border-gray-100">
                <Table>
                  <TableHeader>
                    <ContractTableHeader historical />
                  </TableHeader>
                  <TableBody>
                    {historicalContracts.map((contract) => (
                      <ContractRow
                        key={contract.id}
                        contract={contract}
                        channel={getChannel(contract.channel_id)}
                        entity={getEntity(contract.moonton_entity_id)}
                        historical
                        onView={() => onDrillDown(contract)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteContract}
        title="确认删除合同"
        description="即将永久删除该合同记录，此操作不可撤销，是否继续？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteContract(null)}
      />

      {newContractModalOpen && (
        <ChannelContractModal
          open={newContractModalOpen}
          channels={channels}
          moontonEntities={moontonEntities}
          initialChannelId={newContractChannelId || undefined}
          contract={null}
          onClose={() => setNewContractModalOpen(false)}
          onSave={handleNewContract}
        />
      )}
    </div>
  );
}

function ContractTableHeader({ historical }: { historical?: boolean }) {
  return (
    <TableRow className={cn('hover:bg-gray-50/60', historical ? 'bg-gray-50/40' : 'bg-gray-50/60')}>
      <TableHead className="font-semibold text-gray-700 w-36">渠道</TableHead>
      <TableHead className="font-semibold text-gray-700 w-36">平台主体</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">商户模式</TableHead>
      <TableHead className="font-semibold text-gray-700 w-24">渠道费率</TableHead>
      <TableHead className="font-semibold text-gray-700 w-24">结算周期</TableHead>
      <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">签署日期</TableHead>
      {historical && <TableHead className="font-semibold text-gray-700">作废原因</TableHead>}
      <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
    </TableRow>
  );
}

interface ContractRowProps {
  contract: ChannelContract;
  channel?: Channel;
  entity?: MoontonEntity;
  historical?: boolean;
  onView: () => void;
}

function ContractRow({ contract, channel, entity, historical, onView }: ContractRowProps) {
  return (
    <TableRow
      className={cn(
        'transition-colors cursor-pointer',
        historical ? 'hover:bg-gray-50/50 opacity-75' : 'hover:bg-gray-50/70'
      )}
      onClick={onView}
    >
      <TableCell className="font-medium text-gray-900">
        {channel?.display_name ?? contract.channel_id}
      </TableCell>
      <TableCell className="text-gray-700">
        {entity?.name ?? contract.moonton_entity_id}
      </TableCell>
      <TableCell>
        <MerchantModeBadge mode={contract.merchant_mode} />
      </TableCell>
      <TableCell className="text-gray-700 font-semibold tabular-nums text-sm">
        {(contract.channel_rate * 100).toFixed(2)}%
      </TableCell>
      <TableCell className="text-gray-500 text-sm">{contract.settlement_cycle} 天</TableCell>
      <TableCell>
        <ChannelContractStatusBadge status={contract.status} />
      </TableCell>
      <TableCell className="text-gray-500 text-sm">{contract.signed_at}</TableCell>
      {historical && (
        <TableCell className="text-gray-400 text-xs max-w-40 truncate" title={contract.termination_reason}>
          {contract.termination_reason ?? '—'}
        </TableCell>
      )}
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onView}
          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
        >
          详情
          <ArrowRight className="w-3 h-3" />
        </button>
      </TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
      <div className="opacity-20 mb-3">
        <FileText className="w-10 h-10" />
      </div>
      <p className="text-sm font-medium">暂无有效合同</p>
      <p className="text-xs mt-1">请前往渠道详情页新增合同</p>
    </div>
  );
}
