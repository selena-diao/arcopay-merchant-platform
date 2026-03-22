import { useState, useEffect } from 'react';
import { Merchant } from '../../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface MerchantModalProps {
  open: boolean;
  merchant?: Merchant | null;
  onClose: () => void;
  onSave: (data: Pick<Merchant, 'name' | 'category'>) => void;
  saving?: boolean;
}

export function MerchantModal({ open, merchant, onClose, onSave, saving }: MerchantModalProps) {
  const isEdit = !!merchant;
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    setName(merchant?.name ?? '');
    setCategory(merchant?.category ?? '');
  }, [merchant, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category: category.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑商家' : '新增商家'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="merchantName">商家名称</Label>
            <Input
              id="merchantName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：NovaMart"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="merchantCategory">品类备注</Label>
            <Input
              id="merchantCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例：综合品类"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>{isEdit ? '保存更改' : '创建商家'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
