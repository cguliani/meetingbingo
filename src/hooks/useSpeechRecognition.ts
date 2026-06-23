import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpeechRecognitionState } from '../types';

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | undefined {
  return typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;
}

function describeSpeechError(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. You can still tap squares manually.';
    case 'no-speech':
      return 'No speech detected. You can still tap squares manually, or start listening again.';
    case 'audio-capture':
      return 'No microphone was found. You can still tap squares manually.';
    case 'network':
      return 'A network error interrupted speech recognition.';
    default:
      return `Speech recognition error: ${error}`;
  }
}

/**
 * Wraps window.SpeechRecognition / webkitSpeechRecognition.
 *
 * Auto-restart guard: `isListeningRef` (a ref, not state, so the `onend`
 * closure always reads the latest value) is the single source of truth for
 * whether the browser should keep listening. It is cleared on manual stop,
 * unmount, AND on `onerror` (e.g. permission revoked mid-session) — not just
 * manual stop — to prevent `onend` from firing after one of those events and
 * immediately re-requesting the microphone (a restart-loop race condition).
 */
export function useSpeechRecognition() {
  const [state, setState] = useState<SpeechRecognitionState>(() => {
    const isSupported = !!getSpeechRecognitionConstructor();
    return {
      isSupported,
      isListening: false,
      transcript: '',
      interimTranscript: '',
      error: isSupported
        ? null
        : 'Speech recognition is not supported in this browser. Try Chrome, or use manual tap-to-fill.',
    };
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const onResultCallback = useRef<((transcript: string) => void) | null>(null);

  useEffect(() => {
    const SpeechRecognitionImpl = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: prev.transcript + final,
        interimTranscript: interim,
      }));

      if (final && onResultCallback.current) {
        onResultCallback.current(final);
      }
    };

    recognition.onerror = (event) => {
      // Guard: stop auto-restart on any error (e.g. permission revoked).
      isListeningRef.current = false;
      setState((prev) => ({
        ...prev,
        isListening: false,
        error: describeSpeechError(event.error),
      }));
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // Already running; ignore.
        }
      } else {
        setState((prev) => ({ ...prev, isListening: false }));
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // Guard: stop auto-restart on unmount, then detach handlers before
      // stopping so a late-firing onend can't restart a torn-down instance.
      isListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  const startListening = useCallback((onResult?: (transcript: string) => void) => {
    if (!recognitionRef.current) return;

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition requires HTTPS (or localhost). You can still tap squares manually.',
      }));
      return;
    }

    onResultCallback.current = onResult ?? null;
    isListeningRef.current = true;

    setState((prev) => ({
      ...prev,
      isListening: true,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));

    try {
      recognitionRef.current.start();
    } catch {
      // Already running; ignore.
    }
  }, []);

  const stopListening = useCallback(() => {
    // Guard: manual stop — must clear before calling .stop() so the
    // resulting onend doesn't restart the mic.
    isListeningRef.current = false;
    setState((prev) => ({ ...prev, isListening: false }));
    recognitionRef.current?.stop();
    onResultCallback.current = null;
  }, []);

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}
