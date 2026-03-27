import { useState, useMemo } from 'react';
import {
  MerchantContract,
  ChannelContract,
  MoontonEntity,
  Merchant,
} from '../../types';
import { MerchantContractStatusBadge } from './MerchantContractStatusBadge';
import { MerchantContractModal } from './MerchantContractModal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Button } from '../ui/button';
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
import { Plus, Trash2, Ban, ChevronDown, X, Handshake, TriangleAlert as AlertTriangle, ArrowRight, Triangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { insertMerchantContract, deleteMerchantContract } from '../../lib/contractService';
import { handleSaveError } from '../../lib/errorHandler';
import { toast } from 'sonner';

interface MerchantContractPageProps {
  contracts: MerchantContract[];
  channelContracts: ChannelContract[];
  moontonEntities: MoontonEntity[];
  merchants: Merchant[];
  onRefresh: () => Promise<void>;
  onDrillDown: (contract: MerchantContract) => void;
}

export function MerchantContractPage({
  contracts,
  channelContracts,
  moontonEntities,
  merchants,
  onRefresh,
  onDrillDown,
}: MerchantContractPageProps) {
  const [filterMerchant, setFilterMerchant] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rateFilter, setRateFilter] = useState<null | 'inverted' | 'at-risk'>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteContract, setDeleteContract] = useState<MerchantContract | null>(null);

  const getMerchant = (id: string) => merchants.find((m) => m.id === id);
  const getEntity = (id: string) => moontonEntities.find((e) => e.id === id);

  const entityChannelRates = useMemo(() => {
    const map: Record<string, { min: number; max: number }> = {};
    for (const cc of channelContracts) {
      if (cc.status !== 'ACTIVE') continue;
      const eid = cc.moonton_entity_id;
      if (!map[eid]) {
        map[eid] = { min: cc.channel_rate, max: cc.channel_rate };
      } else {
        if (cc.channel_rate < map[eid].min) map[eid].min = cc.channel_rate;
        if (cc.channel_rate > map[eid].max) map[eid].max = cc.channel_rate;
      }
    }
    return map;
  }, [channelContracts]);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (filterMerchant !== 'all' && c.merchant_id !== filterMerchant) return false;
      if (filterEntity !== 'all' && c.moonton_entity_id !== filterEntity) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (rateFilter !== null) {
        const rates = entityChannelRates[c.moonton_entity_id];
        if (!rates) return false;
        const lowerBound = c.quoted_rate - rates.max;
        const upperBound = c.quoted_rate - rates.min;
        if (rateFilter === 'inverted') {
          if (!(upperBound <= 0)) return false;
        } else if (rateFilter === 'at-risk') {
          if (!(lowerBound < 0 && upperBound > 0)) return false;
        }
      }
      return true;
    });
  }, [contracts, filterMerchant, filterEntity, filterStatus, rateFilter, entityChannelRates]);

  const activeContracts = filtered.filter((c) => c.status === 'ACTIVE' || c.status === 'DRAFT');
  const historicalContracts = filtered.filter((c) => c.status === 'TERMINATED' || c.status === 'VOIDED');

  const hasFilters = filterMerchant !== 'all' || filterEntity !== 'all' || filterStatus !== 'all' || rateFilter !== null;

  const handleSave = async (data: Omit<MerchantContract, 'id'>) => {
    try {
      await insertMerchantContract(data);
      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      handleSaveError(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteContract) return;
    const target = deleteContract;
    setDeleteContract(null);
    try {
      await deleteMerchantContract(target.id);
      toast.success('合同已删除');
    } catch (err) {
      handleSaveError(err);
    }
    await onRefresh();
  };

  const invertedCount = activeContracts.filter((c) => {
    const rates = entityChannelRates[c.moonton_entity_id];
    if (!rates) return false;
    const upperBound = c.quoted_rate - rates.min;
    return upperBound <= 0;
  }).length;

  const atRiskCount = activeContracts.filter((c) => {
    const rates = entityChannelRates[c.moonton_entity_id];
    if (!rates) return false;
    const lowerBound = c.quoted_rate - rates.max;
    const upperBound = c.quoted_rate - rates.min;
    return lowerBound < 0 && upperBound > 0;
  }).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商户合同</h1>
          <p className="text-sm text-gray-500 mt-1">管理与商家签署的费率合同</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          新增合同
        </Button>
      </div>

      {(invertedCount > 0 || atRiskCount > 0) && (
        <div className="mb-4 space-y-2">
          {invertedCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">
                检测到 <span className="font-semibold">{invertedCount}</span> 份合同
                <span className="font-semibold">费率已倒挂</span>，请立即处理。
              </span>
              <button
                onClick={() => setRateFilter(rateFilter === 'inverted' ? null : 'inverted')}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border transition-colors',
                  rateFilter === 'inverted'
                    ? 'bg-red-200 border-red-300 text-red-800'
                    : 'bg-white border-red-300 text-red-700 hover:bg-red-100'
                )}
              >
                {rateFilter === 'inverted' ? <X className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                {rateFilter === 'inverted' ? '取消筛选' : '立即处理'}
              </button>
            </div>
          )}
          {atRiskCount > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <Triangle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">
                检测到 <span className="font-semibold">{atRiskCount}</span> 份合同存在
                <span className="font-semibold">倒挂风险</span>，报价低于同主体最高渠道费率，请关注。
              </span>
              <button
                onClick={() => setRateFilter(rateFilter === 'at-risk' ? null : 'at-risk')}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border transition-colors',
                  rateFilter === 'at-risk'
                    ? 'bg-orange-200 border-orange-300 text-orange-800'
                    : 'bg-white border-orange-300 text-orange-700 hover:bg-orange-100'
                )}
              >
                {rateFilter === 'at-risk' ? <X className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                {rateFilter === 'at-risk' ? '取消筛选' : '立即处理'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Select value={filterMerchant} onValueChange={setFilterMerchant}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="全部商家" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部商家</SelectItem>
            {merchants.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
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
            onClick={() => { setFilterMerchant('all'); setFilterEntity('all'); setFilterStatus('all'); setRateFilter(null); }}
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

      {rateFilter !== null && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500">当前筛选：</span>
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
            rateFilter === 'inverted' ? 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200' : 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200'
          )}>
            {rateFilter === 'inverted' ? '筛选：已倒挂' : '筛选：倒挂风险'}
            <button
              onClick={() => setRateFilter(null)}
              className="hover:opacity-70 transition-opacity"
              aria-label="清除筛选"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

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
                    merchant={getMerchant(contract.merchant_id)}
                    entity={getEntity(contract.moonton_entity_id)}
                    entityRates={entityChannelRates[contract.moonton_entity_id] ?? null}
                    onDrillDown={() => onDrillDown(contract)}
                    onDelete={() => setDeleteContract(contract)}
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
                        merchant={getMerchant(contract.merchant_id)}
                        entity={getEntity(contract.moonton_entity_id)}
                        entityRates={entityChannelRates[contract.moonton_entity_id] ?? null}
                        historical
                        onDrillDown={() => onDrillDown(contract)}
                        onDelete={() => setDeleteContract(contract)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>

      <MerchantContractModal
        open={modalOpen}
        moontonEntities={moontonEntities}
        merchants={merchants}
        channelContracts={channelContracts}
        contract={null}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteContract}
        title="确认删除合同"
        description="即将永久删除该合同记录，此操作不可撤销，是否继续？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteContract(null)}
      />
    </div>
  );
}

function ContractTableHeader({ historical }: { historical?: boolean }) {
  return (
    <TableRow className={cn('hover:bg-gray-50/60', historical ? 'bg-gray-50/40' : 'bg-gray-50/60')}>
      <TableHead className="font-semibold text-gray-700 w-36">商家</TableHead>
      <TableHead className="font-semibold text-gray-700 w-36">平台主体</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">商户费率</TableHead>
      <TableHead className="font-semibold text-gray-700 w-48">
        <span className="flex items-center gap-1">
          费率差
          <span className="text-xs text-gray-400 font-normal">(vs 同主体渠道区间)</span>
        </span>
      </TableHead>
      <TableHead className="font-semibold text-gray-700 w-24">结算周期</TableHead>
      <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">签署日期</TableHead>
      {historical && <TableHead className="font-semibold text-gray-700">作废原因</TableHead>}
      <TableHead className="font-semibold text-gray-700 w-28 text-right">操作</TableHead>
    </TableRow>
  );
}

interface ContractRowProps {
  contract: MerchantContract;
  merchant?: Merchant;
  entity?: MoontonEntity;
  entityRates: { min: number; max: number } | null;
  historical?: boolean;
  onDrillDown?: () => void;
  onDelete: () => void;
}

function formatBound(val: number): string {
  const pct = (val * 100).toFixed(2);
  return val >= 0 ? `+${pct}%` : `${pct}%`;
}

function ContractRow({ contract, merchant, entity, entityRates, historical, onDrillDown, onDelete }: ContractRowProps) {
  const lowerBound = entityRates !== null ? contract.quoted_rate - entityRates.max : null;
  const upperBound = entityRates !== null ? contract.quoted_rate - entityRates.min : null;

  const isInverted = upperBound !== null && upperBound <= 0;
  const isAtRisk = lowerBound !== null && upperBound !== null && lowerBound < 0 && upperBound > 0;
  const isSingleRate = entityRates !== null && entityRates.min === entityRates.max;

  return (
    <TableRow className={cn(
      'transition-colors',
      historical ? 'hover:bg-gray-50/50 opacity-75' : 'hover:bg-gray-50/70',
      isInverted && !historical ? 'bg-red-50/30' : '',
      isAtRisk && !historical ? 'bg-orange-50/20' : ''
    )}>
      <TableCell className="font-medium text-gray-900">
        {merchant?.name ?? contract.merchant_id}
      </TableCell>
      <TableCell className="text-gray-700">
        {entity?.name ?? contract.moonton_entity_id}
      </TableCell>
      <TableCell className="font-semibold tabular-nums text-sm text-gray-700">
        {(contract.quoted_rate * 100).toFixed(2)}%
      </TableCell>
      <TableCell>
        {lowerBound !== null && upperBound !== null ? (
          isInverted ? (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 ring-1 ring-inset ring-red-200 w-fit">
                <AlertTriangle className="w-3 h-3" />
                ⚠ 已倒挂
              </span>
              <span className="text-xs text-red-500 tabular-nums font-mono">
                {isSingleRate ? formatBound(upperBound) : `${formatBound(lowerBound)} ~ ${formatBound(upperBound)}`}
              </span>
            </div>
          ) : isAtRisk ? (
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200 w-fit">
                <Triangle className="w-3 h-3" />
                △ 倒挂风险
              </span>
              <span className="text-xs text-orange-500 tabular-nums font-mono">
                {formatBound(lowerBound)} ~ {formatBound(upperBound)}
              </span>
            </div>
          ) : (
            <span className="text-emerald-600 font-semibold tabular-nums text-sm font-mono">
              {isSingleRate ? formatBound(upperBound) : `${formatBound(lowerBound)} ~ ${formatBound(upperBound)}`}
            </span>
          )
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-gray-500 text-sm">{contract.settlement_cycle} 天</TableCell>
      <TableCell>
        <MerchantContractStatusBadge status={contract.status} />
      </TableCell>
      <TableCell className="text-gray-500 text-sm">{contract.signed_at}</TableCell>
      {historical && (
        <TableCell className="text-gray-400 text-xs max-w-40 truncate" title={contract.terminated_reason}>
          {contract.terminated_reason ?? '—'}
        </TableCell>
      )}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {onDrillDown && (
            <button
              onClick={onDrillDown}
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors mr-1"
            >
              详情
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
      <div className="opacity-20 mb-3">
        <Handshake className="w-10 h-10" />
      </div>
      <p className="text-sm font-medium">暂无商户合同</p>
      <p className="text-xs mt-1">点击「新增合同」添加商户合同</p>
    </div>
  );
}
