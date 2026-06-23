import { useCallback, useState } from 'react';
import type { Toast } from '../types';

const DEFAULT_DURATION = 3000;
const DEFAULT_MAX_VISIBLE = 3;

/**
 * Queues toast notifications so multiple words detected from one utterance
 * each get their own stacked toast instead of dropping/overwriting each
 * other. Caps simultaneously visible toasts, dropping the oldest first once
 * over the limit.
 */
export function useToastQueue(maxVisible: number = DEFAULT_MAX_VISIBLE) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'success', duration: number = DEFAULT_DURATION) => {
      const toast: Toast = {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        type,
        duration,
      };
      setToasts((prev) => {
        const next = [...prev, toast];
        return next.length > maxVisible ? next.slice(next.length - maxVisible) : next;
      });
    },
    [maxVisible],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
