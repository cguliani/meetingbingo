import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameContext } from '../context/GameContext';
import { useBingoDetection } from '../hooks/useBingoDetection';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useToastQueue } from '../hooks/useToastQueue';
import { detectWordsWithAliases } from '../lib/wordDetector';
import { BingoCard } from './BingoCard';
import { TranscriptPanel } from './TranscriptPanel';
import { GameControls } from './GameControls';
import { CloseToWinHint } from './CloseToWinHint';
import { MicPermissionModal } from './MicPermissionModal';
import { ToastQueue } from './ui/ToastQueue';
import type { BingoCard as BingoCardType } from '../types';

export function GameBoard() {
  const { state, dispatch } = useGameContext();
  const { closestToWin } = useBingoDetection(state, dispatch);
  const speech = useSpeechRecognition();
  const { toasts, addToast, dismissToast } = useToastQueue();
  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const hasDecidedMicRef = useRef(false);

  // The speech hook only re-registers its result callback when
  // startListening() is called, so reading `state.card` directly inside that
  // callback would close over a stale card from whenever listening started.
  // A ref keeps it reading the latest card on every transcript chunk.
  const cardRef = useRef<BingoCardType | null>(state.card);
  useEffect(() => {
    cardRef.current = state.card;
  }, [state.card]);

  const handleSpeechResult = useCallback(
    (finalChunk: string) => {
      const card = cardRef.current;
      if (!card) return;

      const alreadyFilled = new Set(
        card.squares
          .flat()
          .filter((sq) => sq.isFilled && !sq.isFreeSpace)
          .map((sq) => sq.word.toLowerCase()),
      );
      const words = detectWordsWithAliases(finalChunk, card.words, alreadyFilled);
      if (words.length === 0) return;

      dispatch({ type: 'AUTO_FILL_WORDS', words });
      words.forEach((word) => addToast(`${word} detected`, 'success'));
    },
    [dispatch, addToast],
  );

  // If the browser stops listening on its own (e.g. permission revoked
  // mid-session), keep the reducer's isListening in sync with reality.
  useEffect(() => {
    if (state.isListening && !speech.isListening && speech.error) {
      dispatch({ type: 'STOP_LISTENING' });
    }
  }, [state.isListening, speech.isListening, speech.error, dispatch]);

  if (!state.card) return null;

  const startActualListening = () => {
    dispatch({ type: 'START_LISTENING' });
    speech.startListening(handleSpeechResult);
  };

  const handleToggleListening = () => {
    if (state.isListening) {
      dispatch({ type: 'STOP_LISTENING' });
      speech.stopListening();
      return;
    }

    if (!hasDecidedMicRef.current) {
      setIsMicModalOpen(true);
      return;
    }

    startActualListening();
  };

  const handleAllowMic = () => {
    hasDecidedMicRef.current = true;
    setIsMicModalOpen(false);
    startActualListening();
  };

  const handleSkipMic = () => {
    hasDecidedMicRef.current = true;
    setIsMicModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Meeting Bingo</h1>
        <span className="text-sm text-gray-500">{state.filledCount}/25 filled</span>
      </div>

      <BingoCard
        card={state.card}
        winningLine={state.winningLine}
        onToggleSquare={(squareId) => dispatch({ type: 'TOGGLE_SQUARE', squareId })}
      />

      <CloseToWinHint closestToWin={closestToWin} />

      <GameControls
        isListening={state.isListening}
        isSpeechSupported={speech.isSupported}
        onNewCard={() => dispatch({ type: 'NEW_CARD' })}
        onToggleListening={handleToggleListening}
      />

      {speech.error && (
        <p role="status" className="mt-2 text-center text-xs text-amber-700">
          {speech.error}
        </p>
      )}

      <TranscriptPanel
        transcript={speech.transcript}
        interimTranscript={speech.interimTranscript}
        detectedWords={state.detectedWords}
        isListening={state.isListening}
      />

      <MicPermissionModal isOpen={isMicModalOpen} onAllow={handleAllowMic} onSkip={handleSkipMic} />
      <ToastQueue toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
