import { useEffect, useRef } from 'react';
import { Button } from './ui/Button';

interface Props {
  isOpen: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

/**
 * In-app trust modal shown the moment the user first tries to start
 * listening — not just mentioned once on the landing page — per UXR Scene 5.
 */
export function MicPermissionModal({ isOpen, onAllow, onSkip }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSkip]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mic-permission-title"
        aria-describedby="mic-permission-description"
        tabIndex={-1}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl focus:outline-none"
      >
        <h2 id="mic-permission-title" className="text-lg font-bold text-gray-900">
          🎤 Listen for buzzwords?
        </h2>
        <p id="mic-permission-description" className="mt-2 text-sm text-gray-600">
          If you allow microphone access, Meeting Bingo listens for the words on your card and
          auto-fills matching squares as people say them.
        </p>
        <p className="mt-2 text-sm font-medium text-gray-700">
          🔒 Audio is processed entirely in your browser. Nothing is recorded, saved, or sent
          anywhere.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onSkip}>
            Skip, I&apos;ll tap manually
          </Button>
          <Button variant="primary" onClick={onAllow}>
            Allow &amp; Listen
          </Button>
        </div>
      </div>
    </div>
  );
}
