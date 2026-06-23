import type { BingoCard, BingoSquare, WinningLine } from '../types';

/**
 * Check all possible winning lines.
 * Returns the first winning line found, or null.
 */
export function checkForBingo(card: BingoCard): WinningLine | null {
  const { squares } = card;

  // Check rows (5 possible)
  for (let row = 0; row < 5; row++) {
    if (squares[row].every((sq) => sq.isFilled)) {
      return {
        type: 'row',
        index: row,
        squares: squares[row].map((sq) => sq.id),
      };
    }
  }

  // Check columns (5 possible)
  for (let col = 0; col < 5; col++) {
    const columnFilled = squares.every((row) => row[col].isFilled);
    if (columnFilled) {
      return {
        type: 'column',
        index: col,
        squares: squares.map((row) => row[col].id),
      };
    }
  }

  // Check diagonal (top-left to bottom-right)
  const diagonal1Filled = [0, 1, 2, 3, 4].every((i) => squares[i][i].isFilled);
  if (diagonal1Filled) {
    return {
      type: 'diagonal',
      index: 0,
      squares: [0, 1, 2, 3, 4].map((i) => `${i}-${i}`),
    };
  }

  // Check diagonal (top-right to bottom-left)
  const diagonal2Filled = [0, 1, 2, 3, 4].every((i) => squares[i][4 - i].isFilled);
  if (diagonal2Filled) {
    return {
      type: 'diagonal',
      index: 1,
      squares: [0, 1, 2, 3, 4].map((i) => `${i}-${4 - i}`),
    };
  }

  return null;
}

/**
 * Count filled squares (including the free space)
 */
export function countFilled(card: BingoCard): number {
  return card.squares.flat().filter((sq) => sq.isFilled).length;
}

export interface ClosestToWin {
  needed: number;
  line: string;
  /** The single missing word, only populated when needed === 1 */
  missingWord?: string;
}

/**
 * Check how close to bingo (for UI hints)
 */
export function getClosestToWin(card: BingoCard): ClosestToWin | null {
  const { squares } = card;
  let closest: ClosestToWin = { needed: 5, line: '' };

  const lines: { squares: BingoSquare[]; name: string }[] = [
    // Rows
    ...squares.map((row, i) => ({
      squares: row,
      name: `Row ${i + 1}`,
    })),
    // Columns
    ...[0, 1, 2, 3, 4].map((col) => ({
      squares: squares.map((row) => row[col]),
      name: `Column ${col + 1}`,
    })),
    // Diagonals
    {
      squares: [0, 1, 2, 3, 4].map((i) => squares[i][i]),
      name: 'Diagonal ↘',
    },
    {
      squares: [0, 1, 2, 3, 4].map((i) => squares[i][4 - i]),
      name: 'Diagonal ↙',
    },
  ];

  for (const line of lines) {
    const unfilled = line.squares.filter((sq) => !sq.isFilled);
    const needed = unfilled.length;
    if (needed > 0 && needed < closest.needed) {
      closest = {
        needed,
        line: line.name,
        missingWord: needed === 1 ? unfilled[0].word : undefined,
      };
    }
  }

  return closest.needed < 5 ? closest : null;
}
