import { useRef, type KeyboardEvent } from 'react';
import { BingoSquare } from './BingoSquare';
import type { BingoCard as BingoCardType, WinningLine } from '../types';

interface Props {
  card: BingoCardType;
  winningLine: WinningLine | null;
  onToggleSquare: (squareId: string) => void;
}

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowRight: [0, 1],
  ArrowLeft: [0, -1],
  ArrowDown: [1, 0],
  ArrowUp: [-1, 0],
};

export function BingoCard({ card, winningLine, onToggleSquare }: Props) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const winningIds = new Set(winningLine?.squares ?? []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, row: number, col: number) => {
    const delta = ARROW_DELTAS[event.key];
    if (!delta) return;
    event.preventDefault();
    const nextRow = Math.min(4, Math.max(0, row + delta[0]));
    const nextCol = Math.min(4, Math.max(0, col + delta[1]));
    buttonRefs.current[nextRow * 5 + nextCol]?.focus();
  };

  return (
    <div role="grid" aria-label="Bingo card" className="grid grid-cols-5 gap-1.5 sm:gap-2">
      {card.squares.map((rowSquares, row) => (
        <div role="row" key={row} className="contents">
          {rowSquares.map((square, col) => (
            <div role="gridcell" key={square.id} onKeyDown={(e) => handleKeyDown(e, row, col)}>
              <BingoSquare
                ref={(el) => {
                  buttonRefs.current[row * 5 + col] = el;
                }}
                square={square}
                isWinningSquare={winningIds.has(square.id)}
                onClick={() => onToggleSquare(square.id)}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
