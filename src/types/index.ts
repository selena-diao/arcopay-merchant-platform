export type Region = string;
export type KybStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MoontonEntity {
  id: string;
  name: string;
  full_legal_name: string;
  region: Region | null;
  created_at: string;
  is_display_only?: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  category?: string;
  created_at: string;
}

export interface MerchantEntity {
  id: string;
  merchant_id: string;
  name: string;
  full_legal_name: string;
  region: Region;
  created_at: string;
}

export interface KYBRecordBase {
  id: string;
  channel_id: string;
  status: KybStatus;
  submitted_at: string;
  reviewed_at: string | null;
  notes: string | null;
}

export interface MoontonKYBRecord extends KYBRecordBase {
  moonton_entity_id: string;
}

export interface MerchantKYBRecord extends KYBRecordBase {
  merchant_entity_id: string;
}

export type MerchantMode = 'MOR' | 'SOR';

export type ChannelStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ChannelContractStatus = 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'VOIDED';

export interface Channel {
  id: string;
  name: string;
  display_name: string;
  merchant_mode: MerchantMode;
  success_rate: number;
  status: ChannelStatus;
  created_at: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface Currency {
  code: string;
  name: string;
}

export interface ChannelPaymentMethod {
  id: string;
  channel_id: string;
  payment_method_id: string;
}

export interface ChannelPaymentMethodCountry {
  id: string;
  channel_payment_method_id: string;
  country_code: string;
}

export interface ChannelPaymentMethodCurrency {
  id: string;
  channel_payment_method_id: string;
  currency_code: string;
}

export type ContractPaymentMethodStatus = 'ACTIVE' | 'INACTIVE';

export interface ContractPaymentMethod {
  id: string;
  merchant_contract_id: string;
  payment_method_id: string;
  quoted_rate: number;
  status: ContractPaymentMethodStatus;
}

export interface ChannelContract {
  id: string;
  moonton_entity_id: string;
  channel_id: string;
  merchant_mode: MerchantMode;
  channel_rate: number;
  settlement_cycle: number;
  currency: string;
  status: ChannelContractStatus;
  signed_at: string;
  termination_reason?: string;
  void_reason?: string;
}

export type OnboardingStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'VOIDED' | 'SUSPENDED';

export interface Onboarding {
  id: string;
  channel_contract_id: string;
  moonton_entity_id: string | null;
  merchant_entity_id: string | null;
  status: OnboardingStatus;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  merchant_account_id: string | null;
  prerequisite_onboarding_id: string | null;
}

export type MerchantAccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface MerchantAccount {
  id: string;
  channel_id: string;
  channel_contract_id: string;
  onboarding_id: string;
  api_key: string;
  secret_key: string;
  mode: 'LIVE' | 'SANDBOX';
  status: MerchantAccountStatus;
  created_at: string;
}

export type AppStatus = 'ACTIVE' | 'INACTIVE';

export interface Application {
  id: string;
  merchant_id: string;
  name: string;
  bundle_id: string;
  status: AppStatus;
  created_at: string;
}

export type MerchantContractStatus = 'DRAFT' | 'ACTIVE' | 'TERMINATED' | 'VOIDED';

export interface MerchantContract {
  id: string;
  moonton_entity_id: string;
  merchant_id: string;
  quoted_rate: number;
  settlement_cycle: number;
  currency: string;
  status: MerchantContractStatus;
  signed_at: string;
  terminated_reason?: string;
  void_reason?: string;
}

export type PaymentMethodType = 'DIGITAL_WALLET' | 'CARD' | 'PREPAID' | 'BANK_TRANSFER' | 'BNPL' | 'CRYPTO';
export type PaymentMethodStatus = 'ACTIVE' | 'INACTIVE';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  status: PaymentMethodStatus;
}

export type SettlementAccountStatus = 'ACTIVE' | 'INACTIVE';

export interface SettlementAccount {
  id: string;
  merchant_id: string;
  account_name: string;
  bank_info: string;
  status: SettlementAccountStatus;
}

export type AppPaymentConfigStatus = 'ACTIVE' | 'INACTIVE';

export interface AppPaymentConfig {
  id: string;
  app_id: string;
  merchant_contract_id: string | null;
  payment_method_id: string;
  settlement_account_id: string;
  quoted_rate: number;
  status: AppPaymentConfigStatus;
}

export type SettlementRecordStatus = 'PENDING' | 'IN_RECONCILIATION' | 'SETTLED' | 'DISPUTED';

export interface DisputeHistoryEntry {
  time: string;
  operator: string;
  note?: string;
  reason?: string;
  claimed_amount?: number;
  action?: string;
}

export interface ChannelSettlementRecord {
  id: string;
  channel_contract_id: string;
  channel_id: string;
  period_start: string;
  period_end: string;
  expected_amount: number;
  actual_amount: number | null;
  currency: string;
  status: SettlementRecordStatus;
  settled_at: string | null;
  notes: string | null;
  dispute_history: DisputeHistoryEntry[];
  created_at?: string;
  updated_at?: string;
}

export interface MerchantSettlementRecord {
  id: string;
  merchant_contract_id: string;
  merchant_id: string;
  settlement_account_id: string;
  period_start: string;
  period_end: string;
  expected_amount: number;
  actual_amount: number | null;
  currency: string;
  status: SettlementRecordStatus;
  settled_at: string | null;
  notes: string | null;
  dispute_history: DisputeHistoryEntry[];
  created_at?: string;
  updated_at?: string;
}

export type RoutingRuleStatus = 'ACTIVE' | 'INACTIVE';

export interface RoutingRule {
  id: string;
  payment_method_id: string;
  channel_id: string;
  priority: number;
  weight: number;
  status: RoutingRuleStatus;
}

export interface RoutingRuleCountry {
  id: string;
  routing_rule_id: string;
  country_code: string;
}

export type RoutingStrategyType = 'MANUAL' | 'SMART';

export interface RoutingStrategy {
  id: string;
  payment_method_id: string;
  type: RoutingStrategyType;
  description: string;
}

export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Transaction {
  id: string;
  merchant_account_id: string;
  payment_method_id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  channel_rate: number;
  quoted_rate: number;
  created_at: string;
  channel_name?: string;
  payment_method_name?: string;
}

export type NavPage = 'dashboard' | 'moonton-entity' | 'merchant' | 'channel' | 'channel-contracts' | 'merchant-contracts' | 'onboarding' | 'merchant-accounts' | 'payment-methods' | 'app-payment-configs' | 'routing-rules' | 'routing-strategies' | 'margin-report' | 'transaction-ledger' | 'channel-settlement' | 'merchant-settlement' | 'platform-countries' | 'platform-currencies';
