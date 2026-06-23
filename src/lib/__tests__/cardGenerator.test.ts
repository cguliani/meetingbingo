import { describe, it, expect } from 'vitest';
import { generateCard, getCardWords, shuffle } from '../cardGenerator';

describe('cardGenerator', () => {
  describe('generateCard', () => {
    it('returns a 5x5 grid (25 squares)', () => {
      const card = generateCard('agile');
      expect(card.squares).toHaveLength(5);
      card.squares.forEach((row) => expect(row).toHaveLength(5));
    });

    it('pre-fills the center square (row 2, col 2 / flat index 12) as the free space', () => {
      const card = generateCard('agile');
      const flat = card.squares.flat();
      expect(flat).toHaveLength(25);
      const center = flat[12];
      expect(center.row).toBe(2);
      expect(center.col).toBe(2);
      expect(center.isFreeSpace).toBe(true);
      expect(center.isFilled).toBe(true);
      expect(center.filledAt).not.toBeNull();
    });

    it('only the center square is the free space', () => {
      const card = generateCard('agile');
      const freeSpaces = card.squares.flat().filter((sq) => sq.isFreeSpace);
      expect(freeSpaces).toHaveLength(1);
      expect(freeSpaces[0].id).toBe('2-2');
    });

    it('fills all 24 non-center squares with unique words from the category', () => {
      const card = generateCard('agile');
      const nonFreeSquares = card.squares.flat().filter((sq) => !sq.isFreeSpace);
      expect(nonFreeSquares).toHaveLength(24);

      const words = nonFreeSquares.map((sq) => sq.word);
      const uniqueWords = new Set(words);
      expect(uniqueWords.size).toBe(24);

      // Non-free squares start unfilled and not auto-filled
      nonFreeSquares.forEach((sq) => {
        expect(sq.isFilled).toBe(false);
        expect(sq.isAutoFilled).toBe(false);
        expect(sq.filledAt).toBeNull();
      });
    });

    it('throws on an unknown category id', () => {
      // @ts-expect-error intentionally invalid categoryId for the test
      expect(() => generateCard('unknown')).toThrow();
    });

    it('works for all three categories', () => {
      (['agile', 'corporate', 'tech'] as const).forEach((categoryId) => {
        const card = generateCard(categoryId);
        expect(card.words).toHaveLength(24);
      });
    });
  });

  describe('getCardWords', () => {
    it('returns the flat word list used for detection', () => {
      const card = generateCard('tech');
      expect(getCardWords(card)).toBe(card.words);
      expect(getCardWords(card)).toHaveLength(24);
    });
  });

  describe('shuffle', () => {
    it('returns an array with the same elements (not mutating the input)', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = shuffle(input);
      expect(result).toHaveLength(input.length);
      expect([...result].sort()).toEqual([...input].sort());
      expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('does not always return the identity ordering (randomized)', () => {
      const input = Array.from({ length: 30 }, (_, i) => i);
      // Astronomically unlikely all 20 shuffles match identity if truly random
      const anyDifferent = Array.from({ length: 20 }, () => shuffle(input)).some(
        (result) => result.some((value, index) => value !== input[index]),
      );
      expect(anyDifferent).toBe(true);
    });

    it('generating multiple cards for the same category produces different orderings', () => {
      const cards = Array.from({ length: 10 }, () => generateCard('corporate'));
      const serialized = cards.map((c) => c.words.join(','));
      const uniqueOrderings = new Set(serialized);
      // Extremely unlikely all 10 shuffles produced an identical ordering
      expect(uniqueOrderings.size).toBeGreaterThan(1);
    });
  });
});
