import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { GameProvider, useGameContext } from '../GameContext';
import { initialGameState } from '../../hooks/useGame';
import type { GameState } from '../../types';

const STORAGE_KEY = 'meeting-bingo:game-state';

function TestConsumer() {
  const { state, dispatch } = useGameContext();
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="category">{state.category ?? 'none'}</span>
      <span data-testid="listening">{String(state.isListening)}</span>
      <button onClick={() => dispatch({ type: 'GO_TO_SETUP' })}>setup</button>
      <button onClick={() => dispatch({ type: 'START_GAME', categoryId: 'agile' })}>start</button>
      <button onClick={() => dispatch({ type: 'TOGGLE_SQUARE', squareId: '0-0' })}>toggle</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <GameProvider>
      <TestConsumer />
    </GameProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('GameProvider persistence', () => {
  it('starts idle with no persisted data (no crash on first-ever load)', () => {
    renderWithProvider();
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('falls back gracefully to idle when localStorage data is corrupted', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not valid json {{{');
    expect(() => renderWithProvider()).not.toThrow();
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('falls back gracefully when localStorage holds an incompatible/malformed shape', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(() => renderWithProvider()).not.toThrow();
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('restores a persisted in-progress game on mount', () => {
    const persisted: GameState = {
      ...initialGameState,
      status: 'playing',
      category: 'tech',
      card: {
        squares: Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => ({
            id: `${row}-${col}`,
            word: row === 2 && col === 2 ? 'FREE' : `word-${row}-${col}`,
            isFilled: row === 2 && col === 2,
            isAutoFilled: false,
            isFreeSpace: row === 2 && col === 2,
            filledAt: row === 2 && col === 2 ? 1000 : null,
            row,
            col,
          })),
        ),
        words: [],
      },
      filledCount: 1,
      isListening: true, // intentionally persisted as listening
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));

    renderWithProvider();

    expect(screen.getByTestId('status').textContent).toBe('playing');
    expect(screen.getByTestId('category').textContent).toBe('tech');
    // Listening must NOT be silently resumed after restore.
    expect(screen.getByTestId('listening').textContent).toBe('false');
  });

  it('persists state changes to localStorage as the game progresses', () => {
    renderWithProvider();

    act(() => screen.getByText('setup').click());
    act(() => screen.getByText('start').click());

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.status).toBe('playing');
    expect(stored.category).toBe('agile');
  });

  it('overwrites a stale persisted "won" state once a new game starts', () => {
    const wonState: GameState = {
      ...initialGameState,
      status: 'won',
      category: 'agile',
      completedAt: 12345,
      winningWord: 'sprint',
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wonState));

    renderWithProvider();
    expect(screen.getByTestId('status').textContent).toBe('won');

    act(() => screen.getByText('start').click());

    expect(screen.getByTestId('status').textContent).toBe('playing');
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.status).toBe('playing');
  });
});
