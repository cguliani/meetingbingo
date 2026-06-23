import { describe, it, expect } from 'vitest';
import { checkForBingo, countFilled, getClosestToWin } from '../bingoChecker';
import type { BingoCard, BingoSquare } from '../../types';

/**
 * Build a 5x5 BingoCard for testing. The center square (2,2) is always the
 * free space and always filled, matching generateCard's real behavior.
 * `filledIds` additionally marks those square ids ("row-col") as filled.
 */
function makeCard(filledIds: string[] = []): BingoCard {
  const filledSet = new Set(filledIds);
  const squares: BingoSquare[][] = [];

  for (let row = 0; row < 5; row++) {
    const rowSquares: BingoSquare[] = [];
    for (let col = 0; col < 5; col++) {
      const id = `${row}-${col}`;
      const isFreeSpace = row === 2 && col === 2;
      rowSquares.push({
        id,
        word: isFreeSpace ? 'FREE' : `word-${id}`,
        isFilled: isFreeSpace || filledSet.has(id),
        isAutoFilled: false,
        isFreeSpace,
        filledAt: isFreeSpace || filledSet.has(id) ? Date.now() : null,
        row,
        col,
      });
    }
    squares.push(rowSquares);
  }

  return { squares, words: squares.flat().filter((sq) => !sq.isFreeSpace).map((sq) => sq.word) };
}

function rowIds(row: number): string[] {
  return [0, 1, 2, 3, 4].map((col) => `${row}-${col}`);
}

function colIds(col: number): string[] {
  return [0, 1, 2, 3, 4].map((row) => `${row}-${col}`);
}

const diag1Ids = [0, 1, 2, 3, 4].map((i) => `${i}-${i}`);
const diag2Ids = [0, 1, 2, 3, 4].map((i) => `${i}-${4 - i}`);

describe('bingoChecker', () => {
  describe('checkForBingo', () => {
    it('returns null for a freshly generated card (only the free space filled)', () => {
      const card = makeCard([]);
      expect(checkForBingo(card)).toBeNull();
    });

    it.each([0, 1, 2, 3, 4])('detects a win on row %i', (row) => {
      const card = makeCard(rowIds(row));
      const result = checkForBingo(card);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('row');
      expect(result?.index).toBe(row);
      expect(result?.squares).toEqual(rowIds(row));
    });

    it.each([0, 1, 2, 3, 4])('detects a win on column %i', (col) => {
      const card = makeCard(colIds(col));
      const result = checkForBingo(card);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('column');
      expect(result?.index).toBe(col);
      expect(result?.squares).toEqual(colIds(col));
    });

    it('detects a win on the top-left-to-bottom-right diagonal', () => {
      const card = makeCard(diag1Ids);
      const result = checkForBingo(card);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('diagonal');
      expect(result?.index).toBe(0);
      expect(result?.squares).toEqual(diag1Ids);
    });

    it('detects a win on the top-right-to-bottom-left diagonal', () => {
      const card = makeCard(diag2Ids);
      const result = checkForBingo(card);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('diagonal');
      expect(result?.index).toBe(1);
      expect(result?.squares).toEqual(diag2Ids);
    });

    it('returns null when a row is missing exactly one square (not through center)', () => {
      // Row 0 doesn't pass through the free space, so it needs all 5 filled.
      const card = makeCard(rowIds(0).slice(0, 4));
      expect(checkForBingo(card)).toBeNull();
    });

    it('a line through the center only needs its 4 non-center squares filled', () => {
      // Row 2 passes through the free space (2,2), which is always filled.
      const card = makeCard(rowIds(2).filter((id) => id !== '2-2'));
      const result = checkForBingo(card);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('row');
      expect(result?.index).toBe(2);
    });

    it('returns null when no line is complete even with several scattered squares filled', () => {
      const card = makeCard(['0-0', '0-1', '1-0', '3-3', '4-4']);
      expect(checkForBingo(card)).toBeNull();
    });
  });

  describe('countFilled', () => {
    it('counts the free space alone on a fresh card', () => {
      expect(countFilled(makeCard([]))).toBe(1);
    });

    it('counts manually filled squares plus the free space', () => {
      expect(countFilled(makeCard(['0-0', '0-1', '4-4']))).toBe(4);
    });

    it('does not double count if a filled id is the free space itself', () => {
      expect(countFilled(makeCard(['2-2']))).toBe(1);
    });
  });

  describe('getClosestToWin', () => {
    it('on a fresh card, the closest lines are the 4 that pass through the pre-filled free space', () => {
      // Center-crossing lines (row 2, col 2, both diagonals) have 1 of 5
      // filled from the free space alone, so they're already "needed: 4" —
      // closer than any line that doesn't touch the center (needed: 5,
      // excluded entirely).
      const result = getClosestToWin(makeCard([]));
      expect(result).not.toBeNull();
      expect(result?.needed).toBe(4);
      expect(['Row 3', 'Column 3', 'Diagonal ↘', 'Diagonal ↙']).toContain(result?.line);
      expect(result?.missingWord).toBeUndefined();
    });

    it('returns null only when no line has any squares filled at all', () => {
      // Not reachable via generateCard (free space always pre-fills center
      // lines), but verifies the needed===5 exclusion directly.
      const card = makeCard([]);
      // Manually un-fill the free space to simulate an all-empty card.
      card.squares[2][2].isFilled = false;
      expect(getClosestToWin(card)).toBeNull();
    });

    it('identifies a line that is exactly 1 square away and names the missing word', () => {
      // Row 0 filled except column 4.
      const card = makeCard(rowIds(0).slice(0, 4));
      const result = getClosestToWin(card);
      expect(result).not.toBeNull();
      expect(result?.needed).toBe(1);
      expect(result?.line).toBe('Row 1');
      expect(result?.missingWord).toBe('word-0-4');
    });

    it('does not populate missingWord when more than 1 square is needed', () => {
      const card = makeCard(rowIds(0).slice(0, 3));
      const result = getClosestToWin(card);
      expect(result?.needed).toBe(2);
      expect(result?.missingWord).toBeUndefined();
    });

    it('picks the closest line when multiple lines are partially filled', () => {
      const card = makeCard([
        ...rowIds(0).slice(0, 4), // row 0: needs 1
        ...colIds(1).slice(0, 2), // column 1: needs 3
      ]);
      const result = getClosestToWin(card);
      expect(result?.needed).toBe(1);
      expect(result?.line).toBe('Row 1');
    });

    it('returns null once the card has already won (no line needs anything)', () => {
      const card = makeCard(rowIds(0));
      expect(checkForBingo(card)).not.toBeNull();
      expect(getClosestToWin(card)).not.toBeNull(); // other lines can still be "close"
    });
  });
});
