import { useState, useEffect, useCallback } from 'react';
import {
  fetchMerchantAccounts as fetchMerchantAccountsFromDB,
  fetchOnboardings as fetchOnboardingsFromDB,
  fetchChannelContracts as fetchChannelContractsFromDB,
  fetchMerchantContracts as fetchMerchantContractsFromDB,
  fetchContractPaymentMethods as fetchContractPaymentMethodsFromDB,
} from './lib/contractService';
import {
  fetchMoontonEntities as fetchMoontonEntitiesFromDB,
  fetchMoontonKybRecords as fetchMoontonKybRecordsFromDB,
} from './lib/moontonService';
import {
  fetchMerchants as fetchMerchantsFromDB,
  fetchMerchantEntities as fetchMerchantEntitiesFromDB,
  fetchApplications as fetchApplicationsFromDB,
  fetchMerchantKybRecords as fetchMerchantKybRecordsFromDB,
} from './lib/merchantService';
import {
  fetchChannels as fetchChannelsFromDB,
  fetchChannelPaymentMethods as fetchChannelPaymentMethodsFromDB,
  fetchChannelPaymentMethodCountries as fetchChannelPaymentMethodCountriesFromDB,
} from './lib/channelService';
import {
  fetchRoutingRules as fetchRoutingRulesFromDB,
  fetchRoutingRuleCountries as fetchRoutingRuleCountriesFromDB,
  fetchRoutingStrategies as fetchRoutingStrategiesFromDB,
  upsertRoutingRule,
  updateRoutingRuleStatus,
  replaceRoutingRuleCountries,
  upsertRoutingStrategy,
} from './lib/routingService';
import {
  fetchPaymentMethods as fetchPaymentMethodsFromDB,
  updatePaymentMethodStatus,
  fetchSettlementAccounts as fetchSettlementAccountsFromDB,
  createSettlementAccount,
  updateSettlementAccount,
  fetchAppPaymentConfigs as fetchAppPaymentConfigsFromDB,
  createAppPaymentConfig,
  updateAppPaymentConfig,
} from './lib/paymentService';
import {
  NavPage,
  Merchant,
  MerchantEntity,
  Application,
  MoontonEntity,
  MoontonKYBRecord,
  MerchantKYBRecord,
  Channel,
  ChannelPaymentMethod,
  ChannelPaymentMethodCountry,
  ChannelContract,
  MerchantContract,
  ContractPaymentMethod,
  Onboarding,
  MerchantAccount,
  PaymentMethod,
  SettlementAccount,
  AppPaymentConfig,
  RoutingRule,
  RoutingRuleCountry,
  RoutingStrategy,
  ChannelSettlementRecord,
  MerchantSettlementRecord,
} from './types';
import { Layout } from './components/layout/Layout';
import { MoontonEntityPage } from './components/moonton/MoontonEntityPage';
import { MoontonEntityDetailPage } from './components/moonton/MoontonEntityDetailPage';
import { MerchantPage } from './components/merchant/MerchantPage';
import { MerchantDetailPage } from './components/merchant/MerchantDetailPage';
import { ChannelPage } from './components/channel/ChannelPage';
import { ChannelDetailPage } from './components/channel/ChannelDetailPage';
import { ChannelContractsPage } from './components/contracts/ChannelContractsPage';
import { ChannelContractDetailPage } from './components/contracts/ChannelContractDetailPage';
import { MerchantContractPage } from './components/contracts/MerchantContractPage';
import { MerchantContractDetailPage } from './components/contracts/MerchantContractDetailPage';
import { OnboardingPage } from './components/onboarding/OnboardingPage';
import { OnboardingDetailPage } from './components/onboarding/OnboardingDetailPage';
import { PaymentMethodPage } from './components/payment/PaymentMethodPage';
import { PaymentMethodDetailPage } from './components/payment/PaymentMethodDetailPage';
import { AppPaymentConfigPage } from './components/payment/AppPaymentConfigPage';
import { RoutingRulePage } from './components/routing/RoutingRulePage';
import { RoutingStrategyPage } from './components/routing/RoutingStrategyPage';
import { MerchantAccountPage } from './components/merchant-account/MerchantAccountPage';
import { MerchantAccountDetailPage } from './components/merchant-account/MerchantAccountDetailPage';
import { MarginReportPage } from './components/finance/MarginReportPage';
import { TransactionLedgerPage } from './components/finance/TransactionLedgerPage';
import { ChannelSettlementPage } from './components/finance/ChannelSettlementPage';
import { ChannelSettlementDetailPage } from './components/finance/ChannelSettlementDetailPage';
import { MerchantSettlementPage } from './components/finance/MerchantSettlementPage';
import { MerchantSettlementDetailPage } from './components/finance/MerchantSettlementDetailPage';
import { CountryPage } from './components/platform/CountryPage';
import { CurrencyPage } from './components/platform/CurrencyPage';
import { DashboardPage } from './components/dashboard/DashboardPage';

type View =
  | { type: 'dashboard' }
  | { type: 'moonton-entity' }
  | { type: 'moonton-entity-detail'; entity: MoontonEntity }
  | { type: 'merchant' }
  | { type: 'merchant-detail'; merchant: Merchant }
  | { type: 'channel' }
  | { type: 'channel-detail'; channel: Channel }
  | { type: 'channel-contracts'; channelFilter?: string }
  | { type: 'channel-contract-detail'; contractId: string }
  | { type: 'merchant-contracts' }
  | { type: 'merchant-contract-detail'; contractId: string }
  | { type: 'onboarding' }
  | { type: 'onboarding-detail'; onboarding: Onboarding }
  | { type: 'merchant-accounts' }
  | { type: 'merchant-account-detail'; account: MerchantAccount }
  | { type: 'payment-methods' }
  | { type: 'payment-method-detail'; paymentMethod: PaymentMethod }
  | { type: 'app-payment-configs' }
  | { type: 'routing-rules'; pmFilter?: string }
  | { type: 'routing-strategies' }
  | { type: 'margin-report' }
  | { type: 'transaction-ledger' }
  | { type: 'channel-settlement' }
  | { type: 'channel-settlement-detail'; record: ChannelSettlementRecord }
  | { type: 'merchant-settlement' }
  | { type: 'merchant-settlement-detail'; record: MerchantSettlementRecord }
  | { type: 'platform-countries' }
  | { type: 'platform-currencies' };

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' });
  const [moontonEntities, setMoontonEntities] = useState<MoontonEntity[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantEntities, setMerchantEntities] = useState<MerchantEntity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [moontonKybRecords, setMoontonKybRecords] = useState<MoontonKYBRecord[]>([]);
  const [merchantKybRecords, setMerchantKybRecords] = useState<MerchantKYBRecord[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelPaymentMethods, setChannelPaymentMethods] = useState<ChannelPaymentMethod[]>([]);
  const [channelPaymentMethodCountries, setChannelPaymentMethodCountries] = useState<ChannelPaymentMethodCountry[]>([]);
  const [contractPaymentMethods, setContractPaymentMethods] = useState<ContractPaymentMethod[]>([]);
  const [channelContracts, setChannelContracts] = useState<ChannelContract[]>([]);
  const [merchantContracts, setMerchantContracts] = useState<MerchantContract[]>([]);
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [merchantAccounts, setMerchantAccounts] = useState<MerchantAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccount[]>([]);
  const [appPaymentConfigs, setAppPaymentConfigs] = useState<AppPaymentConfig[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [routingRuleCountries, setRoutingRuleCountries] = useState<RoutingRuleCountry[]>([]);
  const [routingStrategies, setRoutingStrategies] = useState<RoutingStrategy[]>([]);

  const fetchChannelContracts = useCallback(async () => {
    const data = await fetchChannelContractsFromDB().catch(() => null);
    if (data) setChannelContracts(data);
  }, []);

  const fetchMerchantContracts = useCallback(async () => {
    const data = await fetchMerchantContractsFromDB().catch(() => null);
    if (data) setMerchantContracts(data);
  }, []);

  const fetchContractPaymentMethods = useCallback(async () => {
    const data = await fetchContractPaymentMethodsFromDB().catch(() => null);
    if (data) setContractPaymentMethods(data);
  }, []);

  const fetchMerchants = useCallback(async () => {
    const data = await fetchMerchantsFromDB().catch(() => null);
    if (data) setMerchants(data);
  }, []);

  const fetchMerchantEntities = useCallback(async () => {
    const data = await fetchMerchantEntitiesFromDB().catch(() => null);
    if (data) setMerchantEntities(data);
  }, []);

  const fetchApplications = useCallback(async () => {
    const data = await fetchApplicationsFromDB().catch(() => null);
    if (data) setApplications(data);
  }, []);

  const fetchMerchantKybRecords = useCallback(async () => {
    const data = await fetchMerchantKybRecordsFromDB().catch(() => null);
    if (data) setMerchantKybRecords(data);
  }, []);

  const fetchMerchantAccounts = useCallback(async () => {
    const data = await fetchMerchantAccountsFromDB().catch(() => null);
    if (data) {
      setMerchantAccounts(data);
    }
  }, []);

  const fetchOnboardings = useCallback(async () => {
    const data = await fetchOnboardingsFromDB().catch(() => null);
    if (data) {
      setOnboardings(data);
    }
  }, []);

  const fetchMoontonEntities = useCallback(async () => {
    const data = await fetchMoontonEntitiesFromDB().catch(() => null);
    if (data) setMoontonEntities(data);
  }, []);

  const fetchMoontonKybRecords = useCallback(async () => {
    const data = await fetchMoontonKybRecordsFromDB().catch(() => null);
    if (data) setMoontonKybRecords(data);
  }, []);

  const fetchChannels = useCallback(async () => {
    const data = await fetchChannelsFromDB().catch(() => null);
    if (data) setChannels(data);
  }, []);

  const fetchChannelPaymentMethods = useCallback(async () => {
    const data = await fetchChannelPaymentMethodsFromDB().catch(() => null);
    if (data) setChannelPaymentMethods(data);
  }, []);

  const fetchChannelPaymentMethodCountries = useCallback(async () => {
    const data = await fetchChannelPaymentMethodCountriesFromDB().catch(() => null);
    if (data) setChannelPaymentMethodCountries(data);
  }, []);

  const fetchRoutingRules = useCallback(async () => {
    const data = await fetchRoutingRulesFromDB().catch(() => null);
    if (data) setRoutingRules(data);
  }, []);

  const fetchRoutingRuleCountries = useCallback(async () => {
    const data = await fetchRoutingRuleCountriesFromDB().catch(() => null);
    if (data) setRoutingRuleCountries(data);
  }, []);

  const fetchRoutingStrategies = useCallback(async () => {
    const data = await fetchRoutingStrategiesFromDB().catch(() => null);
    if (data) setRoutingStrategies(data);
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    const data = await fetchPaymentMethodsFromDB().catch(() => null);
    if (data) setPaymentMethods(data);
  }, []);

  const fetchSettlementAccounts = useCallback(async () => {
    const data = await fetchSettlementAccountsFromDB().catch(() => null);
    if (data) setSettlementAccounts(data);
  }, []);

  const fetchAppPaymentConfigs = useCallback(async () => {
    const data = await fetchAppPaymentConfigsFromDB().catch(() => null);
    if (data) setAppPaymentConfigs(data);
  }, []);

  const handlePaymentMethodStatusChange = useCallback(async (id: string, status: PaymentMethod['status']) => {
    setPaymentMethods((prev) => prev.map((pm) => pm.id === id ? { ...pm, status } : pm));
    try {
      await updatePaymentMethodStatus(id, status);
      await fetchPaymentMethods();
    } catch {
      await fetchPaymentMethods();
    }
  }, [fetchPaymentMethods]);

  const handleSettlementAccountSave = useCallback(async (
    data: Omit<SettlementAccount, 'id' | 'merchant_id'>,
    merchantId: string,
    existingId?: string
  ) => {
    try {
      if (existingId) {
        await updateSettlementAccount(existingId, data);
      } else {
        await createSettlementAccount({ ...data, merchant_id: merchantId });
      }
      await fetchSettlementAccounts();
    } catch {
      await fetchSettlementAccounts();
    }
  }, [fetchSettlementAccounts]);

  const handleAppPaymentConfigSave = useCallback(async (
    data: Omit<AppPaymentConfig, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      await updateAppPaymentConfig(existingId, data);
    } else {
      await createAppPaymentConfig(data);
    }
    await fetchAppPaymentConfigs();
  }, [fetchAppPaymentConfigs]);

  const handleAppPaymentConfigToggle = useCallback(async (config: AppPaymentConfig) => {
    const newStatus = config.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setAppPaymentConfigs((prev) => prev.map((c) => c.id === config.id ? { ...c, status: newStatus } : c));
    try {
      await updateAppPaymentConfig(config.id, { status: newStatus });
      await fetchAppPaymentConfigs();
    } catch {
      await fetchAppPaymentConfigs();
    }
  }, [fetchAppPaymentConfigs]);

  const handleRoutingRulesChange = useCallback(async (
    rules: RoutingRule[],
    countries: RoutingRuleCountry[],
    changedRuleId?: string,
    newCountryCodes?: string[] | null,
    statusChange?: { id: string; status: RoutingRule['status'] }
  ) => {
    setRoutingRules(rules);
    setRoutingRuleCountries(countries);
    try {
      if (statusChange) {
        await updateRoutingRuleStatus(statusChange.id, statusChange.status);
      } else if (changedRuleId) {
        const rule = rules.find((r) => r.id === changedRuleId);
        if (rule) {
          await upsertRoutingRule(rule);
          await replaceRoutingRuleCountries(changedRuleId, newCountryCodes ?? []);
        }
      }
      await Promise.all([fetchRoutingRules(), fetchRoutingRuleCountries()]);
    } catch {
      // ignore
    }
  }, [fetchRoutingRules, fetchRoutingRuleCountries]);

  const handleRoutingStrategiesChange = useCallback(async (
    strategies: RoutingStrategy[],
    changedStrategy?: RoutingStrategy
  ) => {
    setRoutingStrategies(strategies);
    try {
      if (changedStrategy) {
        await upsertRoutingStrategy(changedStrategy);
      }
      await fetchRoutingStrategies();
    } catch {
      // ignore
    }
  }, [fetchRoutingStrategies]);

  useEffect(() => {
    fetchMerchantAccounts();
    fetchOnboardings();
    fetchMoontonEntities();
    fetchMoontonKybRecords();
    fetchMerchants();
    fetchMerchantEntities();
    fetchApplications();
    fetchMerchantKybRecords();
    fetchChannels();
    fetchChannelPaymentMethods();
    fetchChannelPaymentMethodCountries();
    fetchChannelContracts();
    fetchMerchantContracts();
    fetchContractPaymentMethods();
    fetchRoutingRules();
    fetchRoutingRuleCountries();
    fetchRoutingStrategies();
    fetchPaymentMethods();
    fetchSettlementAccounts();
    fetchAppPaymentConfigs();
  }, [fetchMerchantAccounts, fetchOnboardings, fetchMoontonEntities, fetchMoontonKybRecords, fetchMerchants, fetchMerchantEntities, fetchApplications, fetchMerchantKybRecords, fetchChannels, fetchChannelPaymentMethods, fetchChannelPaymentMethodCountries, fetchChannelContracts, fetchMerchantContracts, fetchContractPaymentMethods, fetchRoutingRules, fetchRoutingRuleCountries, fetchRoutingStrategies, fetchPaymentMethods, fetchSettlementAccounts, fetchAppPaymentConfigs]);

  const currentPage: NavPage =
    view.type === 'dashboard'
      ? 'dashboard'
      : view.type === 'merchant' || view.type === 'merchant-detail'
      ? 'merchant'
      : view.type === 'channel' || view.type === 'channel-detail'
      ? 'channel'
      : view.type === 'channel-contracts' || view.type === 'channel-contract-detail'
      ? 'channel-contracts'
      : view.type === 'merchant-contracts' || view.type === 'merchant-contract-detail'
      ? 'merchant-contracts'
      : view.type === 'onboarding' || view.type === 'onboarding-detail'
      ? 'onboarding'
      : view.type === 'merchant-accounts' || view.type === 'merchant-account-detail'
      ? 'merchant-accounts'
      : view.type === 'payment-methods' || view.type === 'payment-method-detail'
      ? 'payment-methods'
      : view.type === 'app-payment-configs'
      ? 'app-payment-configs'
      : view.type === 'routing-rules'
      ? 'routing-rules'
      : view.type === 'routing-strategies'
      ? 'routing-strategies'
      : view.type === 'margin-report'
      ? 'margin-report'
      : view.type === 'transaction-ledger'
      ? 'transaction-ledger'
      : view.type === 'channel-settlement' || view.type === 'channel-settlement-detail'
      ? 'channel-settlement'
      : view.type === 'merchant-settlement' || view.type === 'merchant-settlement-detail'
      ? 'merchant-settlement'
      : view.type === 'platform-countries'
      ? 'platform-countries'
      : view.type === 'platform-currencies'
      ? 'platform-currencies'
      : 'moonton-entity';

  const handleNavigate = (page: NavPage) => {
    setView({ type: page } as View);
  };

  const handleMerchantsRefresh = () => {
    fetchMerchants();
  };

  const handleChannelsRefresh = useCallback(async (deletedId?: string) => {
    await fetchChannels();
    if (
      deletedId &&
      view.type === 'channel-detail' &&
      (view as { type: 'channel-detail'; channel: Channel }).channel.id === deletedId
    ) {
      setView({ type: 'channel' });
    }
  }, [fetchChannels, view]);

  const handleOnboardingChange = (updated: Onboarding) => {
    setOnboardings((prev) => prev.map((ob) => (ob.id === updated.id ? updated : ob)));
    if (view.type === 'onboarding-detail') {
      setView({ type: 'onboarding-detail', onboarding: updated });
    }
  };

  const handleChannelContractsChange = (updated: ChannelContract[]) => {
    setChannelContracts(updated);
  };

  const handleMerchantContractsChange = (updated: MerchantContract[]) => {
    setMerchantContracts(updated);
  };

  const liveChannelContract =
    view.type === 'channel-contract-detail'
      ? channelContracts.find((c) => c.id === view.contractId) ?? null
      : null;

  const liveMerchantContract =
    view.type === 'merchant-contract-detail'
      ? merchantContracts.find((c) => c.id === view.contractId) ?? null
      : null;

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {view.type === 'dashboard' && (
        <DashboardPage onNavigate={handleNavigate} />
      )}
      {view.type === 'moonton-entity' && (
        <MoontonEntityPage
          entities={moontonEntities}
          moontonKybRecords={moontonKybRecords}
          onRefresh={fetchMoontonEntities}
          onDrillDown={(entity) => setView({ type: 'moonton-entity-detail', entity })}
        />
      )}
      {view.type === 'moonton-entity-detail' && (
        <MoontonEntityDetailPage
          entity={view.entity}
          moontonKybRecords={moontonKybRecords}
          channels={channels}
          onRefreshKybRecords={fetchMoontonKybRecords}
          onBack={() => setView({ type: 'moonton-entity' })}
        />
      )}
      {view.type === 'merchant' && (
        <MerchantPage
          merchants={merchants}
          merchantEntities={merchantEntities}
          onRefresh={handleMerchantsRefresh}
          onDrillDown={(merchant) => setView({ type: 'merchant-detail', merchant })}
        />
      )}
      {view.type === 'merchant-detail' && (
        <MerchantDetailPage
          merchant={view.merchant}
          allEntities={merchantEntities}
          allApplications={applications}
          merchantKybRecords={merchantKybRecords}
          channels={channels}
          settlementAccounts={settlementAccounts}
          appPaymentConfigs={appPaymentConfigs}
          paymentMethods={paymentMethods}
          allMerchants={merchants}
          merchantContracts={merchantContracts}
          contractPaymentMethods={contractPaymentMethods}
          onRefreshEntities={fetchMerchantEntities}
          onRefreshApplications={fetchApplications}
          onRefreshMerchantKybRecords={fetchMerchantKybRecords}
          onSettlementAccountSave={handleSettlementAccountSave}
          onAppPaymentConfigSave={handleAppPaymentConfigSave}
          onAppPaymentConfigToggle={handleAppPaymentConfigToggle}
          onNavigateToAppPaymentConfigs={() => setView({ type: 'app-payment-configs' })}
          onBack={() => setView({ type: 'merchant' })}
        />
      )}
      {view.type === 'channel' && (
        <ChannelPage
          channels={channels}
          onRefresh={handleChannelsRefresh}
          onDrillDown={(channel) => setView({ type: 'channel-detail', channel })}
        />
      )}
      {view.type === 'channel-detail' && (
        <ChannelDetailPage
          channel={view.channel}
          allContracts={channelContracts}
          moontonEntities={moontonEntities}
          moontonKybRecords={moontonKybRecords}
          merchantKybRecords={merchantKybRecords}
          channelPaymentMethods={channelPaymentMethods}
          channelPaymentMethodCountries={channelPaymentMethodCountries}
          paymentMethods={paymentMethods}
          onBack={() => setView({ type: 'channel' })}
          onNavigateToContracts={(channelId) =>
            setView({ type: 'channel-contracts', channelFilter: channelId })
          }
          onNavigateToPaymentMethods={() => setView({ type: 'payment-methods' })}
        />
      )}
      {view.type === 'channel-contracts' && (
        <ChannelContractsPage
          contracts={channelContracts}
          channels={channels}
          moontonEntities={moontonEntities}
          onRefresh={fetchChannelContracts}
          onDrillDown={(contract) => setView({ type: 'channel-contract-detail', contractId: contract.id })}
          initialChannelFilter={view.channelFilter}
        />
      )}
      {view.type === 'channel-contract-detail' && liveChannelContract && (
        <ChannelContractDetailPage
          contract={liveChannelContract}
          allContracts={channelContracts}
          channels={channels}
          moontonEntities={moontonEntities}
          onboardings={onboardings}
          merchantEntities={merchantEntities}
          onContractsChange={handleChannelContractsChange}
          onOnboardingsChange={setOnboardings}
          onMerchantAccountsChange={setMerchantAccounts}
          onBack={() => setView({ type: 'channel-contracts' })}
          onViewOnboarding={(ob) => setView({ type: 'onboarding-detail', onboarding: ob })}
        />
      )}
      {view.type === 'merchant-contracts' && (
        <MerchantContractPage
          contracts={merchantContracts}
          channelContracts={channelContracts}
          moontonEntities={moontonEntities}
          merchants={merchants}
          onRefresh={fetchMerchantContracts}
          onDrillDown={(contract) => setView({ type: 'merchant-contract-detail', contractId: contract.id })}
        />
      )}
      {view.type === 'merchant-contract-detail' && liveMerchantContract && (
        <MerchantContractDetailPage
          contract={liveMerchantContract}
          allContracts={merchantContracts}
          merchants={merchants}
          moontonEntities={moontonEntities}
          contractPaymentMethods={contractPaymentMethods}
          paymentMethods={paymentMethods}
          onContractsChange={handleMerchantContractsChange}
          onContractPaymentMethodsChange={setContractPaymentMethods}
          onBack={() => setView({ type: 'merchant-contracts' })}
        />
      )}
      {view.type === 'onboarding' && (
        <OnboardingPage
          onboardings={onboardings}
          channelContracts={channelContracts}
          channels={channels}
          moontonEntities={moontonEntities}
          merchantEntities={merchantEntities}
          merchantContracts={merchantContracts}
          onRefresh={fetchOnboardings}
          onDrillDown={(ob) => setView({ type: 'onboarding-detail', onboarding: ob })}
        />
      )}
      {view.type === 'onboarding-detail' && (
        <OnboardingDetailPage
          onboarding={view.onboarding}
          channelContracts={channelContracts}
          channels={channels}
          moontonEntities={moontonEntities}
          merchantEntities={merchantEntities}
          allMerchantAccounts={merchantAccounts}
          onOnboardingChange={handleOnboardingChange}
          onMerchantAccountCreated={fetchMerchantAccounts}
          onBack={() => setView({ type: 'onboarding' })}
        />
      )}
      {view.type === 'merchant-accounts' && (
        <MerchantAccountPage
          merchantAccounts={merchantAccounts}
          channels={channels}
          channelContracts={channelContracts}
          onboardings={onboardings}
          onDrillDown={(account) => setView({ type: 'merchant-account-detail', account })}
          onViewContract={(contract) => setView({ type: 'channel-contract-detail', contractId: contract.id })}
          onViewOnboarding={(ob) => setView({ type: 'onboarding-detail', onboarding: ob })}
        />
      )}
      {view.type === 'merchant-account-detail' && (
        <MerchantAccountDetailPage
          account={view.account}
          channels={channels}
          channelContracts={channelContracts}
          onboardings={onboardings}
          onBack={() => setView({ type: 'merchant-accounts' })}
          onViewContract={(contract) => setView({ type: 'channel-contract-detail', contractId: contract.id })}
          onViewOnboarding={(ob) => setView({ type: 'onboarding-detail', onboarding: ob })}
        />
      )}
      {view.type === 'payment-methods' && (
        <PaymentMethodPage
          paymentMethods={paymentMethods}
          onPaymentMethodStatusChange={handlePaymentMethodStatusChange}
          onDrillDown={(pm) => setView({ type: 'payment-method-detail', paymentMethod: pm })}
        />
      )}
      {view.type === 'payment-method-detail' && (
        <PaymentMethodDetailPage
          paymentMethod={view.paymentMethod}
          channels={channels}
          channelPaymentMethods={channelPaymentMethods}
          channelPaymentMethodCountries={channelPaymentMethodCountries}
          onChannelPaymentMethodsChange={(methods, countries) => {
            setChannelPaymentMethods(methods);
            setChannelPaymentMethodCountries(countries);
          }}
          onBack={() => setView({ type: 'payment-methods' })}
        />
      )}
      {view.type === 'app-payment-configs' && (
        <AppPaymentConfigPage
          configs={appPaymentConfigs}
          paymentMethods={paymentMethods}
          settlementAccounts={settlementAccounts}
          applications={applications}
          merchants={merchants}
          merchantContracts={merchantContracts}
          contractPaymentMethods={contractPaymentMethods}
          onSaveConfig={handleAppPaymentConfigSave}
          onToggleConfig={handleAppPaymentConfigToggle}
        />
      )}
      {view.type === 'routing-rules' && (
        <RoutingRulePage
          rules={routingRules}
          routingRuleCountries={routingRuleCountries}
          paymentMethods={paymentMethods}
          channels={channels}
          channelPaymentMethods={channelPaymentMethods}
          channelPaymentMethodCountries={channelPaymentMethodCountries}
          onRulesChange={handleRoutingRulesChange}
          initialPaymentMethodFilter={view.pmFilter}
        />
      )}
      {view.type === 'routing-strategies' && (
        <RoutingStrategyPage
          strategies={routingStrategies}
          paymentMethods={paymentMethods}
          onStrategiesChange={handleRoutingStrategiesChange}
          onNavigateToRules={(pmId) => setView({ type: 'routing-rules', pmFilter: pmId })}
        />
      )}
      {view.type === 'margin-report' && (
        <MarginReportPage
          channels={channels}
          channelContracts={channelContracts}
          contractPaymentMethods={contractPaymentMethods}
          merchantContracts={merchantContracts}
          paymentMethods={paymentMethods}
          moontonEntities={moontonEntities}
        />
      )}
      {view.type === 'transaction-ledger' && (
        <TransactionLedgerPage
          channels={channels}
          merchants={merchants}
        />
      )}
      {view.type === 'channel-settlement' && (
        <ChannelSettlementPage
          channels={channels}
          channelContracts={channelContracts}
          onDrillDown={(record) => setView({ type: 'channel-settlement-detail', record })}
        />
      )}
      {view.type === 'channel-settlement-detail' && (
        <ChannelSettlementDetailPage
          record={view.record}
          channels={channels}
          channelContracts={channelContracts}
          onBack={() => setView({ type: 'channel-settlement' })}
          onRecordChange={(updated) => setView({ type: 'channel-settlement-detail', record: updated })}
        />
      )}
      {view.type === 'merchant-settlement' && (
        <MerchantSettlementPage
          merchants={merchants}
          merchantContracts={merchantContracts}
          settlementAccounts={settlementAccounts}
          onDrillDown={(record) => setView({ type: 'merchant-settlement-detail', record })}
        />
      )}
      {view.type === 'merchant-settlement-detail' && (
        <MerchantSettlementDetailPage
          record={view.record}
          merchants={merchants}
          merchantContracts={merchantContracts}
          settlementAccounts={settlementAccounts}
          onBack={() => setView({ type: 'merchant-settlement' })}
          onRecordChange={(updated) => setView({ type: 'merchant-settlement-detail', record: updated })}
        />
      )}
      {view.type === 'platform-countries' && <CountryPage />}
      {view.type === 'platform-currencies' && <CurrencyPage />}
    </Layout>
  );
}

export default App;
