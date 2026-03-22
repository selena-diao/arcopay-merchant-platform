import { useState, useMemo } from 'react';
import {
  Onboarding,
  OnboardingStatus,
  ChannelContract,
  MerchantContract,
  Channel,
  MoontonEntity,
  MerchantEntity,
} from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { CircleAlert as AlertCircle, ChevronRight, Building2, Store, Loader as Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';

type OnboardingType = 'platform' | 'merchant';
type Step = 0 | 1 | 2;

interface OnboardingModalProps {
  open: boolean;
  channelContracts: ChannelContract[];
  channels: Channel[];
  moontonEntities: MoontonEntity[];
  merchantEntities: MerchantEntity[];
  merchantContracts: MerchantContract[];
  onboardings: Onboarding[];
  onClose: () => void;
  onSave: (data: Omit<Onboarding, 'id'>) => Promise<void>;
}

export function OnboardingModal({
  open,
  channelContracts,
  channels,
  moontonEntities,
  merchantEntities,
  merchantContracts,
  onboardings,
  onClose,
  onSave,
}: OnboardingModalProps) {
  const [step, setStep] = useState<Step>(0);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const activeOnboardingStatuses = new Set(['APPROVED', 'SUBMITTED', 'REVIEWING'] as const);

  const activeContracts = useMemo(
    () => channelContracts.filter((c) => c.status === 'ACTIVE'),
    [channelContracts]
  );

  const filteredContracts = useMemo(() => {
    const morContracts = activeContracts.filter((c) => c.merchant_mode === 'MOR');
    if (onboardingType === 'platform') {
      return morContracts.filter((c) => {
        return !onboardings.some(
          (ob) =>
            ob.channel_contract_id === c.id &&
            ob.moonton_entity_id !== null &&
            ob.merchant_entity_id === null &&
            activeOnboardingStatuses.has(ob.status as 'APPROVED' | 'SUBMITTED' | 'REVIEWING')
        );
      });
    }
    return activeContracts;
  }, [activeContracts, onboardingType, onboardings]);

  const getChannel = (id: string) => channels.find((c) => c.id === id);
  const getMoontonEntity = (id: string) => moontonEntities.find((e) => e.id === id);

  const selectedContract = activeContracts.find((c) => c.id === selectedContractId);

  const merchantEntityStatusMap = useMemo(() => {
    if (!selectedContract) return new Map<string, OnboardingStatus>();
    const map = new Map<string, OnboardingStatus>();
    const contractsOnChannel = channelContracts
      .filter((c) => c.channel_id === selectedContract.channel_id)
      .map((c) => c.id);
    for (const ob of onboardings) {
      if (!ob.merchant_entity_id) continue;
      if (!contractsOnChannel.includes(ob.channel_contract_id)) continue;
      if (!activeOnboardingStatuses.has(ob.status as 'APPROVED' | 'SUBMITTED' | 'REVIEWING')) continue;
      if (!map.has(ob.merchant_entity_id)) {
        map.set(ob.merchant_entity_id, ob.status);
      }
    }
    return map;
  }, [selectedContract, channelContracts, onboardings]);

  const merchantIdsWithValidContract = useMemo(() => {
    if (!selectedContract || onboardingType !== 'merchant') return new Set<string>();
    return new Set(
      merchantContracts
        .filter(
          (mc) =>
            mc.status === 'ACTIVE' &&
            mc.moonton_entity_id === selectedContract.moonton_entity_id
        )
        .map((mc) => mc.merchant_id)
    );
  }, [selectedContract, onboardingType, merchantContracts]);

  const noValidMerchantContractExists =
    onboardingType === 'merchant' &&
    !!selectedContract &&
    merchantIdsWithValidContract.size === 0;

  const platformPrerequisite = useMemo(() => {
    if (!selectedContract || onboardingType !== 'merchant') return null;
    return onboardings.find((ob) => {
      if (ob.moonton_entity_id === null) return false;
      const obContract = channelContracts.find((cc) => cc.id === ob.channel_contract_id);
      return obContract?.channel_id === selectedContract.channel_id && ob.status === 'APPROVED';
    }) ?? null;
  }, [selectedContract, onboardingType, onboardings, channelContracts]);

  const missingPlatformPrerequisite = onboardingType === 'merchant' && !!selectedContract && platformPrerequisite === null;

  const conflictWarning = useMemo(() => {
    if (!selectedContractId || !selectedSubjectId) return false;
    return onboardings.some((ob) => {
      if (ob.channel_contract_id !== selectedContractId) return false;
      if (ob.status === 'VOIDED' || ob.status === 'REJECTED') return false;
      if (ob.merchant_entity_id === selectedSubjectId) return true;
      return false;
    });
  }, [selectedContractId, selectedSubjectId, onboardings]);

  const handleReset = () => {
    setStep(0);
    setOnboardingType(null);
    setSelectedContractId('');
    setSelectedSubjectId('');
    setSaving(false);
  };

  const handleClose = () => {
    if (saving) return;
    handleReset();
    onClose();
  };

  const handleSelectType = (type: OnboardingType) => {
    setOnboardingType(type);
    setSelectedContractId('');
    setSelectedSubjectId('');
  };

  const handleTypeNext = () => {
    if (onboardingType) setStep(1);
  };

  const handleContractNext = async () => {
    if (!selectedContractId || !selectedContract || saving) return;
    if (onboardingType === 'platform') {
      setSaving(true);
      try {
        await onSave({
          channel_contract_id: selectedContractId,
          moonton_entity_id: selectedContract.moonton_entity_id,
          merchant_entity_id: null,
          status: 'DRAFT',
          submitted_at: null,
          approved_at: null,
          rejected_reason: null,
          merchant_account_id: null,
          prerequisite_onboarding_id: null,
        });
        handleReset();
      } catch (err) {
        handleSaveError(err);
        setSaving(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!selectedContract || !selectedSubjectId || saving) return;
    setSaving(true);
    try {
      await onSave({
        channel_contract_id: selectedContractId,
        moonton_entity_id: null,
        merchant_entity_id: selectedSubjectId,
        status: 'DRAFT',
        submitted_at: null,
        approved_at: null,
        rejected_reason: null,
        merchant_account_id: null,
        prerequisite_onboarding_id: platformPrerequisite?.id ?? null,
      });
      handleReset();
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  const contractLabel = (c: ChannelContract) => {
    const ch = getChannel(c.channel_id);
    const entity = getMoontonEntity(c.moonton_entity_id);
    return `${ch?.display_name ?? c.channel_id} · ${entity?.name ?? c.moonton_entity_id} · ${(c.channel_rate * 100).toFixed(2)}%`;
  };

  const isPlatform = onboardingType === 'platform';
  const stepCount = isPlatform ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增进件</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1.5 mb-6">
          <StepIndicator step={1} current={step === 0 ? 1 : step + 1} label="进件类型" total={stepCount} />
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <StepIndicator step={2} current={step === 0 ? 1 : step + 1} label="选择渠道合同" total={stepCount} />
          {!isPlatform && onboardingType !== null && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <StepIndicator step={3} current={step === 0 ? 1 : step + 1} label="选择进件主体" total={stepCount} />
            </>
          )}
          {onboardingType === null && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <StepIndicator step={3} current={1} label="选择进件主体" total={3} />
            </>
          )}
        </div>

        {step === 0 && (
          <div className="space-y-3 py-2">
            <Label className="text-sm font-medium text-gray-700">进件类型</Label>
            <div className="grid grid-cols-1 gap-3">
              <OnboardingTypeCard
                selected={onboardingType === 'platform'}
                onClick={() => handleSelectType('platform')}
                icon={<Building2 className="w-5 h-5" />}
                title="平台主体进件"
                description="ArcoPay 向渠道申请开户"
              />
              <OnboardingTypeCard
                selected={onboardingType === 'merchant'}
                onClick={() => handleSelectType('merchant')}
                icon={<Store className="w-5 h-5" />}
                title="商家主体进件"
                description="商家向 ArcoPay 申请接入"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">渠道合同</Label>
              <Select value={selectedContractId} onValueChange={setSelectedContractId} disabled={saving}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择有效合同..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredContracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {contractLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                {isPlatform ? '仅显示 MOR 模式的有效合同' : '显示所有有效合同'}
              </p>
            </div>

            {selectedContract && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-1.5">
                <ContractDetailRow label="渠道" value={getChannel(selectedContract.channel_id)?.display_name ?? selectedContract.channel_id} />
                <ContractDetailRow label="平台主体" value={getMoontonEntity(selectedContract.moonton_entity_id)?.name ?? selectedContract.moonton_entity_id} />
                <ContractDetailRow label="商户模式" value={selectedContract.merchant_mode} />
                <ContractDetailRow label="渠道费率" value={`${(selectedContract.channel_rate * 100).toFixed(2)}%`} />
                <ContractDetailRow label="结算周期" value={`${selectedContract.settlement_cycle} 天`} />
              </div>
            )}

            {noValidMerchantContractExists && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>该商家与当前平台主体尚无有效商户合同，无法提交进件</span>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedContract && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">商家主体</Label>
              <div className="rounded-md border border-gray-200 divide-y divide-gray-100 max-h-52 overflow-y-auto">
                {merchantEntities.map((e) => {
                  const blockedStatus = merchantEntityStatusMap.get(e.id);
                  const hasNoContract = !merchantIdsWithValidContract.has(e.merchant_id);
                  const isBlocked = !!blockedStatus || hasNoContract || saving;
                  const isSelected = selectedSubjectId === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => !isBlocked && setSelectedSubjectId(e.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors',
                        isBlocked
                          ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                          : isSelected
                          ? 'bg-blue-50 text-blue-900'
                          : 'hover:bg-gray-50 text-gray-800'
                      )}
                    >
                      <span>{e.name}</span>
                      {blockedStatus && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          blockedStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          {blockedStatus === 'APPROVED' ? '已接入' : '审核中'}
                        </span>
                      )}
                      {!blockedStatus && hasNoContract && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-500">
                          无合同
                        </span>
                      )}
                      {isSelected && !isBlocked && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">已接入或审核中的主体不可重复进件；无合同的主体需先签署商户合同</p>
            </div>

            {missingPlatformPrerequisite && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>该渠道尚未完成平台主体进件，请先完成平台主体进件后再提交</span>
              </div>
            )}

            {conflictWarning && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>该主体在此合同下已存在进行中的进件，继续创建可能导致重复进件。</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep((step - 1) as Step)} disabled={saving}>
              上一步
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            取消
          </Button>
          {step === 0 && (
            <Button onClick={handleTypeNext} disabled={!onboardingType}>
              下一步
            </Button>
          )}
          {step === 1 && (
            <Button onClick={handleContractNext} disabled={!selectedContractId || noValidMerchantContractExists || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  处理中...
                </>
              ) : isPlatform ? '创建进件' : '下一步'}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSave} disabled={!selectedSubjectId || missingPlatformPrerequisite || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  处理中...
                </>
              ) : '创建进件'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OnboardingTypeCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border-2 p-4 transition-all duration-150 flex items-start gap-3',
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className={cn('mt-0.5 flex-shrink-0', selected ? 'text-blue-600' : 'text-gray-400')}>
        {icon}
      </div>
      <div>
        <div className={cn('text-sm font-semibold', selected ? 'text-blue-900' : 'text-gray-800')}>
          {title}
        </div>
        <div className={cn('text-xs mt-0.5', selected ? 'text-blue-700' : 'text-gray-500')}>
          {description}
        </div>
      </div>
    </button>
  );
}

function StepIndicator({ step, current, label, total }: { step: number; current: number; label: string; total: number }) {
  const active = step === current;
  const done = step < current;
  if (step > total) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
          active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
        )}
      >
        {step}
      </div>
      <span className={cn('text-sm', active ? 'font-medium text-gray-900' : 'text-gray-400')}>
        {label}
      </span>
    </div>
  );
}

function ContractDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}
