import { useState, useEffect } from 'react';
import { Channel, ChannelStatus, MerchantMode } from '../../types';
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
import { MerchantModeBadge } from './MerchantModeBadge';

interface ChannelModalProps {
  open: boolean;
  channel?: Channel | null;
  onClose: () => void;
  onSave: (data: Omit<Channel, 'id' | 'created_at'>) => void | Promise<void>;
  saving?: boolean;
}

export function ChannelModal({ open, channel, onClose, onSave, saving }: ChannelModalProps) {
  const isEdit = !!channel;

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [merchantMode, setMerchantMode] = useState<MerchantMode>('MOR');
  const [successRate, setSuccessRate] = useState('');
  const [status, setStatus] = useState<ChannelStatus>('ACTIVE');

  useEffect(() => {
    if (channel) {
      setName(channel.name);
      setDisplayName(channel.display_name);
      setMerchantMode(channel.merchant_mode);
      setSuccessRate((channel.success_rate * 100).toFixed(1));
      setStatus(channel.status);
    } else {
      setName('');
      setDisplayName('');
      setMerchantMode('MOR');
      setSuccessRate('');
      setStatus('ACTIVE');
    }
  }, [channel, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(successRate);
    if (!name.trim() || !displayName.trim() || isNaN(rate)) return;
    onSave({
      name: name.trim().toLowerCase().replace(/\s+/g, ''),
      display_name: displayName.trim(),
      merchant_mode: merchantMode,
      success_rate: rate / 100,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑渠道' : '新增渠道'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">渠道标识</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="paycools"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayName">显示名称</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="PayCools"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>商户模式</Label>
              {isEdit ? (
                <div className="flex h-9 items-center">
                  <MerchantModeBadge mode={merchantMode} />
                </div>
              ) : (
                <Select value={merchantMode} onValueChange={(v) => setMerchantMode(v as MerchantMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOR">MOR 大商户</SelectItem>
                    <SelectItem value="SOR">SOR 小商户</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="successRate">成功率 (%)</Label>
              <Input
                id="successRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={successRate}
                onChange={(e) => setSuccessRate(e.target.value)}
                placeholder="98.2"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>运营状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ChannelStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">运营中</SelectItem>
                <SelectItem value="INACTIVE">已停用</SelectItem>
                <SelectItem value="MAINTENANCE">维护中</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>取消</Button>
            <Button type="submit" disabled={saving}>{isEdit ? '保存更改' : '创建渠道'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
