import type { BingoSquare, GameState } from '../types';
import { CATEGORIES } from '../data/categories';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function squareSymbol(square: BingoSquare): string {
  if (square.isFreeSpace) return '⭐';
  if (square.isAutoFilled) return '✨';
  if (square.isFilled) return '✓';
  return '·';
}

/**
 * Builds the post-win share text. Per UXR Scene 9, the shared text itself
 * (not just the on-screen card) must distinguish auto- vs. manually-filled
 * squares, so the legend/symbols carry that distinction along with it.
 */
export function formatShareText(game: GameState): string {
  if (!game.card) return '';

  const categoryName =
    CATEGORIES.find((c) => c.id === game.category)?.name ?? game.category ?? 'Unknown';
  const timeToBingo =
    game.startedAt !== null && game.completedAt !== null
      ? formatDuration(game.completedAt - game.startedAt)
      : 'unknown';

  const grid = game.card.squares.map((row) => row.map(squareSymbol).join(' ')).join('\n');

  const lines = [
    '🎯 Meeting Bingo — BINGO!',
    `Category: ${categoryName}`,
    game.winningWord ? `Winning word: "${game.winningWord}"` : null,
    `Time to bingo: ${timeToBingo}`,
    `Squares filled: ${game.filledCount}/25`,
    '',
    grid,
    '',
    '✨ auto-detected · ✓ tapped manually · ⭐ free space',
  ].filter((line): line is string => line !== null);

  return lines.join('\n');
}

export type ShareResult =
  | { method: 'webshare'; success: true }
  | { method: 'clipboard'; success: boolean };

/**
 * Tries the Web Share API first (mobile), falling back to the Clipboard
 * API. This only ever produces a static text summary — there is no
 * "join game" link, per the explicit out-of-scope boundary.
 */
export async function shareResult(game: GameState): Promise<ShareResult> {
  const text = formatShareText(game);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text, title: 'Meeting Bingo' });
      return { method: 'webshare', success: true };
    } catch {
      // User cancelled the native share sheet, or it failed — fall through
      // to clipboard so the action isn't a dead end.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return { method: 'clipboard', success: true };
    } catch {
      return { method: 'clipboard', success: false };
    }
  }

  return { method: 'clipboard', success: false };
}
