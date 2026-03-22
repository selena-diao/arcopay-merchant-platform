import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Loader as Loader2 } from 'lucide-react';
import { handleSaveError } from '../../lib/errorHandler';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  confirmLabel = '确认删除',
  cancelLabel = '取消',
}: ConfirmDialogProps) {
  const [saving, setSaving] = useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onConfirm();
    } catch (err) {
      handleSaveError(err);
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && !saving && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={saving}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                处理中...
              </>
            ) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
