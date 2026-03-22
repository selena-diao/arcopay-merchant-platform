import { NavPage } from '../../types';
import { Building2, Users, ChevronDown, CreditCard, Radio, FileText, Handshake, ClipboardList, Wallet, AppWindow, GitBranch, LayoutList, KeyRound, ChartBar as BarChart3, Landmark, Receipt, Globe, Coins } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const [contractOpen, setContractOpen] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(true);
  const [merchantAccountOpen, setMerchantAccountOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [routingOpen, setRoutingOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [platformOpen, setPlatformOpen] = useState(true);

  return (
    <aside className="w-60 h-screen sticky top-0 bg-slate-900 flex flex-col flex-shrink-0 overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">ArcoPay 管理后台</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <div>
          <button
            onClick={() => setMasterDataOpen(!masterDataOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>主数据管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                masterDataOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {masterDataOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<Building2 className="w-4 h-4" />}
                label="平台主体"
                active={currentPage === 'moonton-entity'}
                onClick={() => onNavigate('moonton-entity')}
              />
              <NavItem
                icon={<Users className="w-4 h-4" />}
                label="商家管理"
                active={currentPage === 'merchant'}
                onClick={() => onNavigate('merchant')}
              />
              <NavItem
                icon={<Radio className="w-4 h-4" />}
                label="渠道管理"
                active={currentPage === 'channel'}
                onClick={() => onNavigate('channel')}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setContractOpen(!contractOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>合同管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                contractOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {contractOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<FileText className="w-4 h-4" />}
                label="渠道合同"
                active={currentPage === 'channel-contracts'}
                onClick={() => onNavigate('channel-contracts')}
              />
              <NavItem
                icon={<Handshake className="w-4 h-4" />}
                label="商户合同"
                active={currentPage === 'merchant-contracts'}
                onClick={() => onNavigate('merchant-contracts')}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setOnboardingOpen(!onboardingOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>进件管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                onboardingOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {onboardingOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<ClipboardList className="w-4 h-4" />}
                label="进件列表"
                active={currentPage === 'onboarding'}
                onClick={() => onNavigate('onboarding')}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setMerchantAccountOpen(!merchantAccountOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>商户号管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                merchantAccountOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {merchantAccountOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<KeyRound className="w-4 h-4" />}
                label="商户号列表"
                active={currentPage === 'merchant-accounts'}
                onClick={() => onNavigate('merchant-accounts')}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setPaymentOpen(!paymentOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>支付配置</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                paymentOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {paymentOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<Wallet className="w-4 h-4" />}
                label="支付方式管理"
                active={currentPage === 'payment-methods'}
                onClick={() => onNavigate('payment-methods')}
              />
              <NavItem
                icon={<AppWindow className="w-4 h-4" />}
                label="应用支付配置"
                active={currentPage === 'app-payment-configs'}
                onClick={() => onNavigate('app-payment-configs')}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setRoutingOpen(!routingOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>路由管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                routingOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {routingOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<GitBranch className="w-4 h-4" />}
                label="路由规则"
                active={currentPage === 'routing-rules'}
                onClick={() => onNavigate('routing-rules')}
              />
              <NavItem
                icon={<LayoutList className="w-4 h-4" />}
                label="路由策略"
                active={currentPage === 'routing-strategies'}
                onClick={() => onNavigate('routing-strategies')}
              />
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={() => setFinanceOpen(!financeOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>资金管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                financeOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {financeOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<BarChart3 className="w-4 h-4" />}
                label="费率差报表"
                active={currentPage === 'margin-report'}
                onClick={() => onNavigate('margin-report')}
              />
              <NavItem
                icon={<Landmark className="w-4 h-4" />}
                label="渠道结算"
                active={currentPage === 'channel-settlement'}
                onClick={() => onNavigate('channel-settlement')}
              />
              <NavItem
                icon={<Receipt className="w-4 h-4" />}
                label="商家结算"
                active={currentPage === 'merchant-settlement'}
                onClick={() => onNavigate('merchant-settlement')}
              />
            </div>
          )}
        </div>
        <div className="pt-2">
          <button
            onClick={() => setPlatformOpen(!platformOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-200 transition-colors"
          >
            <span>平台管理</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform duration-200',
                platformOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {platformOpen && (
            <div className="mt-1 space-y-0.5">
              <NavItem
                icon={<Globe className="w-4 h-4" />}
                label="国家管理"
                active={currentPage === 'platform-countries'}
                onClick={() => onNavigate('platform-countries')}
              />
              <NavItem
                icon={<Coins className="w-4 h-4" />}
                label="币种管理"
                active={currentPage === 'platform-currencies'}
                onClick={() => onNavigate('platform-currencies')}
              />
            </div>
          )}
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/60 bg-slate-900 sticky bottom-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center">
            <span className="text-xs text-slate-200 font-medium">管</span>
          </div>
          <div>
            <p className="text-xs text-slate-200 font-medium">管理员</p>
            <p className="text-xs text-slate-500">admin@arcopay.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
      )}
    >
      <span className={cn(active ? 'text-white' : 'text-slate-500')}>{icon}</span>
      {label}
    </button>
  );
}
