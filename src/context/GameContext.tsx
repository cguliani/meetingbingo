import { createContext, useContext, type Dispatch, type ReactNode } from 'react';
import type { GameState } from '../types';
import { type GameAction, useGame } from '../hooks/useGame';

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useGame();

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
