import { createContext, useContext, useEffect, useRef, type Dispatch, type ReactNode } from 'react';
import type { GameState } from '../types';
import { type GameAction, isValidGameState, useGame } from '../hooks/useGame';
import { readLocalStorageValue, writeLocalStorageValue } from '../hooks/useLocalStorage';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

const STORAGE_KEY = 'meeting-bingo:game-state';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useGame();
  const hasRestoredRef = useRef(false);

  // Restore once on mount. RESTORE always forces isListening false, so mic
  // access is never silently re-requested after a refresh.
  useEffect(() => {
    hasRestoredRef.current = true;
    const persisted = readLocalStorageValue<unknown>(STORAGE_KEY, null);
    if (isValidGameState(persisted) && persisted.status !== 'idle') {
      dispatch({ type: 'RESTORE', state: persisted });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change. Starting a new game / new card overwrites any
  // stale "won" entry automatically, since this runs on every state change.
  useEffect(() => {
    if (!hasRestoredRef.current) return;
    writeLocalStorageValue(STORAGE_KEY, state);
  }, [state]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

/**
 * Single source of truth for GameState. Components must read/derive game
 * data from here rather than holding parallel local useState.
 */
export function useGameContext(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
