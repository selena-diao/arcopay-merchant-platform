import { useState } from 'react';
import {
  MerchantAccount,
  Channel,
  ChannelContract,
  Onboarding,
} from '../../types';
import { MerchantAccountStatusBadge } from './MerchantAccountStatusBadge';
import { MerchantModeBadge } from '../channel/MerchantModeBadge';
import { ArrowLeft, KeyRound, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MerchantAccountDetailPageProps {
  account: MerchantAccount;
  channels: Channel[];
  channelContracts: ChannelContract[];
  onboardings: Onboarding[];
  onBack: () => void;
  onViewContract: (contract: ChannelContract) => void;
  onViewOnboarding: (onboarding: Onboarding) => void;
}

function maskKey(key: string, showFull: boolean): string {
  if (showFull) return key;
  if (key.length <= 8) return '••••••••';
  return '••••••••' + key.slice(-8);
}

export function MerchantAccountDetailPage({
  account,
  channels,
  channelContracts,
  onboardings,
  onBack,
  onViewContract,
  onViewOnboarding,
}: MerchantAccountDetailPageProps) {
  const [secretVisible, setSecretVisible] = useState(false);

  const channel = channels.find((c) => c.id === account.channel_id);
  const contract = channelContracts.find((c) => c.id === account.channel_contract_id);
  const onboarding = onboardings.find((ob) => ob.id === account.onboarding_id);

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回商户号列表
      </button>

      <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <KeyRound className="w-4 h-4 flex-shrink-0 text-amber-500" />
        商户号由进件审核通过后自动生成，如需变更请重新发起进件
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  {channel?.display_name ?? account.channel_id}
                </h1>
                {contract && <MerchantModeBadge mode={contract.merchant_mode} />}
                <MerchantAccountStatusBadge status={account.status} />
              </div>
              <p className="text-sm text-gray-400 font-mono mt-1">{account.id}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <KeyValueRow
            label="API Key"
            value={maskKey(account.api_key, true)}
            mono
            note="后8位显示"
            maskedValue={'••••••••' + account.api_key.slice(-8)}
          />
          <div>
            <p className="text-xs text-gray-400 mb-1">Secret Key</p>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-mono', secretVisible ? 'text-gray-800' : 'text-gray-500')}>
                {secretVisible ? account.secret_key : '••••••••••••••••••••••••'}
              </span>
              <button
                onClick={() => setSecretVisible((v) => !v)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={secretVisible ? '隐藏' : '查看'}
              >
                {secretVisible ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <KeyValueRow label="创建时间" value={account.created_at} />
          <KeyValueRow label="运行模式" value={account.mode === 'LIVE' ? '生产环境 (LIVE)' : '沙箱环境 (SANDBOX)'} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">关联信息</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 mb-1.5">所属渠道合同</p>
            {contract ? (
              <button
                onClick={() => onViewContract(contract)}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors group"
              >
                <span className="font-mono">{contract.id}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1.5">来源进件</p>
            {onboarding ? (
              <button
                onClick={() => onViewOnboarding(onboarding)}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors group"
              >
                <span className="font-mono">{onboarding.id}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KeyValueRowProps {
  label: string;
  value: string;
  mono?: boolean;
  note?: string;
  maskedValue?: string;
}

function KeyValueRow({ label, value, mono, note, maskedValue }: KeyValueRowProps) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">
        {label}
        {note && <span className="ml-1 text-gray-300">({note})</span>}
      </p>
      <p className={cn('text-sm font-semibold text-gray-800', mono && 'font-mono')}>
        {maskedValue ?? value}
      </p>
    </div>
  );
}
