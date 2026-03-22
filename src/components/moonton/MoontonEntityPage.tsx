import { useState } from 'react';
import { MoontonEntity, MoontonKYBRecord } from '../../types';
import { createMoontonEntity, updateMoontonEntity, deleteMoontonEntity } from '../../lib/moontonService';
import { RegionBadge } from '../shared/RegionBadge';
import { KybStatusBadge } from '../shared/KybStatusBadge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { MoontonEntityModal } from './MoontonEntityModal';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Pencil, Trash2, Plus, Building2, ChevronRight } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';
import { toast } from 'sonner';

interface MoontonEntityPageProps {
  entities: MoontonEntity[];
  moontonKybRecords: MoontonKYBRecord[];
  onRefresh: () => Promise<void>;
  onDrillDown: (entity: MoontonEntity) => void;
}

export function MoontonEntityPage({
  entities,
  moontonKybRecords,
  onRefresh,
  onDrillDown,
}: MoontonEntityPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MoontonEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MoontonEntity | null>(null);
  const [saving, setSaving] = useState(false);

  const getKybCount = (entityId: string) =>
    moontonKybRecords.filter((r) => r.moonton_entity_id === entityId).length;

  const getKybSummaryStatus = (entityId: string) => {
    const records = moontonKybRecords.filter((r) => r.moonton_entity_id === entityId);
    if (records.length === 0) return null;
    if (records.some((r) => r.status === 'REJECTED')) return 'REJECTED' as const;
    if (records.some((r) => r.status === 'PENDING')) return 'PENDING' as const;
    return 'APPROVED' as const;
  };

  const handleSave = async (data: Omit<MoontonEntity, 'id' | 'created_at' | 'is_display_only'>) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateMoontonEntity(editTarget.id, data);
      } else {
        await createMoontonEntity(data);
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
    try {
      await deleteMoontonEntity(deleteTarget.id);
      toast.success('主体已删除');
      await onRefresh();
    } catch (err) {
      handleSaveError(err);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">平台主体</h1>
            <p className="text-sm text-gray-500 mt-0.5">管理 ArcoPay 旗下各法律主体信息及渠道 KYB 状态</p>
          </div>
        </div>
        <Button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" />
          新增主体
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-900">{entities.length}</span> 条记录
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-xs text-gray-400">Global 为签约策略虚拟主体，仅展示</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
              <TableHead className="font-semibold text-gray-700 w-32">显示名称</TableHead>
              <TableHead className="font-semibold text-gray-700">法律全称</TableHead>
              <TableHead className="font-semibold text-gray-700 w-28">注册地区</TableHead>
              <TableHead className="font-semibold text-gray-700 w-44">KYB 记录</TableHead>
              <TableHead className="font-semibold text-gray-700 w-28">创建日期</TableHead>
              <TableHead className="font-semibold text-gray-700 w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => {
              const kybCount = getKybCount(entity.id);
              const summaryStatus = getKybSummaryStatus(entity.id);
              return (
                <TableRow key={entity.id} className="hover:bg-gray-50/70 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {entity.is_display_only ? (
                        <span className="font-medium text-gray-900">{entity.name}</span>
                      ) : (
                        <button
                          onClick={() => onDrillDown(entity)}
                          className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors group"
                        >
                          {entity.name}
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                      {entity.is_display_only && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-normal">
                          仅展示
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{entity.full_legal_name}</TableCell>
                  <TableCell>
                    <RegionBadge region={entity.region} />
                  </TableCell>
                  <TableCell>
                    {entity.is_display_only ? (
                      <span className="text-xs text-gray-300">—</span>
                    ) : kybCount === 0 ? (
                      <span className="text-xs text-gray-400">暂无记录</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {kybCount}
                        </span>
                        {summaryStatus && <KybStatusBadge status={summaryStatus} />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{entity.created_at}</TableCell>
                  <TableCell className="text-right">
                    {entity.is_display_only ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => { setEditTarget(entity); setModalOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget(entity)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <MoontonEntityModal
        open={modalOpen}
        entity={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除主体"
        description={`即将删除主体「${deleteTarget?.name}」，此操作不可撤销，是否继续？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
