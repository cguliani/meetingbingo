import { describe, it, expect } from 'vitest';
import { gameReducer, initialGameState, MAX_DETECTED_WORDS } from '../useGame';
import type { GameState } from '../../types';

describe('gameReducer', () => {
  it('starts in idle status', () => {
    expect(initialGameState.status).toBe('idle');
  });

  it('GO_TO_SETUP transitions idle -> setup', () => {
    const state = gameReducer(initialGameState, { type: 'GO_TO_SETUP' });
    expect(state.status).toBe('setup');
  });

  it('START_GAME transitions to playing with a generated card and filledCount 1 (free space)', () => {
    const setup = gameReducer(initialGameState, { type: 'GO_TO_SETUP' });
    const playing = gameReducer(setup, { type: 'START_GAME', categoryId: 'agile' });

    expect(playing.status).toBe('playing');
    expect(playing.category).toBe('agile');
    expect(playing.card).not.toBeNull();
    expect(playing.filledCount).toBe(1);
    expect(playing.startedAt).not.toBeNull();
    expect(playing.detectedWords).toEqual([]);
    expect(playing.isListening).toBe(false);
  });

  function startedGame(): GameState {
    return gameReducer(initialGameState, { type: 'START_GAME', categoryId: 'tech' });
  }

  it('TOGGLE_SQUARE fills a non-free square manually (isAutoFilled stays false)', () => {
    const playing = startedGame();
    const target = playing.card!.squares.flat().find((sq) => !sq.isFreeSpace)!;

    const next = gameReducer(playing, { type: 'TOGGLE_SQUARE', squareId: target.id });
    const updated = next.card!.squares.flat().find((sq) => sq.id === target.id)!;

    expect(updated.isFilled).toBe(true);
    expect(updated.isAutoFilled).toBe(false);
    expect(updated.filledAt).not.toBeNull();
    expect(next.filledCount).toBe(2);
  });

  it('TOGGLE_SQUARE on an already-filled square unfills it', () => {
    const playing = startedGame();
    const target = playing.card!.squares.flat().find((sq) => !sq.isFreeSpace)!;

    const filled = gameReducer(playing, { type: 'TOGGLE_SQUARE', squareId: target.id });
    const unfilled = gameReducer(filled, { type: 'TOGGLE_SQUARE', squareId: target.id });
    const updated = unfilled.card!.squares.flat().find((sq) => sq.id === target.id)!;

    expect(updated.isFilled).toBe(false);
    expect(updated.filledAt).toBeNull();
    expect(unfilled.filledCount).toBe(1);
  });

  it('TOGGLE_SQUARE on the free space is a no-op', () => {
    const playing = startedGame();
    const freeSpace = playing.card!.squares.flat().find((sq) => sq.isFreeSpace)!;

    const next = gameReducer(playing, { type: 'TOGGLE_SQUARE', squareId: freeSpace.id });
    expect(next).toBe(playing); // unchanged reference, true no-op
  });

  it('AUTO_FILL_WORDS marks matching squares isFilled + isAutoFilled and records detectedWords', () => {
    const playing = startedGame();
    const target = playing.card!.squares.flat().find((sq) => !sq.isFreeSpace)!;

    const next = gameReducer(playing, { type: 'AUTO_FILL_WORDS', words: [target.word] });
    const updated = next.card!.squares.flat().find((sq) => sq.id === target.id)!;

    expect(updated.isFilled).toBe(true);
    expect(updated.isAutoFilled).toBe(true);
    expect(next.detectedWords).toEqual([target.word]);
    expect(next.filledCount).toBe(2);
  });

  it('AUTO_FILL_WORDS does not re-fill an already-filled square', () => {
    const playing = startedGame();
    const target = playing.card!.squares.flat().find((sq) => !sq.isFreeSpace)!;

    const manuallyFilled = gameReducer(playing, { type: 'TOGGLE_SQUARE', squareId: target.id });
    const next = gameReducer(manuallyFilled, { type: 'AUTO_FILL_WORDS', words: [target.word] });

    // Word already filled manually -> AUTO_FILL_WORDS should be a no-op (unchanged ref)
    expect(next).toBe(manuallyFilled);
  });

  it('detectedWords is capped at the last 5 entries', () => {
    let state = startedGame();
    const words = state.card!.squares.flat().filter((sq) => !sq.isFreeSpace).map((sq) => sq.word);

    for (const word of words.slice(0, 7)) {
      state = gameReducer(state, { type: 'AUTO_FILL_WORDS', words: [word] });
    }

    expect(state.detectedWords).toHaveLength(MAX_DETECTED_WORDS);
    expect(state.detectedWords).toEqual(words.slice(2, 7));
  });

  it('WIN transitions to won with completedAt, winningLine, and winningWord set', () => {
    const playing = startedGame();
    const winningLine = { type: 'row' as const, index: 0, squares: ['0-0', '0-1', '0-2', '0-3', '0-4'] };

    const won = gameReducer(playing, { type: 'WIN', winningLine, winningWord: 'sprint' });
    expect(won.status).toBe('won');
    expect(won.completedAt).not.toBeNull();
    expect(won.winningLine).toEqual(winningLine);
    expect(won.winningWord).toBe('sprint');
  });

  it('WIN is idempotent once already won', () => {
    const playing = startedGame();
    const winningLine = { type: 'row' as const, index: 0, squares: ['0-0', '0-1', '0-2', '0-3', '0-4'] };
    const won = gameReducer(playing, { type: 'WIN', winningLine, winningWord: 'sprint' });
    const wonAgain = gameReducer(won, { type: 'WIN', winningLine, winningWord: 'backlog' });
    expect(wonAgain).toBe(won);
  });

  it('GO_HOME resets fully back to the initial idle state', () => {
    const playing = startedGame();
    const home = gameReducer(playing, { type: 'GO_HOME' });
    expect(home).toEqual(initialGameState);
  });

  it('RESTORE replaces state but forces isListening to false', () => {
    const playing = { ...startedGame(), isListening: true };
    const restored = gameReducer(initialGameState, { type: 'RESTORE', state: playing });
    expect(restored.isListening).toBe(false);
    expect(restored.status).toBe('playing');
    expect(restored.category).toBe(playing.category);
  });

  it('NEW_CARD regenerates the card and resets fill state while keeping the category', () => {
    const playing = startedGame();
    const target = playing.card!.squares.flat().find((sq) => !sq.isFreeSpace)!;
    const filled = gameReducer(playing, { type: 'TOGGLE_SQUARE', squareId: target.id });

    const fresh = gameReducer(filled, { type: 'NEW_CARD' });
    expect(fresh.category).toBe(filled.category);
    expect(fresh.filledCount).toBe(1);
    expect(fresh.detectedWords).toEqual([]);
    expect(fresh.status).toBe('playing');
  });

  it('NEW_CARD is a no-op without a category', () => {
    const next = gameReducer(initialGameState, { type: 'NEW_CARD' });
    expect(next).toBe(initialGameState);
  });
});
