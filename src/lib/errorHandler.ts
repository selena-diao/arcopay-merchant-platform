import { toast } from 'sonner';

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  const code = e.code as string | undefined;
  const message = (e.message as string | undefined) ?? '';
  return code === '23505' || message.includes('duplicate key') || message.includes('unique constraint');
}

export function handleSaveError(error: unknown): void {
  if (isUniqueViolation(error)) {
    toast.error('该记录已存在，请勿重复添加');
  } else {
    toast.error('操作失败，请稍后重试');
  }
}
