import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { GameProvider } from '../../context/GameContext';
import App from '../../App';

beforeEach(() => {
  window.localStorage.clear();
  // No SpeechRecognition in this jsdom test environment by default — these
  // tests exercise manual fill / win / hint behavior, not live speech.
  window.SpeechRecognition = undefined;
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

function getGridCells() {
  return screen.getAllByRole('gridcell');
}

describe('GameBoard', () => {
  it('renders a 5x5 grid with the free space pre-filled and distinct', () => {
    renderAtGameBoard();
    const cells = getGridCells();
    expect(cells).toHaveLength(25);

    const freeSpaceButton = within(cells[12]).getByRole('button');
    expect(freeSpaceButton.getAttribute('aria-pressed')).toBe('true');
    expect((freeSpaceButton as HTMLButtonElement).disabled).toBe(true);
    expect(freeSpaceButton.textContent).toContain('FREE');
  });

  it('manually filling a non-free square toggles it on and off', () => {
    renderAtGameBoard();
    const cells = getGridCells();
    const button = within(cells[0]).getByRole('button');

    expect(button.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking the free space is a no-op', () => {
    renderAtGameBoard();
    const cells = getGridCells();
    const freeSpaceButton = within(cells[12]).getByRole('button');
    fireEvent.click(freeSpaceButton);
    expect(freeSpaceButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows the "1 away" hint once a line is one square from completing', () => {
    renderAtGameBoard();
    const cells = getGridCells();
    // Row 0 is cells[0..4]; fill 4 of them, leaving one missing.
    [0, 1, 2, 3].forEach((i) => fireEvent.click(within(cells[i]).getByRole('button')));

    expect(screen.getByText(/1 away/i)).toBeTruthy();
  });

  it('triggers the win screen transition when a full line is filled', () => {
    renderAtGameBoard();
    const cells = getGridCells();
    [0, 1, 2, 3, 4].forEach((i) => fireEvent.click(within(cells[i]).getByRole('button')));

    expect(screen.getByText(/win screen coming soon/i)).toBeTruthy();
  });

  it('"New Card" resets the fill state', () => {
    renderAtGameBoard();
    let cells = getGridCells();
    fireEvent.click(within(cells[0]).getByRole('button'));
    expect(within(cells[0]).getByRole('button').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /new card/i }));
    cells = getGridCells();
    // Every non-free square should now be unfilled again.
    const filledCount = cells.filter(
      (cell) => within(cell).getByRole('button').getAttribute('aria-pressed') === 'true',
    ).length;
    expect(filledCount).toBe(1); // only the free space
  });

  it('disables Start Listening when speech recognition is unsupported', () => {
    renderAtGameBoard();
    const button = screen.getByRole('button', { name: /start listening/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
