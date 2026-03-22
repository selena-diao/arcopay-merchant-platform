import { useState } from 'react';
import { KYBRecordBase, Channel } from '../../types';
import { KybStatusBadge } from '../shared/KybStatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { KybRecordModal } from './KybRecordModal';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';

interface KybRecordsSectionProps {
  records: KYBRecordBase[];
  channels: Channel[];
  onSave: (data: Omit<KYBRecordBase, 'id'>, existingId?: string) => void;
  onDelete: (id: string) => void;
}

export function KybRecordsSection({ records, channels, onSave, onDelete }: KybRecordsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<KYBRecordBase | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KYBRecordBase | null>(null);

  const channelMap = new Map(channels.map((ch) => [ch.id, ch.display_name || ch.name]));

  const handleSave = (data: Omit<KYBRecordBase, 'id'>) => {
    onSave(data, editTarget?.id);
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const deleteChannelLabel = deleteTarget
    ? (channelMap.get(deleteTarget.channel_id) ?? deleteTarget.channel_id)
    : '';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">KYB 记录</h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          新增记录
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {records.length === 0 ? (
          <div className="py-14 flex flex-col items-center justify-center text-gray-400">
            <ShieldCheck className="w-9 h-9 opacity-25 mb-3" />
            <p className="text-sm font-medium">暂无 KYB 记录</p>
            <p className="text-xs mt-1">点击「新增记录」添加渠道 KYB</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                <TableHead className="font-semibold text-gray-700 w-36">渠道</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">审核状态</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">提交日期</TableHead>
                <TableHead className="font-semibold text-gray-700 w-28">审核日期</TableHead>
                <TableHead className="font-semibold text-gray-700">备注</TableHead>
                <TableHead className="font-semibold text-gray-700 w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="hover:bg-gray-50/70 transition-colors">
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs bg-slate-100 text-slate-700 font-medium">
                      {channelMap.get(record.channel_id) ?? record.channel_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <KybStatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{record.submitted_at}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {record.reviewed_at ?? <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {record.notes ?? <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => { setEditTarget(record); setModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteTarget(record)}
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

      <KybRecordModal
        open={modalOpen}
        record={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除 KYB 记录"
        description={`即将删除渠道「${deleteChannelLabel}」的 KYB 记录，此操作不可撤销，是否继续？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
