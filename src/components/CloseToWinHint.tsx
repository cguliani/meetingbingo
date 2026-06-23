import type { ClosestToWin } from '../lib/bingoChecker';

interface Props {
  closestToWin: ClosestToWin | null;
}

export function CloseToWinHint({ closestToWin }: Props) {
  if (!closestToWin?.missingWord) return null;

  return (
    <div
      role="status"
      className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-center text-sm font-medium text-yellow-800"
    >
      🔥 1 away on {closestToWin.line} — needs &quot;{closestToWin.missingWord}&quot;
    </div>
  );
}
