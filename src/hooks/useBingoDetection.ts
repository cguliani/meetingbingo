import { useEffect, useMemo, type Dispatch } from 'react';
import type { GameState } from '../types';
import type { GameAction } from './useGame';
import { checkForBingo, getClosestToWin, type ClosestToWin } from '../lib/bingoChecker';

/**
 * Watches the card via reducer state: triggers the WIN transition when
 * checkForBingo finds a completed line, and exposes getClosestToWin's
 * result so CloseToWinHint can render the "1 away" nudge. Must be invoked
 * from GameBoard — these were previously dead-code risks per plan review.
 */
export function useBingoDetection(state: GameState, dispatch: Dispatch<GameAction>) {
  useEffect(() => {
    if (state.status !== 'playing' || !state.card) return;

    const winningLine = checkForBingo(state.card);
    if (!winningLine) return;

    // The "winning word" is whichever square in the line was filled most
    // recently — i.e. the word that actually completed the bingo, not just
    // the first square in the line (which is often the pre-filled free
    // space).
    const winningSquares = state.card.squares.flat().filter((sq) => winningLine.squares.includes(sq.id));
    const winningWord = winningSquares.reduce<{ word: string; filledAt: number } | null>((latest, sq) => {
      if (sq.filledAt === null) return latest;
      if (!latest || sq.filledAt > latest.filledAt) return { word: sq.word, filledAt: sq.filledAt };
      return latest;
    }, null);

    dispatch({ type: 'WIN', winningLine, winningWord: winningWord?.word ?? null });
  }, [state.card, state.status, dispatch]);

  const closestToWin: ClosestToWin | null = useMemo(() => {
    if (state.status !== 'playing' || !state.card) return null;
    return getClosestToWin(state.card);
  }, [state.card, state.status]);

  return { closestToWin };
}
