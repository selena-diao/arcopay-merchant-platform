import { useState } from 'react';
import {
  Channel,
  ChannelContract,
  ChannelPaymentMethod,
  ChannelPaymentMethodCountry,
  MoontonEntity,
  MoontonKYBRecord,
  MerchantKYBRecord,
  PaymentMethod,
} from '../../types';
import { ChannelStatusBadge, ChannelContractStatusBadge } from './ChannelStatusBadge';
import { MerchantModeBadge } from './MerchantModeBadge';
import { KybStatusBadge } from '../shared/KybStatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  ArrowLeft,
  Radio,
  FileText,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  Ban,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChannelDetailPageProps {
  channel: Channel;
  allContracts: ChannelContract[];
  moontonEntities: MoontonEntity[];
  moontonKybRecords: MoontonKYBRecord[];
  merchantKybRecords: MerchantKYBRecord[];
  channelPaymentMethods: ChannelPaymentMethod[];
  channelPaymentMethodCountries: ChannelPaymentMethodCountry[];
  paymentMethods: PaymentMethod[];
  onBack: () => void;
  onNavigateToContracts: (channelId: string) => void;
  onNavigateToPaymentMethods: () => void;
}

export function ChannelDetailPage({
  channel,
  allContracts,
  moontonEntities,
  moontonKybRecords,
  merchantKybRecords,
  channelPaymentMethods,
  channelPaymentMethodCountries,
  paymentMethods,
  onBack,
  onNavigateToContracts,
  onNavigateToPaymentMethods,
}: ChannelDetailPageProps) {
  const contracts = allContracts.filter((c) => c.channel_id === channel.id);
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE');
  const historicalContracts = contracts.filter((c) => c.status !== 'ACTIVE');

  const [historyOpen, setHistoryOpen] = useState(false);

  const getMoontonEntityName = (id: string) =>
    moontonEntities.find((e) => e.id === id)?.name ?? id;

  const moontonKybs = moontonKybRecords.filter((r) => r.channel_id === channel.id);
  const merchantKybs = merchantKybRecords.filter((r) => r.channel_id === channel.id);
  const totalKybs = moontonKybs.length + merchantKybs.length;

  const channelPms = channelPaymentMethods.filter((cpm) => cpm.channel_id === channel.id);

  const pct = (channel.success_rate * 100).toFixed(1);
  const rateColor =
    channel.success_rate >= 0.98
      ? 'text-emerald-600'
      : channel.success_rate >= 0.95
      ? 'text-amber-600'
      : 'text-red-500';

  const getPaymentMethodName = (pmId: string) =>
    paymentMethods.find((pm) => pm.id === pmId)?.name ?? pmId;

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回渠道列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Radio className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900">{channel.display_name}</h1>
                <MerchantModeBadge mode={channel.merchant_mode} />
                <ChannelStatusBadge status={channel.status} />
              </div>
              <p className="text-sm text-gray-400 font-mono mt-0.5">{channel.name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold tabular-nums ${rateColor}`}>{pct}%</div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 justify-end">
              <TrendingUp className="w-3.5 h-3.5" />
              交易成功率
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 ml-16">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            {activeContracts.length} 份有效合同
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {totalKybs} 条 KYB 记录
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            {channelPms.length} 种支付方式
          </span>
          <span className="text-gray-400">创建于 {channel.created_at}</span>
        </div>
      </div>

      <Tabs defaultValue="contracts">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="contracts" className="text-sm px-4">
              渠道合同
            </TabsTrigger>
            <TabsTrigger value="payment-methods" className="text-sm px-4">
              支持的支付方式
            </TabsTrigger>
            <TabsTrigger value="kyb" className="text-sm px-4">
              KYB 记录汇总
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contracts" className="mt-0 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {activeContracts.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                text="暂无有效合同"
                hint="点击「新增合同」添加渠道合同"
              />
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
                      entityName={getMoontonEntityName(contract.moonton_entity_id)}
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
                  <span className="text-xs text-gray-400 font-normal">
                    ({historicalContracts.length} 条)
                  </span>
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
                          entityName={getMoontonEntityName(contract.moonton_entity_id)}
                          historical
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onNavigateToContracts(channel.id)}
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              前往渠道合同管理
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {channelPms.length === 0 ? (
              <EmptyState
                icon={<CreditCard />}
                text="暂无支付方式配置"
                hint="前往支付方式管理维护"
                onNavigate={onNavigateToPaymentMethods}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700 w-40">支付方式</TableHead>
                    <TableHead className="font-semibold text-gray-700">支持国家</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channelPms.map((cpm) => (
                    <TableRow key={cpm.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {getPaymentMethodName(cpm.payment_method_id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {channelPaymentMethodCountries
                            .filter((c) => c.channel_payment_method_id === cpm.id)
                            .map((c) => (
                              <span
                                key={c.country_code}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200"
                              >
                                {c.country_code}
                              </span>
                            ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onNavigateToPaymentMethods}
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              前往支付方式管理维护
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </TabsContent>

        <TabsContent value="kyb" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {totalKybs === 0 ? (
              <EmptyState icon={<ShieldCheck />} text="暂无 KYB 记录" hint="该渠道尚未有任何 KYB 记录" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700 w-28">主体类型</TableHead>
                    <TableHead className="font-semibold text-gray-700">主体名称</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">审核状态</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28">提交日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moontonKybs.map((r) => {
                    const entity = moontonEntities.find((e) => e.id === r.moonton_entity_id);
                    return (
                      <TableRow key={r.id} className="hover:bg-gray-50/70 transition-colors">
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-200">
                            平台主体
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {entity?.name ?? r.moonton_entity_id}
                        </TableCell>
                        <TableCell>
                          <KybStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">{r.submitted_at}</TableCell>
                      </TableRow>
                    );
                  })}
                  {merchantKybs.map((r) => (
                    <TableRow key={r.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset bg-slate-100 text-slate-700 ring-slate-200">
                          游戏方主体
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {r.merchant_entity_id}
                      </TableCell>
                      <TableCell>
                        <KybStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{r.submitted_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}

function ContractTableHeader({ historical }: { historical?: boolean }) {
  return (
    <TableRow className={cn('hover:bg-gray-50/60', historical ? 'bg-gray-50/40' : 'bg-gray-50/60')}>
      <TableHead className="font-semibold text-gray-700 w-36">平台主体</TableHead>
      <TableHead className="font-semibold text-gray-700 w-32">商户模式</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">费率</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">结算周期</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">状态</TableHead>
      <TableHead className="font-semibold text-gray-700 w-28">签署日期</TableHead>
      {historical && <TableHead className="font-semibold text-gray-700">作废原因</TableHead>}
    </TableRow>
  );
}

interface ContractRowProps {
  contract: ChannelContract;
  entityName: string;
  historical?: boolean;
}

function ContractRow({ contract, entityName, historical }: ContractRowProps) {
  return (
    <TableRow className={cn('transition-colors', historical ? 'hover:bg-gray-50/50 opacity-75' : 'hover:bg-gray-50/70')}>
      <TableCell className="font-medium text-gray-900">{entityName}</TableCell>
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
        <TableCell className="text-gray-400 text-xs max-w-48 truncate" title={contract.termination_reason}>
          {contract.termination_reason ?? '—'}
        </TableCell>
      )}
    </TableRow>
  );
}

function EmptyState({
  icon,
  text,
  hint,
  onNavigate,
}: {
  icon: React.ReactNode;
  text: string;
  hint: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-gray-400">
      <div className="opacity-20 mb-3 [&>svg]:w-10 [&>svg]:h-10">{icon}</div>
      <p className="text-sm font-medium">{text}</p>
      {onNavigate ? (
        <button
          onClick={onNavigate}
          className="text-xs mt-1.5 text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors"
        >
          {hint}
          <ArrowRight className="w-3 h-3" />
        </button>
      ) : (
        <p className="text-xs mt-1">{hint}</p>
      )}
    </div>
  );
}
