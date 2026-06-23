import { useReducer } from 'react';
import type { BingoCard, CategoryId, GameState, WinningLine } from '../types';
import { generateCard } from '../lib/cardGenerator';
import { countFilled } from '../lib/bingoChecker';

export const MAX_DETECTED_WORDS = 5;

export const initialGameState: GameState = {
  status: 'idle',
  category: null,
  card: null,
  isListening: false,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
  filledCount: 0,
  detectedWords: [],
};

export type GameAction =
  | { type: 'GO_TO_SETUP' }
  | { type: 'START_GAME'; categoryId: CategoryId }
  | { type: 'NEW_CARD' }
  | { type: 'TOGGLE_SQUARE'; squareId: string }
  | { type: 'AUTO_FILL_WORDS'; words: string[] }
  | { type: 'START_LISTENING' }
  | { type: 'STOP_LISTENING' }
  | { type: 'WIN'; winningLine: WinningLine; winningWord: string | null }
  | { type: 'GO_HOME' }
  | { type: 'RESTORE'; state: GameState };

function withFilledCount(card: BingoCard): number {
  return countFilled(card);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GO_TO_SETUP':
      return { ...state, status: 'setup' };

    case 'START_GAME': {
      const card = generateCard(action.categoryId);
      return {
        status: 'playing',
        category: action.categoryId,
        card,
        isListening: false,
        startedAt: Date.now(),
        completedAt: null,
        winningLine: null,
        winningWord: null,
        filledCount: withFilledCount(card),
        detectedWords: [],
      };
    }

    case 'NEW_CARD': {
      if (!state.category) return state;
      const card = generateCard(state.category);
      return {
        ...state,
        status: 'playing',
        card,
        startedAt: Date.now(),
        completedAt: null,
        winningLine: null,
        winningWord: null,
        filledCount: withFilledCount(card),
        detectedWords: [],
      };
    }

    case 'TOGGLE_SQUARE': {
      if (!state.card || state.status !== 'playing') return state;

      let changed = false;
      const squares = state.card.squares.map((row) =>
        row.map((sq) => {
          if (sq.id !== action.squareId || sq.isFreeSpace) return sq;
          changed = true;
          const isFilled = !sq.isFilled;
          return {
            ...sq,
            isFilled,
            isAutoFilled: false,
            filledAt: isFilled ? Date.now() : null,
          };
        }),
      );

      if (!changed) return state;

      const card: BingoCard = { ...state.card, squares };
      return { ...state, card, filledCount: withFilledCount(card) };
    }

    case 'AUTO_FILL_WORDS': {
      if (!state.card || state.status !== 'playing' || action.words.length === 0) return state;

      const wordsToFill = new Set(action.words.map((w) => w.toLowerCase()));
      let changed = false;

      const squares = state.card.squares.map((row) =>
        row.map((sq) => {
          if (sq.isFreeSpace || sq.isFilled) return sq;
          if (!wordsToFill.has(sq.word.toLowerCase())) return sq;
          changed = true;
          return { ...sq, isFilled: true, isAutoFilled: true, filledAt: Date.now() };
        }),
      );

      if (!changed) return state;

      const card: BingoCard = { ...state.card, squares };
      const detectedWords = [...state.detectedWords, ...action.words].slice(-MAX_DETECTED_WORDS);

      return { ...state, card, filledCount: withFilledCount(card), detectedWords };
    }

    case 'START_LISTENING':
      return { ...state, isListening: true };

    case 'STOP_LISTENING':
      return { ...state, isListening: false };

    case 'WIN':
      if (state.status === 'won') return state;
      return {
        ...state,
        status: 'won',
        completedAt: Date.now(),
        winningLine: action.winningLine,
        winningWord: action.winningWord,
      };

    case 'GO_HOME':
      return { ...initialGameState };

    case 'RESTORE':
      // Never silently resume listening after a restore — the browser's mic
      // permission/session can't be resumed without the user re-triggering it.
      return { ...action.state, isListening: false };

    default:
      return state;
  }
}

export function useGame() {
  return useReducer(gameReducer, initialGameState);
}
