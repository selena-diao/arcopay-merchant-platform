import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Country } from '../../types';
import { Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface CountryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { code: string; name: string }) => Promise<void> | void;
  editingCountry?: Country | null;
}

export function CountryModal({ open, onClose, onSave, editingCountry }: CountryModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCode(editingCountry?.code ?? '');
      setName(editingCountry?.name ?? '');
      setSaving(false);
    }
  }, [open, editingCountry]);

  const isEdit = !!editingCountry;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({ code: code.trim().toUpperCase(), name: name.trim() });
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !saving) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑国家' : '新增国家'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>国家代码</Label>
            {isEdit ? (
              <div className="h-9 px-3 flex items-center rounded-md border border-slate-200 bg-slate-50 font-mono text-sm text-slate-700 tracking-widest">
                {editingCountry.code}
              </div>
            ) : (
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="如: CN"
                maxLength={3}
                className="font-mono tracking-widest uppercase"
                required
                disabled={saving}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label>国家名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如: 中国"
              required
              disabled={saving}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>取消</Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  保存中...
                </>
              ) : isEdit ? '保存' : '创建'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
