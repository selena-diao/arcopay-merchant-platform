import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { TriangleAlert as AlertTriangle, Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface TerminateContractDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function TerminateContractDialog({ open, onClose, onConfirm }: TerminateContractDialogProps) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setSaving(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || saving) return;
    setSaving(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <DialogTitle>作废合同</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <p className="text-sm text-gray-500">
            合同作废后状态将变为「已终止」，此操作不可撤销。请填写作废原因。
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="reason">
              作废原因 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请填写作废原因，例如：费率重新谈判，原合同作废重签"
              rows={3}
              required
              disabled={saving}
              className="resize-none"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!reason.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  处理中...
                </>
              ) : '确认作废'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
