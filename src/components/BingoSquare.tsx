import { forwardRef } from 'react';
import { cn } from '../lib/utils';
import type { BingoSquare as BingoSquareType } from '../types';

interface Props {
  square: BingoSquareType;
  isWinningSquare: boolean;
  onClick: () => void;
}

export const BingoSquare = forwardRef<HTMLButtonElement, Props>(function BingoSquare(
  { square, isWinningSquare, onClick },
  ref,
) {
  const { word, isFilled, isAutoFilled, isFreeSpace } = square;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-disabled={isFreeSpace || undefined}
      aria-pressed={isFilled}
      aria-label={
        isFreeSpace
          ? 'Free space, always filled'
          : `${word}${isFilled ? (isAutoFilled ? ', filled automatically' : ', filled') : ''}`
      }
      className={cn(
        'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 p-1 text-center text-[11px] font-medium leading-tight transition-transform duration-150 sm:p-1.5 sm:text-xs',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1',
        !isFreeSpace && 'motion-safe:hover:scale-105 motion-safe:active:scale-95',
        !isFilled && 'border-gray-200 bg-white text-gray-700 hover:border-purple-300',
        isFilled && !isFreeSpace && !isAutoFilled && 'border-blue-600 bg-blue-500 text-white',
        isAutoFilled && 'border-emerald-600 bg-emerald-500 text-white motion-safe:animate-pulse-fast',
        isFreeSpace && 'cursor-default border-amber-300 bg-amber-100 text-amber-800',
        isWinningSquare && 'ring-4 ring-yellow-400',
      )}
    >
      {isAutoFilled && (
        <span className="absolute left-1 top-1 text-[10px]" aria-hidden="true">
          ✨
        </span>
      )}
      {isFilled && !isFreeSpace && !isAutoFilled && (
        <span className="absolute left-1 top-1 text-[10px]" aria-hidden="true">
          ✓
        </span>
      )}
      <span
        className={cn(
          'min-w-0 break-words hyphens-auto',
          isFilled && !isFreeSpace && 'line-through opacity-90',
        )}
      >
        {isFreeSpace ? '⭐ FREE' : word}
      </span>
    </button>
  );
});
