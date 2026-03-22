import { useState, useEffect } from 'react';
import { Application, AppStatus } from '../../types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface ApplicationModalProps {
  open: boolean;
  merchantId: string;
  application?: Application | null;
  onClose: () => void;
  onSave: (data: Omit<Application, 'id' | 'created_at'>) => Promise<void> | void;
}

const statusOptions: { value: AppStatus; label: string }[] = [
  { value: 'ACTIVE', label: '运营中' },
  { value: 'INACTIVE', label: '已停用' },
];

export function ApplicationModal({
  open,
  merchantId,
  application,
  onClose,
  onSave,
}: ApplicationModalProps) {
  const isEdit = !!application;
  const [name, setName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [status, setStatus] = useState<AppStatus>('ACTIVE');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application) {
      setName(application.name);
      setBundleId(application.bundle_id);
      setStatus(application.status);
    } else {
      setName('');
      setBundleId('');
      setStatus('ACTIVE');
    }
    setSaving(false);
  }, [application, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bundleId.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({ merchant_id: merchantId, name: name.trim(), bundle_id: bundleId.trim(), status });
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑店铺' : '新增店铺'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="appName">店铺名称</Label>
            <Input
              id="appName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：Mobile Legends: Bang Bang"
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bundleId">店铺域名</Label>
            <Input
              id="bundleId"
              value={bundleId}
              onChange={(e) => setBundleId(e.target.value)}
              placeholder="例：shop.novamart.com"
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label>状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AppStatus)} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  保存中...
                </>
              ) : isEdit ? '保存更改' : '创建店铺'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
