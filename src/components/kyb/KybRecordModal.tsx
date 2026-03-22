import { useState, useEffect } from 'react';
import { KYBRecordBase, KybStatus, Channel } from '../../types';
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
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';
import { fetchChannels } from '../../lib/channelService';

interface KybRecordModalProps {
  open: boolean;
  record?: KYBRecordBase | null;
  onClose: () => void;
  onSave: (data: Omit<KYBRecordBase, 'id'>) => Promise<void> | void;
}

const statusOptions: { value: KybStatus; label: string }[] = [
  { value: 'PENDING', label: '审核中' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
];

export function KybRecordModal({ open, record, onClose, onSave }: KybRecordModalProps) {
  const isEdit = !!record;

  const [channelId, setChannelId] = useState('');
  const [status, setStatus] = useState<KybStatus>('PENDING');
  const [submittedAt, setSubmittedAt] = useState('');
  const [reviewedAt, setReviewedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingChannels(true);
    fetchChannels()
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setLoadingChannels(false));
  }, [open]);

  useEffect(() => {
    if (record) {
      setChannelId(record.channel_id);
      setStatus(record.status);
      setSubmittedAt(record.submitted_at);
      setReviewedAt(record.reviewed_at ?? '');
      setNotes(record.notes ?? '');
    } else {
      setChannelId('');
      setStatus('PENDING');
      setSubmittedAt(new Date().toISOString().split('T')[0]);
      setReviewedAt('');
      setNotes('');
    }
    setSaving(false);
  }, [record, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !submittedAt || saving) return;
    setSaving(true);
    try {
      await onSave({
        channel_id: channelId,
        status,
        submitted_at: submittedAt,
        reviewed_at: reviewedAt || null,
        notes: notes.trim() || null,
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
          <DialogTitle>{isEdit ? '编辑 KYB 记录' : '新增 KYB 记录'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>渠道</Label>
            <Select
              value={channelId}
              onValueChange={setChannelId}
              disabled={saving || loadingChannels}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingChannels ? '加载中...' : '选择渠道'} />
              </SelectTrigger>
              <SelectContent>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id}>
                    {ch.display_name || ch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>审核状态</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as KybStatus)} disabled={saving}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="submittedAt">提交日期</Label>
              <Input
                id="submittedAt"
                type="date"
                value={submittedAt}
                onChange={(e) => setSubmittedAt(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reviewedAt">审核日期（可选）</Label>
              <Input
                id="reviewedAt"
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">备注（可选）</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="补充说明..."
              className="resize-none h-20"
              disabled={saving}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving || !channelId}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  保存中...
                </>
              ) : isEdit ? '保存更改' : '创建记录'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
