import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GameProvider } from '../../context/GameContext';
import App from '../../App';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

beforeEach(() => {
  window.localStorage.clear();
  window.SpeechRecognition = MockSpeechRecognition as unknown as typeof window.SpeechRecognition;
  window.webkitSpeechRecognition = undefined;
});

function renderAtGameBoard() {
  const utils = render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /new game/i }));
  fireEvent.click(screen.getByRole('button', { name: /agile/i }));
  return utils;
}

describe('GameBoard mic permission flow', () => {
  it('shows the MicPermissionModal before requesting the mic on first Start Listening', () => {
    renderAtGameBoard();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /start listening/i }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/processed entirely in your browser/i)).toBeTruthy();
  });

  it('does not show the modal again after the user has already decided once', () => {
    renderAtGameBoard();
    fireEvent.click(screen.getByRole('button', { name: /start listening/i }));
    fireEvent.click(screen.getByRole('button', { name: /skip/i }));
    expect(screen.queryByRole('dialog')).toBeNull();

    // Still "Start Listening" since skipping doesn't start the mic — but the
    // modal must not reappear on this second click within the same session.
    fireEvent.click(screen.getByRole('button', { name: /start listening/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('starts the underlying recognition only after "Allow & Listen"', () => {
    renderAtGameBoard();
    fireEvent.click(screen.getByRole('button', { name: /start listening/i }));
    fireEvent.click(screen.getByRole('button', { name: /allow.*listen/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: /stop listening/i })).toBeTruthy();
  });
});
