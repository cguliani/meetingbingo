import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from './ui/Button';
import { BingoCard } from './BingoCard';
import { useGameContext } from '../context/GameContext';
import { CATEGORIES } from '../data/categories';
import { formatDuration, shareResult } from '../lib/shareUtils';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const NO_OP = () => {};

export function WinScreen() {
  const { state, dispatch } = useGameContext();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
  }, []);

  if (!state.card) return null;

  const categoryName = CATEGORIES.find((c) => c.id === state.category)?.name ?? 'Unknown';
  const timeToBingo =
    state.startedAt !== null && state.completedAt !== null
      ? formatDuration(state.completedAt - state.startedAt)
      : 'unknown';

  return (
    <div className="mx-auto max-w-xl px-4 py-8 text-center">
      <p className="text-5xl" aria-hidden="true">
        🎉
      </p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">BINGO!</h1>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-gray-100 p-3">
          <dt className="text-gray-500">Category</dt>
          <dd className="font-semibold text-gray-900">{categoryName}</dd>
        </div>
        <div className="rounded-lg bg-gray-100 p-3">
          <dt className="text-gray-500">Time to bingo</dt>
          <dd className="font-semibold text-gray-900">{timeToBingo}</dd>
        </div>
        <div className="rounded-lg bg-gray-100 p-3">
          <dt className="text-gray-500">Winning word</dt>
          <dd className="font-semibold text-gray-900">{state.winningWord ?? '—'}</dd>
        </div>
        <div className="rounded-lg bg-gray-100 p-3">
          <dt className="text-gray-500">Squares filled</dt>
          <dd className="font-semibold text-gray-900">{state.filledCount}/25</dd>
        </div>
      </dl>

      <div className="mt-6">
        <BingoCard card={state.card} winningLine={state.winningLine} onToggleSquare={NO_OP} />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => shareResult(state)}>
          Share result
        </Button>
        <Button variant="primary" onClick={() => dispatch({ type: 'NEW_CARD' })}>
          Play Again
        </Button>
        <Button variant="ghost" onClick={() => dispatch({ type: 'GO_HOME' })}>
          Home
        </Button>
      </div>
    </div>
  );
}
