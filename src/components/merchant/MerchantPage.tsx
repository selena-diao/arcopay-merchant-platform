import { useState } from 'react';
import { Merchant, MerchantEntity } from '../../types';
import {
  createMerchant,
  updateMerchant,
  deleteMerchant,
} from '../../lib/merchantService';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { MerchantModal } from './MerchantModal';
import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Pencil, Trash2, Plus, Users, ChevronRight } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';
import { toast } from 'sonner';

interface MerchantPageProps {
  merchants: Merchant[];
  merchantEntities: MerchantEntity[];
  onRefresh: () => void;
  onDrillDown: (merchant: Merchant) => void;
}

export function MerchantPage({
  merchants,
  merchantEntities,
  onRefresh,
  onDrillDown,
}: MerchantPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Merchant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Merchant | null>(null);
  const [saving, setSaving] = useState(false);

  const getEntityCount = (merchantId: string) =>
    merchantEntities.filter((e) => e.merchant_id === merchantId).length;

  const handleOpenCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (merchant: Merchant) => {
    setEditTarget(merchant);
    setModalOpen(true);
  };

  const handleSave = async (data: Pick<Merchant, 'name' | 'category'>) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateMerchant(editTarget.id, data);
      } else {
        await createMerchant(data);
      }
      onRefresh();
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
      await deleteMerchant(deleteTarget.id);
      toast.success('商家已删除');
    } catch (err) {
      handleSaveError(err);
    }
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">商家管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">管理合作商家及其法律主体信息</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          新增商家
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <span className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-900">{merchants.length}</span> 家商家
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
              <TableHead className="font-semibold text-gray-700">商家名称</TableHead>
              <TableHead className="font-semibold text-gray-700 w-28">品类</TableHead>
              <TableHead className="font-semibold text-gray-700 w-36">法律主体数</TableHead>
              <TableHead className="font-semibold text-gray-700 w-28">创建日期</TableHead>
              <TableHead className="font-semibold text-gray-700 w-28 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((merchant) => (
              <TableRow key={merchant.id} className="hover:bg-gray-50/70 transition-colors">
                <TableCell>
                  <button
                    onClick={() => onDrillDown(merchant)}
                    className="flex items-center gap-1.5 font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors group"
                  >
                    {merchant.name}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">{merchant.category ?? '—'}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {getEntityCount(merchant.id)}
                  </span>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{merchant.created_at}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => handleOpenEdit(merchant)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setDeleteTarget(merchant)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MerchantModal
        open={modalOpen}
        merchant={editTarget}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除商家"
        description={`即将删除商家「${deleteTarget?.name}」及其所有关联数据，此操作不可撤销，是否继续？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
