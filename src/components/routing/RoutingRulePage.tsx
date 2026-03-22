import { useState, useMemo } from 'react';
import { RoutingRule, RoutingRuleCountry, PaymentMethod, Channel, ChannelPaymentMethod, ChannelPaymentMethodCountry } from '../../types';
import { insertRoutingRule } from '../../lib/routingService';
import { RoutingRuleModal } from './RoutingRuleModal';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Plus, Pencil, ToggleLeft, ToggleRight, X, GitBranch, TriangleAlert as AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleSaveError } from '../../lib/errorHandler';

interface RoutingRulePageProps {
  rules: RoutingRule[];
  routingRuleCountries: RoutingRuleCountry[];
  paymentMethods: PaymentMethod[];
  channels: Channel[];
  channelPaymentMethods: ChannelPaymentMethod[];
  channelPaymentMethodCountries: ChannelPaymentMethodCountry[];
  onRulesChange: (
    rules: RoutingRule[],
    countries: RoutingRuleCountry[],
    changedRuleId?: string,
    newCountryCodes?: string[] | null,
    statusChange?: { id: string; status: RoutingRule['status'] }
  ) => void;
  initialPaymentMethodFilter?: string;
}

export function RoutingRulePage({
  rules,
  routingRuleCountries,
  paymentMethods,
  channels,
  channelPaymentMethods,
  channelPaymentMethodCountries,
  onRulesChange,
  initialPaymentMethodFilter,
}: RoutingRulePageProps) {
  const [filterPM, setFilterPM] = useState(initialPaymentMethodFilter ?? 'all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoutingRule | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<RoutingRule | null>(null);

  const getPaymentMethod = (id: string) => paymentMethods.find((pm) => pm.id === id);
  const getChannel = (id: string) => channels.find((c) => c.id === id);

  const getCountriesForRule = (ruleId: string) =>
    routingRuleCountries
      .filter((rc) => rc.routing_rule_id === ruleId)
      .map((rc) => rc.country_code);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (filterPM !== 'all' && r.payment_method_id !== filterPM) return false;
      if (filterChannel !== 'all' && r.channel_id !== filterChannel) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      return true;
    });
  }, [rules, filterPM, filterChannel, filterStatus]);

  const groupedRules = useMemo(() => {
    const pmIds = Array.from(new Set(filteredRules.map((r) => r.payment_method_id)));
    return pmIds.map((pmId) => {
      const pmRules = filteredRules
        .filter((r) => r.payment_method_id === pmId)
        .sort((a, b) => a.priority - b.priority);
      const activeCount = pmRules.filter((r) => r.status === 'ACTIVE').length;

      const priorities = Array.from(new Set(pmRules.map((r) => r.priority)));

      const activeRulesForPm = rules.filter(
        (r) => r.payment_method_id === pmId && r.status === 'ACTIVE'
      );

      const perCountryWarnings = new Map<number, Map<string, { sum: number; count: number }>>();
      for (const p of priorities) {
        const activeAtPriority = activeRulesForPm.filter((r) => r.priority === p);
        const countryMap = new Map<string, { sum: number; count: number }>();

        for (const r of activeAtPriority) {
          const countryCodes = getCountriesForRule(r.id);
          const ruleCountries = countryCodes.length === 0 ? ['__global__'] : countryCodes;
          for (const cc of ruleCountries) {
            const prev = countryMap.get(cc) ?? { sum: 0, count: 0 };
            countryMap.set(cc, { sum: prev.sum + r.weight, count: prev.count + 1 });
          }
        }

        perCountryWarnings.set(p, countryMap);
      }

      const priorityWarnings = new Map<number, boolean>();
      for (const [p, countryMap] of perCountryWarnings) {
        const hasWarn = Array.from(countryMap.values()).some(
          ({ sum, count }) => count >= 2 && Math.abs(sum - 100) > 0.01
        );
        priorityWarnings.set(p, hasWarn);
      }

      const multiRulePriorities = priorities.filter((p) => {
        const countryMap = perCountryWarnings.get(p);
        if (!countryMap) return false;
        return Array.from(countryMap.values()).some(({ count }) => count >= 2);
      });

      return {
        pmId,
        pmRules,
        activeCount,
        priorities,
        priorityWarnings,
        perCountryWarnings,
        multiRulePriorities,
      };
    });
  }, [filteredRules, rules, routingRuleCountries]);

  const hasFilters = filterPM !== 'all' || filterChannel !== 'all' || filterStatus !== 'all';

  const handleSave = async (data: Omit<RoutingRule, 'id'>, countryCodes: string[] | null) => {
    if (editTarget) {
      const updatedRule = { ...editTarget, ...data };
      const updatedRules = rules.map((r) => (r.id === editTarget.id ? updatedRule : r));
      const updatedCountries = [
        ...routingRuleCountries.filter((rc) => rc.routing_rule_id !== editTarget.id),
        ...(countryCodes ?? []).map((code, i) => ({
          id: `rrc-edit-${editTarget.id}-${i}`,
          routing_rule_id: editTarget.id,
          country_code: code,
        })),
      ];
      onRulesChange(updatedRules, updatedCountries, editTarget.id, countryCodes);
    } else {
      try {
        const saved = await insertRoutingRule(data);
        const newCountries: RoutingRuleCountry[] = (countryCodes ?? []).map((code, i) => ({
          id: `rrc-new-${saved.id}-${i}`,
          routing_rule_id: saved.id,
          country_code: code,
        }));
        onRulesChange([...rules, saved], [...routingRuleCountries, ...newCountries], saved.id, countryCodes);
        setModalOpen(false);
        setEditTarget(null);
        return;
      } catch (err) {
        handleSaveError(err);
        return;
      }
    }
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    const updatedRules = rules.map((r) => (r.id === deactivateTarget.id ? { ...r, status: 'INACTIVE' as const } : r));
    onRulesChange(updatedRules, routingRuleCountries, undefined, undefined, { id: deactivateTarget.id, status: 'INACTIVE' });
    setDeactivateTarget(null);
  };

  const handleToggleActive = (rule: RoutingRule) => {
    const updatedRules = rules.map((r) => (r.id === rule.id ? { ...r, status: 'ACTIVE' as const } : r));
    onRulesChange(updatedRules, routingRuleCountries, undefined, undefined, { id: rule.id, status: 'ACTIVE' });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">路由规则</h1>
            <p className="text-sm text-gray-500 mt-0.5">配置支付方式的渠道路由优先级与权重</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          新增路由规则
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <Select value={filterPM} onValueChange={setFilterPM}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部支付方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部支付方式</SelectItem>
            {paymentMethods.map((pm) => (
              <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="全部渠道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部渠道</SelectItem>
            {channels.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-28 h-8 text-sm">
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
            onClick={() => { setFilterPM('all'); setFilterChannel('all'); setFilterStatus('all'); }}
          >
            <X className="w-3.5 h-3.5" />
            清除筛选
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {groupedRules.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm py-16 flex flex-col items-center justify-center text-gray-400">
            <div className="opacity-20 mb-3"><GitBranch className="w-10 h-10" /></div>
            <p className="text-sm font-medium">暂无路由规则</p>
          </div>
        ) : (
          groupedRules.map(({
            pmId,
            pmRules,
            activeCount,
            priorityWarnings,
            perCountryWarnings,
            multiRulePriorities,
          }) => {
            const pm = getPaymentMethod(pmId);
            const hasAnyWarning = multiRulePriorities.some((p) => priorityWarnings.get(p));

            return (
              <div key={pmId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-start gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                    <div className="w-1 h-5 rounded-full bg-blue-500" />
                    <span className="font-semibold text-gray-800">{pm?.name ?? pmId}</span>
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {activeCount}
                    </span>
                  </div>
                  {multiRulePriorities.length > 0 && (
                    <div className="flex items-start gap-x-3 gap-y-1 flex-wrap ml-1">
                      <span className="text-gray-300 text-sm select-none mt-px">|</span>
                      {multiRulePriorities.map((p) => {
                        const countryMap = perCountryWarnings.get(p);
                        if (!countryMap) return null;
                        const entries = Array.from(countryMap.entries())
                          .filter(([, { count }]) => count >= 2)
                          .sort(([a], [b]) => a.localeCompare(b));
                        return entries.map(([cc, { sum }]) => {
                          const imbalanced = Math.abs(sum - 100) > 0.01;
                          const label = cc === '__global__' ? '全球' : cc;
                          return (
                            <span
                              key={`${p}-${cc}`}
                              className={cn(
                                'text-xs font-medium',
                                imbalanced ? 'text-orange-500' : 'text-gray-400'
                              )}
                            >
                              P{p}/{label}: Σ {sum.toFixed(0)}%
                            </span>
                          );
                        });
                      })}
                      {hasAnyWarning && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                          <AlertTriangle className="w-3 h-3" />
                          权重未平衡，请检查
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                      <TableHead className="font-semibold text-gray-700 w-32">渠道</TableHead>
                      <TableHead className="font-semibold text-gray-700">国家</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-24 text-center">优先级</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-40">权重</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-20">状态</TableHead>
                      <TableHead className="font-semibold text-gray-700 w-20 text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pmRules.map((rule) => {
                      const ch = getChannel(rule.channel_id);
                      const countryCodes = getCountriesForRule(rule.id);
                      const isGlobal = countryCodes.length === 0;

                      return (
                        <TableRow key={rule.id} className="hover:bg-gray-50/70 transition-colors">
                          <TableCell className="font-medium text-gray-800">{ch?.display_name ?? rule.channel_id}</TableCell>
                          <TableCell>
                            {isGlobal ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-400 border border-gray-200">
                                全球
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 flex-wrap">
                                {countryCodes.map((cc) => (
                                  <span
                                    key={cc}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-700 border border-gray-200"
                                  >
                                    {cc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold',
                                rule.priority === 1
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {rule.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-gray-700">
                              {rule.weight.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={rule.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => { setEditTarget(rule); setModalOpen(true); }}
                                title="编辑"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {rule.status === 'ACTIVE' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-amber-50 hover:text-amber-600"
                                  onClick={() => setDeactivateTarget(rule)}
                                  title="停用"
                                >
                                  <ToggleRight className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                                  onClick={() => handleToggleActive(rule)}
                                  title="启用"
                                >
                                  <ToggleLeft className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })
        )}
      </div>

      <RoutingRuleModal
        open={modalOpen}
        rule={editTarget}
        paymentMethods={paymentMethods}
        channels={channels}
        channelPaymentMethods={channelPaymentMethods}
        channelPaymentMethodCountries={channelPaymentMethodCountries}
        routingRuleCountries={routingRuleCountries}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deactivateTarget} onOpenChange={(v) => !v && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停用路由规则</AlertDialogTitle>
            <AlertDialogDescription>
              停用后该渠道将从此支付方式的路由中移除，流量将自动转移至其他规则，确认停用？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeactivateTarget(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} className="bg-amber-500 hover:bg-amber-600">
              确认停用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        status === 'ACTIVE'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-gray-100 text-gray-500 border-gray-200'
      )}
    >
      {status === 'ACTIVE' ? '启用' : '停用'}
    </span>
  );
}
