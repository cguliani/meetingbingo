import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { GameProvider } from '../../context/GameContext';
import App from '../../App';

const confettiMock = vi.fn();
vi.mock('canvas-confetti', () => ({ default: (...args: unknown[]) => confettiMock(...args) }));

beforeEach(() => {
  window.localStorage.clear();
  window.SpeechRecognition = undefined;
  window.webkitSpeechRecognition = undefined;
  confettiMock.mockClear();
});

function renderAndWin() {
  const utils = render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /new game/i }));
  fireEvent.click(screen.getByRole('button', { name: /agile/i }));
  const cells = screen.getAllByRole('gridcell');
  [0, 1, 2, 3, 4].forEach((i) => fireEvent.click(within(cells[i]).getByRole('button')));
  return utils;
}

describe('WinScreen', () => {
  it('fires confetti on mount when motion is not reduced', () => {
    renderAndWin();
    expect(confettiMock).toHaveBeenCalledTimes(1);
  });

  it('skips confetti when prefers-reduced-motion is set', () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    renderAndWin();
    expect(confettiMock).not.toHaveBeenCalled();
  });

  it('shows category, time to bingo, winning word, and squares filled stats', () => {
    renderAndWin();
    expect(screen.getByText(/agile & scrum/i)).toBeTruthy();
    expect(screen.getByText(/time to bingo/i)).toBeTruthy();
    expect(screen.getByText(/squares filled/i)).toBeTruthy();
    expect(screen.getByText('6/25')).toBeTruthy(); // row 0 (5) + the pre-filled free space
  });

  it('highlights the winning line on the displayed card', () => {
    renderAndWin();
    const cells = screen.getAllByRole('gridcell');
    const winningButton = within(cells[0]).getByRole('button');
    expect(winningButton.className).toContain('ring-yellow-400');
  });

  it('"Play Again" returns to the game screen with a fresh card', () => {
    renderAndWin();
    fireEvent.click(screen.getByRole('button', { name: /play again/i }));
    expect(screen.getByRole('grid', { name: /bingo card/i })).toBeTruthy();
    const filledCount = screen
      .getAllByRole('gridcell')
      .filter((cell) => within(cell).getByRole('button').getAttribute('aria-pressed') === 'true').length;
    expect(filledCount).toBe(1); // only the free space, on the new card
  });

  it('"Home" returns to the landing page', () => {
    renderAndWin();
    fireEvent.click(screen.getByRole('button', { name: /^home$/i }));
    expect(screen.getByRole('heading', { name: /meeting bingo/i })).toBeTruthy();
  });

  it('calls shareResult (Clipboard fallback) when "Share result" is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    // @ts-expect-error test-only stub
    navigator.share = undefined;

    renderAndWin();
    fireEvent.click(screen.getByRole('button', { name: /share result/i }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('BINGO!');
  });
});
