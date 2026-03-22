import { useState } from 'react';
import { Channel } from '../../types';
import { createChannel, updateChannel, deleteChannel } from '../../lib/channelService';
import { handleSaveError } from '../../lib/errorHandler';
import { toast } from 'sonner';
import { ChannelStatusBadge } from './ChannelStatusBadge';
import { MerchantModeBadge } from './MerchantModeBadge';
import { ChannelModal } from './ChannelModal';
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
import { Plus, Pencil, Trash2, Radio, ChevronRight } from 'lucide-react';

interface ChannelPageProps {
  channels: Channel[];
  onRefresh: (deletedId?: string) => Promise<void>;
  onDrillDown: (channel: Channel) => void;
}

export function ChannelPage({ channels, onRefresh, onDrillDown }: ChannelPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Channel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: Omit<Channel, 'id' | 'created_at'>) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateChannel(editTarget.id, data);
      } else {
        await createChannel(data);
      }
      await onRefresh();
      setModalOpen(false);
      setEditTarget(null);
    } catch (err) {
      handleSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteChannel(deleteTarget.id);
      await onRefresh(deleteTarget.id);
      setDeleteTarget(null);
      toast.success('渠道已删除');
    } catch (err) {
      handleSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">渠道管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理支付渠道及合同配置</p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          新增渠道
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {channels.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Radio className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-sm font-medium">暂无渠道</p>
            <p className="text-xs mt-1">点击「新增渠道」添加第一个支付渠道</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700 w-44">渠道名称</TableHead>
                <TableHead className="font-semibold text-gray-700 w-36">商户模式</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">成功率</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">状态</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">创建日期</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id} className="hover:bg-gray-50/70 transition-colors">
                  <TableCell>
                    <button
                      onClick={() => onDrillDown(channel)}
                      className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors group"
                    >
                      {channel.display_name}
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <span className="text-xs text-gray-400 font-mono mt-0.5 block">{channel.name}</span>
                  </TableCell>
                  <TableCell>
                    <MerchantModeBadge mode={channel.merchant_mode} />
                  </TableCell>
                  <TableCell>
                    <SuccessRateBar rate={channel.success_rate} />
                  </TableCell>
                  <TableCell>
                    <ChannelStatusBadge status={channel.status} />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{channel.created_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => { setEditTarget(channel); setModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteTarget(channel)}
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

      <ChannelModal
        open={modalOpen}
        channel={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除渠道"
        description={`即将删除渠道「${deleteTarget?.display_name}」，此操作不可撤销，是否继续？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function SuccessRateBar({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  const color =
    rate >= 0.98 ? 'bg-emerald-500' : rate >= 0.95 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium text-gray-700 tabular-nums">{pct}%</span>
    </div>
  );
}
