import { useState, useMemo } from 'react';
import {
  Onboarding,
  ChannelContract,
  Channel,
  MoontonEntity,
  MerchantEntity,
  MerchantContract,
} from '../../types';
import { insertOnboarding } from '../../lib/contractService';
import { OnboardingStatusBadge } from './OnboardingStatusBadge';
import { MerchantModeBadge } from '../channel/MerchantModeBadge';
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
import { Plus, ClipboardList, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { OnboardingModal } from './OnboardingModal';
import { toast } from 'sonner';

interface OnboardingPageProps {
  onboardings: Onboarding[];
  channelContracts: ChannelContract[];
  channels: Channel[];
  moontonEntities: MoontonEntity[];
  merchantEntities: MerchantEntity[];
  merchantContracts: MerchantContract[];
  onRefresh: () => Promise<void>;
  onDrillDown: (onboarding: Onboarding) => void;
}

export function OnboardingPage({
  onboardings,
  channelContracts,
  channels,
  moontonEntities,
  merchantEntities,
  merchantContracts,
  onRefresh,
  onDrillDown,
}: OnboardingPageProps) {
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubjectType, setFilterSubjectType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const getContract = (id: string) => channelContracts.find((c) => c.id === id);
  const getChannel = (id: string) => channels.find((c) => c.id === id);
  const getMoontonEntity = (id: string) => moontonEntities.find((e) => e.id === id);
  const getMerchantEntity = (id: string) => merchantEntities.find((e) => e.id === id);

  const getSubjectName = (ob: Onboarding) => {
    if (ob.moonton_entity_id) return getMoontonEntity(ob.moonton_entity_id)?.name ?? ob.moonton_entity_id;
    if (ob.merchant_entity_id) return getMerchantEntity(ob.merchant_entity_id)?.name ?? ob.merchant_entity_id;
    return '—';
  };

  const getSubjectType = (ob: Onboarding): 'moonton' | 'merchant' | null => {
    if (ob.moonton_entity_id) return 'moonton';
    if (ob.merchant_entity_id) return 'merchant';
    return null;
  };

  const filtered = useMemo(() => {
    return onboardings.filter((ob) => {
      const contract = getContract(ob.channel_contract_id);
      if (!contract) return false;
      if (filterChannel !== 'all' && contract.channel_id !== filterChannel) return false;
      if (filterStatus !== 'all' && ob.status !== filterStatus) return false;
      if (filterSubjectType !== 'all') {
        if (filterSubjectType === 'moonton' && !ob.moonton_entity_id) return false;
        if (filterSubjectType === 'merchant' && !ob.merchant_entity_id) return false;
      }
      return true;
    });
  }, [onboardings, filterChannel, filterStatus, filterSubjectType]);

  const hasFilters = filterChannel !== 'all' || filterStatus !== 'all' || filterSubjectType !== 'all';

  const handleSave = async (data: Omit<Onboarding, 'id'>) => {
    setSaving(true);
    try {
      await insertOnboarding(data);
      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      console.error('Failed to create onboarding:', err);
      toast.error('创建进件失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">进件列表</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有渠道的商户进件申请</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)} disabled={saving}>
          <Plus className="w-4 h-4" />
          新增进件
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

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="DRAFT">待提交</SelectItem>
            <SelectItem value="SUBMITTED">已提交</SelectItem>
            <SelectItem value="REVIEWING">审核中</SelectItem>
            <SelectItem value="APPROVED">已通过</SelectItem>
            <SelectItem value="REJECTED">已拒绝</SelectItem>
            <SelectItem value="VOIDED">已作废</SelectItem>
            <SelectItem value="SUSPENDED">已冻结</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSubjectType} onValueChange={setFilterSubjectType}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue placeholder="全部主体类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部主体类型</SelectItem>
            <SelectItem value="moonton">平台主体</SelectItem>
            <SelectItem value="merchant">商家主体</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-gray-500 hover:text-gray-800"
            onClick={() => { setFilterChannel('all'); setFilterStatus('all'); setFilterSubjectType('all'); }}
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </Button>
        )}

        <span className="ml-auto text-sm text-gray-400">{filtered.length} 条记录</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700 w-32">渠道</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">合同模式</TableHead>
                <TableHead className="font-semibold text-gray-700">进件主体</TableHead>
                <TableHead className="font-semibold text-gray-700 w-32">主体类型</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24">状态</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">提交日期</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">审核日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ob) => {
                const contract = getContract(ob.channel_contract_id);
                const channel = contract ? getChannel(contract.channel_id) : undefined;
                const subjectType = getSubjectType(ob);
                return (
                  <TableRow
                    key={ob.id}
                    className="cursor-pointer hover:bg-gray-50/70 transition-colors"
                    onClick={() => onDrillDown(ob)}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {channel?.display_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {contract && <MerchantModeBadge mode={contract.merchant_mode} />}
                    </TableCell>
                    <TableCell className="text-gray-800">{getSubjectName(ob)}</TableCell>
                    <TableCell>
                      {subjectType && (
                        <SubjectTypeBadge type={subjectType} />
                      )}
                    </TableCell>
                    <TableCell>
                      <OnboardingStatusBadge status={ob.status} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{ob.submitted_at ?? '—'}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{ob.approved_at ?? '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <OnboardingModal
        open={modalOpen}
        channelContracts={channelContracts}
        channels={channels}
        moontonEntities={moontonEntities}
        merchantEntities={merchantEntities}
        merchantContracts={merchantContracts}
        onboardings={onboardings}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function SubjectTypeBadge({ type }: { type: 'moonton' | 'merchant' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        type === 'moonton'
          ? 'bg-sky-50 text-sky-700 border-sky-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      )}
    >
      {type === 'moonton' ? '平台主体' : '商家主体'}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
      <div className="opacity-20 mb-3">
        <ClipboardList className="w-10 h-10" />
      </div>
      <p className="text-sm font-medium">暂无进件记录</p>
      <p className="text-xs mt-1">点击「新增进件」创建进件申请</p>
    </div>
  );
}
