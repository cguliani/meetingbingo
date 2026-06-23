import { Toast } from './Toast';
import type { Toast as ToastType } from '../../types';

interface Props {
  toasts: ToastType[];
  onDismiss: (id: string) => void;
}

/**
 * Renders the queued toasts stacked (oldest on top, newest at the bottom).
 * aria-live="polite" gives screen-reader users non-visual feedback when a
 * word is auto-detected, matching TranscriptPanel's own live region.
 */
export function ToastQueue({ toasts, onDismiss }: Props) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
