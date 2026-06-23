import { useEffect } from 'react';
import { cn } from '../../lib/utils';
import type { Toast as ToastType } from '../../types';

interface Props {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType['type'], string> = {
  success: '✨',
  info: 'ℹ️',
  warning: '⚠️',
};

const TYPE_CLASSES: Record<ToastType['type'], string> = {
  success: 'bg-green-100 text-green-800 border-green-300',
  info: 'bg-blue-100 text-blue-800 border-blue-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
};

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-md motion-safe:animate-bounce-in',
        TYPE_CLASSES[toast.type],
      )}
    >
      <span aria-hidden="true">{ICONS[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
}
