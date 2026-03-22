import { useState, useEffect } from 'react';
import { MoontonEntity, Country } from '../../types';
import { supabase } from '../../lib/supabase';
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

interface MoontonEntityModalProps {
  open: boolean;
  entity?: MoontonEntity | null;
  onClose: () => void;
  onSave: (data: Omit<MoontonEntity, 'id' | 'created_at' | 'is_display_only'>) => void;
  saving?: boolean;
}

export function MoontonEntityModal({ open, entity, onClose, onSave, saving }: MoontonEntityModalProps) {
  const isEdit = !!entity;

  const [name, setName] = useState('');
  const [fullLegalName, setFullLegalName] = useState('');
  const [region, setRegion] = useState<string>('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingCountries(true);
    supabase
      .from('countries')
      .select('code, name')
      .order('name')
      .then(({ data }) => {
        const list = (data ?? []) as Country[];
        setCountries(list);
        if (entity) {
          const exists = list.some((c) => c.code === entity.region);
          const fallback = list.find((c) => c.code === 'HK')?.code ?? list[0]?.code ?? '';
          setRegion(exists ? (entity.region ?? fallback) : fallback);
        } else {
          const fallback = list.find((c) => c.code === 'HK')?.code ?? list[0]?.code ?? '';
          setRegion(fallback);
        }
        setLoadingCountries(false);
      });
  }, [open]);

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setFullLegalName(entity.full_legal_name);
    } else {
      setName('');
      setFullLegalName('');
    }
  }, [entity, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fullLegalName.trim() || !region) return;
    onSave({ name: name.trim(), full_legal_name: fullLegalName.trim(), region });
  };

  const formDisabled = loadingCountries || saving;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑平台主体' : '新增平台主体'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">显示名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ArcoPay HK"
              required
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullLegalName">法律全称</Label>
            <Input
              id="fullLegalName"
              value={fullLegalName}
              onChange={(e) => setFullLegalName(e.target.value)}
              placeholder="例：ArcoPay Technology Limited"
              required
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>注册地区</Label>
            {loadingCountries ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-input rounded-md bg-muted/40 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>加载中…</span>
              </div>
            ) : (
              <Select value={region} onValueChange={(v) => setRegion(v)} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}（{c.code}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={formDisabled || !name.trim() || !fullLegalName.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  保存中…
                </>
              ) : isEdit ? '保存更改' : '创建主体'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
