import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GameProvider } from '../../context/GameContext';
import App from '../../App';

beforeEach(() => {
  // GameProvider persists/restores via localStorage, which otherwise leaks
  // state across tests sharing this file's jsdom window.
  window.localStorage.clear();
});

function renderApp() {
  return render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
}

describe('LandingPage', () => {
  it('renders the hero, privacy note, and how-it-works section', () => {
    renderApp();
    // getByRole/getByText throw if the element isn't found, so a
    // successful query is itself the assertion.
    expect(screen.getByRole('heading', { name: /meeting bingo/i })).toBeTruthy();
    expect(screen.getByText(/processed entirely in your browser/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeTruthy();
  });

  it('clicking "New Game" transitions to category selection', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(screen.getByRole('heading', { name: /choose a category/i })).toBeTruthy();
  });
});
