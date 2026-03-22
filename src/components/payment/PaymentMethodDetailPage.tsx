import { useState, useEffect } from 'react';
import {
  PaymentMethod,
  ChannelPaymentMethod,
  ChannelPaymentMethodCountry,
  Channel,
} from '../../types';
import {
  createChannelPaymentMethod,
  deleteChannelPaymentMethod,
  deleteChannelPaymentMethodCountriesByMethodId,
  createChannelPaymentMethodCountry,
} from '../../lib/channelService';
import { PaymentMethodTypeBadge } from './PaymentMethodTypeBadge';
import { Button } from '../ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  ArrowLeft,
  Wallet,
  Pencil,
  Trash2,
  Plus,
  Radio,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface PaymentMethodDetailPageProps {
  paymentMethod: PaymentMethod;
  channels: Channel[];
  channelPaymentMethods: ChannelPaymentMethod[];
  channelPaymentMethodCountries: ChannelPaymentMethodCountry[];
  onChannelPaymentMethodsChange: (
    methods: ChannelPaymentMethod[],
    countries: ChannelPaymentMethodCountry[]
  ) => void;
  onBack: () => void;
}

export function PaymentMethodDetailPage({
  paymentMethod,
  channels,
  channelPaymentMethods,
  channelPaymentMethodCountries,
  onChannelPaymentMethodsChange,
  onBack,
}: PaymentMethodDetailPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChannelPaymentMethod | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ChannelPaymentMethod | null>(null);

  const pmRecords = channelPaymentMethods.filter(
    (cpm) => cpm.payment_method_id === paymentMethod.id
  );

  const getChannelName = (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    return ch ? ch.display_name : channelId;
  };

  const handleSave = async (data: Omit<ChannelPaymentMethod, 'id'>, countryCodes: string[]) => {
    if (editingRecord) {
      try {
        await deleteChannelPaymentMethodCountriesByMethodId(editingRecord.id);
        const newCountryRecords: ChannelPaymentMethodCountry[] = await Promise.all(
          countryCodes.map((code) => createChannelPaymentMethodCountry(editingRecord.id, code))
        );
        const updatedMethods = channelPaymentMethods.map((cpm) =>
          cpm.id === editingRecord.id ? { ...cpm, ...data } : cpm
        );
        const updatedCountries = [
          ...channelPaymentMethodCountries.filter(
            (c) => c.channel_payment_method_id !== editingRecord.id
          ),
          ...newCountryRecords,
        ];
        onChannelPaymentMethodsChange(updatedMethods, updatedCountries);
      } catch {
        // ignore
      }
    } else {
      try {
        const newMethod = await createChannelPaymentMethod(data.channel_id, data.payment_method_id);
        const newCountryRecords: ChannelPaymentMethodCountry[] = await Promise.all(
          countryCodes.map((code) => createChannelPaymentMethodCountry(newMethod.id, code))
        );
        onChannelPaymentMethodsChange(
          [...channelPaymentMethods, newMethod],
          [...channelPaymentMethodCountries, ...newCountryRecords]
        );
      } catch {
        // ignore
      }
    }
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    try {
      await deleteChannelPaymentMethod(deletingRecord.id);
    } catch {
      // ignore
    }
    onChannelPaymentMethodsChange(
      channelPaymentMethods.filter((cpm) => cpm.id !== deletingRecord.id),
      channelPaymentMethodCountries.filter(
        (c) => c.channel_payment_method_id !== deletingRecord.id
      )
    );
    setDeletingRecord(null);
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回支付方式列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">{paymentMethod.name}</h1>
              <PaymentMethodTypeBadge type={paymentMethod.type} />
              <StatusBadge status={paymentMethod.status} />
            </div>
            <p className="text-sm text-gray-400 font-mono mt-0.5">{paymentMethod.id}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 ml-16">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            {pmRecords.length} 个渠道支持此支付方式
          </span>
        </div>
      </div>

      <Tabs defaultValue="channels">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="channels" className="text-sm px-4">
              支持渠道
            </TabsTrigger>
          </TabsList>
          <TabsContent value="channels" className="mt-0">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { setEditingRecord(null); setModalOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" />
              新增渠道支持
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="channels" className="mt-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {pmRecords.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <div className="opacity-20 mb-3">
                  <Radio className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium">暂无渠道配置</p>
                <p className="text-xs mt-1">点击「新增渠道支持」添加</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="font-semibold text-gray-700 w-48">渠道</TableHead>
                    <TableHead className="font-semibold text-gray-700">支持国家</TableHead>
                    <TableHead className="font-semibold text-gray-700 w-28 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pmRecords.map((cpm) => (
                    <TableRow key={cpm.id} className="hover:bg-gray-50/70 transition-colors">
                      <TableCell className="font-medium text-gray-900">
                        {getChannelName(cpm.channel_id)}
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => { setEditingRecord(cpm); setModalOpen(true); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeletingRecord(cpm)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ChannelSupportModal
        open={modalOpen}
        record={editingRecord}
        paymentMethodId={paymentMethod.id}
        existingForPm={pmRecords}
        channels={channels}
        channelPaymentMethodCountries={channelPaymentMethodCountries}
        onClose={() => { setModalOpen(false); setEditingRecord(null); }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deletingRecord}
        title="确认删除"
        description="删除后，路由规则中涉及该渠道和支付方式的组合将失去国家过滤依据，确认删除？"
        onConfirm={handleDelete}
        onCancel={() => setDeletingRecord(null)}
      />
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

interface ChannelSupportModalProps {
  open: boolean;
  record: ChannelPaymentMethod | null;
  paymentMethodId: string;
  existingForPm: ChannelPaymentMethod[];
  channels: Channel[];
  channelPaymentMethodCountries: ChannelPaymentMethodCountry[];
  onClose: () => void;
  onSave: (data: Omit<ChannelPaymentMethod, 'id'>, countries: string[]) => void;
}

function ChannelSupportModal({
  open,
  record,
  paymentMethodId,
  existingForPm,
  channels,
  channelPaymentMethodCountries,
  onClose,
  onSave,
}: ChannelSupportModalProps) {
  const isEdit = !!record;
  const [selectedChannelId, setSelectedChannelId] = useState(record?.channel_id ?? '');
  const [countries, setCountries] = useState<string[]>([]);
  const [countryInput, setCountryInput] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);

  useEffect(() => {
    if (open) {
      const initCountries = record
        ? channelPaymentMethodCountries
            .filter((c) => c.channel_payment_method_id === record.id)
            .map((c) => c.country_code)
        : [];
      setSelectedChannelId(record?.channel_id ?? '');
      setCountries(initCountries);
      setCountryInput('');
      setDuplicateError(false);
    }
  }, [open, record, channelPaymentMethodCountries]);

  const handleChannelChange = (channelId: string) => {
    setSelectedChannelId(channelId);
    const isDuplicate = existingForPm.some(
      (e) => e.channel_id === channelId && e.id !== record?.id
    );
    setDuplicateError(isDuplicate);
  };

  const handleAddCountry = () => {
    const cc = countryInput.trim().toUpperCase();
    if (!cc) return;
    if (!countries.includes(cc)) setCountries((prev) => [...prev, cc]);
    setCountryInput('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAddCountry();
    }
  };

  const canSave = selectedChannelId && countries.length > 0 && !duplicateError;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ channel_id: selectedChannelId, payment_method_id: paymentMethodId }, countries);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑渠道支持' : '新增渠道支持'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">渠道</Label>
            <Select value={selectedChannelId} onValueChange={handleChannelChange} disabled={isEdit}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择渠道..." />
              </SelectTrigger>
              <SelectContent>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>{ch.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && <p className="text-xs text-gray-400">渠道不可更改</p>}
            {duplicateError && (
              <p className="text-xs text-red-500">该渠道已配置此支付方式，请直接编辑</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">支持国家</Label>
            <div className="flex gap-2">
              <Input
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
                onKeyDown={handleInputKeyDown}
                placeholder="输入国家代码，如 PH"
                maxLength={3}
                className="font-mono uppercase"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCountry}
                disabled={!countryInput.trim()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">按 Enter 或空格快速添加</p>
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {countries.map((cc) => (
                  <span
                    key={cc}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                  >
                    {cc}
                    <button
                      type="button"
                      onClick={() => setCountries((prev) => prev.filter((c) => c !== cc))}
                      className="text-blue-400 hover:text-blue-700 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {countries.length === 0 && selectedChannelId && (
              <p className="text-xs text-red-500">请至少添加一个支持国家</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={!canSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
