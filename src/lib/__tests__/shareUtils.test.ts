import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatDuration, formatShareText, shareResult } from '../shareUtils';
import { generateCard } from '../cardGenerator';
import type { GameState } from '../../types';

function wonGameState(): GameState {
  const card = generateCard('agile');
  // Manually fill one square, auto-fill another, leave the rest unfilled.
  const manualSquare = card.squares.flat().find((sq) => !sq.isFreeSpace)!;
  const autoSquare = card.squares.flat().find((sq) => !sq.isFreeSpace && sq.id !== manualSquare.id)!;
  manualSquare.isFilled = true;
  manualSquare.filledAt = 1000;
  autoSquare.isFilled = true;
  autoSquare.isAutoFilled = true;
  autoSquare.filledAt = 2000;

  return {
    status: 'won',
    category: 'agile',
    card,
    isListening: false,
    startedAt: 0,
    completedAt: 134_000,
    winningLine: { type: 'row', index: 0, squares: [] },
    winningWord: autoSquare.word,
    filledCount: 3,
    detectedWords: [autoSquare.word],
  };
}

describe('formatDuration', () => {
  it('formats whole minutes and seconds', () => {
    expect(formatDuration(134_000)).toBe('2m 14s');
  });

  it('pads single-digit seconds', () => {
    expect(formatDuration(65_000)).toBe('1m 05s');
  });

  it('floors negative/zero durations to 0m 00s', () => {
    expect(formatDuration(-500)).toBe('0m 00s');
    expect(formatDuration(0)).toBe('0m 00s');
  });
});

describe('formatShareText', () => {
  it('includes category, winning word, time to bingo, and squares filled', () => {
    const game = wonGameState();
    const text = formatShareText(game);
    expect(text).toContain('Agile & Scrum');
    expect(text).toContain('Time to bingo: 2m 14s');
    expect(text).toContain('Squares filled: 3/25');
    expect(text).toContain(`Winning word: "${game.winningWord}"`);
  });

  it('distinguishes auto-filled (✨), manually-filled (✓), and free space (⭐) in the grid', () => {
    const text = formatShareText(wonGameState());
    expect(text).toContain('✨');
    expect(text).toContain('✓');
    expect(text).toContain('⭐');
    expect(text).toContain('auto-detected');
    expect(text).toContain('tapped manually');
  });

  it('returns an empty string when there is no card', () => {
    expect(formatShareText({ ...wonGameState(), card: null })).toBe('');
  });
});

describe('shareResult', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    navigator.share = share;

    const result = await shareResult(wonGameState());
    expect(share).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ method: 'webshare', success: true });
  });

  it('falls back to the Clipboard API when Web Share is unavailable', async () => {
    // @ts-expect-error test-only stub
    navigator.share = undefined;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const game = wonGameState();
    const result = await shareResult(game);
    expect(writeText).toHaveBeenCalledWith(formatShareText(game));
    expect(result).toEqual({ method: 'clipboard', success: true });
  });

  it('falls back to clipboard if the user cancels the native share sheet', async () => {
    const share = vi.fn().mockRejectedValue(new Error('AbortError'));
    navigator.share = share;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await shareResult(wonGameState());
    expect(result).toEqual({ method: 'clipboard', success: true });
  });

  it('reports failure gracefully when neither API is available', async () => {
    // @ts-expect-error test-only stub
    navigator.share = undefined;
    Object.assign(navigator, { clipboard: undefined });

    const result = await shareResult(wonGameState());
    expect(result).toEqual({ method: 'clipboard', success: false });
  });
});
