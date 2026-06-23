import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBingoDetection } from '../useBingoDetection';
import { gameReducer, initialGameState } from '../useGame';
import type { GameState } from '../../types';

function startedGame(): GameState {
  return gameReducer(initialGameState, { type: 'START_GAME', categoryId: 'agile' });
}

function fillRow0(state: GameState): GameState {
  const rowIds = ['0-0', '0-1', '0-2', '0-3', '0-4'];
  return rowIds.reduce(
    (s, id) => gameReducer(s, { type: 'TOGGLE_SQUARE', squareId: id }),
    state,
  );
}

describe('useBingoDetection', () => {
  it('does not dispatch WIN while the card has no completed line', () => {
    const dispatch = vi.fn();
    const state = startedGame();

    renderHook(() => useBingoDetection(state, dispatch));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches WIN with the completed winningLine when a row fills', () => {
    const dispatch = vi.fn();
    const state = fillRow0(startedGame());

    renderHook(() => useBingoDetection(state, dispatch));

    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0];
    expect(action.type).toBe('WIN');
    expect(action.winningLine).toEqual({
      type: 'row',
      index: 0,
      squares: ['0-0', '0-1', '0-2', '0-3', '0-4'],
    });
  });

  it('picks the most-recently-filled square in the line as the winning word', () => {
    const dispatch = vi.fn();
    const state = fillRow0(startedGame());

    // TOGGLE_SQUARE calls can land within the same Date.now() millisecond in
    // a fast test run, so assign distinct filledAt values explicitly rather
    // than relying on real-time gaps between dispatches.
    const lastSquare = state.card!.squares[0][4];
    const squares = state.card!.squares.map((row) =>
      row.map((sq) =>
        sq.row === 0 ? { ...sq, filledAt: sq.id === lastSquare.id ? 5000 : 1000 } : sq,
      ),
    );
    const stateWithOrderedTimestamps = { ...state, card: { ...state.card!, squares } };

    renderHook(() => useBingoDetection(stateWithOrderedTimestamps, dispatch));

    const action = dispatch.mock.calls[0][0];
    expect(action.winningWord).toBe(lastSquare.word);
  });

  it('does not dispatch again once status is already won (idempotent)', () => {
    const dispatch = vi.fn();
    const won = gameReducer(fillRow0(startedGame()), {
      type: 'WIN',
      winningLine: { type: 'row', index: 0, squares: ['0-0', '0-1', '0-2', '0-3', '0-4'] },
      winningWord: 'sprint',
    });

    renderHook(() => useBingoDetection(won, dispatch));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('exposes closestToWin from getClosestToWin while playing', () => {
    const dispatch = vi.fn();
    const rowIds = ['0-0', '0-1', '0-2', '0-3'];
    const state = rowIds.reduce(
      (s, id) => gameReducer(s, { type: 'TOGGLE_SQUARE', squareId: id }),
      startedGame(),
    );

    const { result } = renderHook(() => useBingoDetection(state, dispatch));

    expect(result.current.closestToWin).not.toBeNull();
    expect(result.current.closestToWin?.needed).toBe(1);
    expect(result.current.closestToWin?.line).toBe('Row 1');
  });

  it('closestToWin is null once the game has been won', () => {
    const dispatch = vi.fn();
    const won = gameReducer(fillRow0(startedGame()), {
      type: 'WIN',
      winningLine: { type: 'row', index: 0, squares: ['0-0', '0-1', '0-2', '0-3', '0-4'] },
      winningWord: 'sprint',
    });

    const { result } = renderHook(() => useBingoDetection(won, dispatch));
    expect(result.current.closestToWin).toBeNull();
  });
});
