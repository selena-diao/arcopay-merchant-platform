import { useState, useEffect } from 'react';
import { MerchantEntity, Region } from '../../types';
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
import { supabase } from '../../lib/supabase';

interface MerchantEntityModalProps {
  open: boolean;
  merchantId: string;
  entity?: MerchantEntity | null;
  onClose: () => void;
  onSave: (data: Omit<MerchantEntity, 'id' | 'created_at'>) => Promise<void> | void;
}

interface CountryOption {
  value: string;
  label: string;
}

export function MerchantEntityModal({
  open,
  merchantId,
  entity,
  onClose,
  onSave,
}: MerchantEntityModalProps) {
  const isEdit = !!entity;

  const [name, setName] = useState('');
  const [fullLegalName, setFullLegalName] = useState('');
  const [region, setRegion] = useState<Region>('HK');
  const [saving, setSaving] = useState(false);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  useEffect(() => {
    supabase
      .from('countries')
      .select('code, name')
      .order('name')
      .then(({ data }) => {
        if (data) {
          setCountryOptions(data.map((c) => ({ value: c.code, label: c.name })));
        }
      });
  }, []);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setFullLegalName(entity.full_legal_name);
      setRegion(entity.region);
    } else {
      setName('');
      setFullLegalName('');
      setRegion('HK');
    }
    setSaving(false);
  }, [entity, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fullLegalName.trim() || saving) return;
    setSaving(true);
    try {
      await onSave({
        merchant_id: merchantId,
        name: name.trim(),
        full_legal_name: fullLegalName.trim(),
        region,
      });
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑法律主体' : '新增法律主体'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entityName">显示名称</Label>
            <Input
              id="entityName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：Shenmoon HK"
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entityFullName">法律全称</Label>
            <Input
              id="entityFullName"
              value={fullLegalName}
              onChange={(e) => setFullLegalName(e.target.value)}
              placeholder="例：SHENMOON INTERACTIVE LIMITED"
              required
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label>注册地区</Label>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((opt) => (
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
              ) : isEdit ? '保存更改' : '创建主体'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
