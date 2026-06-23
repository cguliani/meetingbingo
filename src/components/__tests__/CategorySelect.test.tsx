import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { GameProvider } from '../../context/GameContext';
import { CATEGORIES } from '../../data/categories';
import App from '../../App';

beforeEach(() => {
  // GameProvider persists/restores via localStorage, which otherwise leaks
  // state across tests sharing this file's jsdom window.
  window.localStorage.clear();
});

function renderAtCategorySelect() {
  const utils = render(
    <GameProvider>
      <App />
    </GameProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /new game/i }));
  return utils;
}

describe('CategorySelect', () => {
  it('renders exactly the 3 categories with a word preview each', () => {
    renderAtCategorySelect();
    expect(CATEGORIES).toHaveLength(3);
    for (const category of CATEGORIES) {
      const button = screen.getByRole('button', { name: new RegExp(category.name, 'i') });
      expect(button.textContent).toContain(category.words[0]);
    }
  });

  it('selecting a category starts the game with a generated card', () => {
    renderAtCategorySelect();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(CATEGORIES[0].name, 'i') }));
    // GameBoard renders the 5x5 grid (25 gridcells) once a card exists.
    expect(screen.getByRole('grid', { name: /bingo card/i })).toBeTruthy();
    expect(screen.getAllByRole('gridcell')).toHaveLength(25);
  });

  it('"Back" returns to the landing page', () => {
    renderAtCategorySelect();
    fireEvent.click(screen.getByRole('button', { name: '← Back' }));
    expect(screen.getByRole('heading', { name: /meeting bingo/i })).toBeTruthy();
  });
});
