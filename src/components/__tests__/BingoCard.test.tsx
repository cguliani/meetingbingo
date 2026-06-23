import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BingoCard } from '../BingoCard';
import { generateCard } from '../../lib/cardGenerator';

describe('BingoCard keyboard navigation', () => {
  it('moves focus right across the grid, including onto the free space', () => {
    const card = generateCard('agile');
    render(<BingoCard card={card} winningLine={null} onToggleSquare={() => {}} />);

    const cells = screen.getAllByRole('gridcell');
    const firstButtonInRow2 = cells[10].querySelector('button')!; // row 2, col 0
    firstButtonInRow2.focus();
    expect(document.activeElement).toBe(firstButtonInRow2);

    // Move right twice: col 0 -> col 1 -> col 2 (the free space, index 12).
    fireEvent.keyDown(cells[10], { key: 'ArrowRight' });
    fireEvent.keyDown(cells[11], { key: 'ArrowRight' });

    const freeSpaceButton = cells[12].querySelector('button')!;
    expect(document.activeElement).toBe(freeSpaceButton);

    // And one more step should move off the free space onto col 3, not get
    // stuck there (regression test: the free space used to be a natively
    // `disabled` button, which can never receive focus()).
    fireEvent.keyDown(cells[12], { key: 'ArrowRight' });
    const col3Button = cells[13].querySelector('button')!;
    expect(document.activeElement).toBe(col3Button);
  });

  it('clamps at the grid edges instead of moving focus out of bounds', () => {
    const card = generateCard('agile');
    render(<BingoCard card={card} winningLine={null} onToggleSquare={() => {}} />);

    const cells = screen.getAllByRole('gridcell');
    const topLeft = cells[0].querySelector('button')!;
    topLeft.focus();

    fireEvent.keyDown(cells[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(topLeft);

    fireEvent.keyDown(cells[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(topLeft);
  });
});
