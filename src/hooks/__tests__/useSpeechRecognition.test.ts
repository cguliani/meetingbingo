import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSpeechRecognition } from '../useSpeechRecognition';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn();

  static instances: MockSpeechRecognition[] = [];

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }
}

beforeEach(() => {
  MockSpeechRecognition.instances = [];
  // @ts-expect-error test-only global stub
  window.SpeechRecognition = MockSpeechRecognition;
  // @ts-expect-error test-only global stub
  window.webkitSpeechRecognition = MockSpeechRecognition;
});

describe('useSpeechRecognition', () => {
  it('reports isSupported true when SpeechRecognition exists on window', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('configures the recognition instance with continuous + interimResults', () => {
    renderHook(() => useSpeechRecognition());
    const instance = MockSpeechRecognition.instances[0];
    expect(instance.continuous).toBe(true);
    expect(instance.interimResults).toBe(true);
  });

  it('does NOT restart the mic after a manual stop (no restart-loop regression)', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const instance = MockSpeechRecognition.instances[0];

    act(() => result.current.startListening());
    expect(instance.start).toHaveBeenCalledTimes(1);

    act(() => result.current.stopListening());
    // stop() synchronously fires onend in this mock, simulating the browser.
    expect(instance.start).toHaveBeenCalledTimes(1); // not called again
    expect(result.current.isListening).toBe(false);
  });

  it('auto-restarts onend while still supposed to be listening', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const instance = MockSpeechRecognition.instances[0];

    act(() => result.current.startListening());
    expect(instance.start).toHaveBeenCalledTimes(1);

    // Simulate the browser ending the session on its own (e.g. a pause),
    // without the user calling stopListening.
    act(() => instance.onend?.());
    expect(instance.start).toHaveBeenCalledTimes(2);
  });

  it('does not restart after onerror fires (e.g. permission revoked mid-session)', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    const instance = MockSpeechRecognition.instances[0];

    act(() => result.current.startListening());
    expect(instance.start).toHaveBeenCalledTimes(1);

    act(() => instance.onerror?.({ error: 'not-allowed' }));
    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toMatch(/denied/i);

    // The browser may still fire onend right after onerror; it must not
    // trigger another start() call.
    act(() => instance.onend?.());
    expect(instance.start).toHaveBeenCalledTimes(1);
  });

  it('does not restart after unmount', () => {
    const { result, unmount } = renderHook(() => useSpeechRecognition());
    const instance = MockSpeechRecognition.instances[0];

    act(() => result.current.startListening());
    expect(instance.start).toHaveBeenCalledTimes(1);

    unmount(); // calls recognition.stop(), which fires onend in this mock
    expect(instance.start).toHaveBeenCalledTimes(1);
  });

  it('reports isSupported false and a helpful error when the API is unavailable', () => {
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;

    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(false);
    expect(result.current.error).toMatch(/not supported/i);
  });
});
