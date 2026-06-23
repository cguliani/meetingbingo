import { describe, it, expect } from 'vitest';
import { detectWords, detectWordsWithAliases, WORD_ALIASES } from '../wordDetector';

describe('wordDetector', () => {
  describe('detectWords', () => {
    it('matches a single word on a word boundary', () => {
      const result = detectWords("we're in a sprint now", ['sprint']);
      expect(result).toEqual(['sprint']);
    });

    it('is case-insensitive', () => {
      const result = detectWords('Let us discuss the SPRINT plan', ['sprint']);
      expect(result).toEqual(['sprint']);
    });

    it('tolerates trailing punctuation adjacent to the word', () => {
      const result = detectWords('Are we still on sprint?', ['sprint']);
      expect(result).toEqual(['sprint']);
    });

    it('does not false-positive match a short word inside a longer unrelated word', () => {
      // "CI" must not match inside "social"
      const result = detectWords('this is a social platform', ['CI']);
      expect(result).toEqual([]);
    });

    it('does not match a word as a mid-word substring (word boundary guard)', () => {
      const result = detectWords('the scrummy snack was good', ['scrum']);
      expect(result).toEqual([]);
    });

    it('matches a multi-word phrase via substring match', () => {
      const result = detectWords('lets have a quick stand up before lunch', ['stand up']);
      expect(result).toEqual(['stand up']);
    });

    it('matches multiple distinct words within one transcript chunk', () => {
      const result = detectWords(
        'the sprint backlog needs refinement before the demo',
        ['sprint', 'backlog', 'refinement', 'demo', 'velocity'],
      );
      expect(result).toEqual(['sprint', 'backlog', 'refinement', 'demo']);
    });

    it('skips words already in the alreadyFilled set', () => {
      const result = detectWords(
        'sprint and backlog both came up',
        ['sprint', 'backlog'],
        new Set(['sprint']),
      );
      expect(result).toEqual(['backlog']);
    });

    it('matches CI and CD independently and consistently when both are on the card', () => {
      const result = detectWords('our ci-cd pipeline is broken', ['CI', 'CD']);
      expect(result).toEqual(['CI', 'CD']);
    });

    it('matches a word containing a slash (e.g. CI/CD) literally', () => {
      const result = detectWords('we automated our ci/cd pipeline', ['CI/CD']);
      expect(result).toEqual(['CI/CD']);
    });

    it('returns an empty array when nothing matches', () => {
      const result = detectWords('totally unrelated chatter', ['sprint', 'backlog']);
      expect(result).toEqual([]);
    });
  });

  describe('detectWordsWithAliases', () => {
    it('resolves an alias back to the canonical card word', () => {
      const result = detectWordsWithAliases(
        'we should ship the minimum viable product first',
        ['MVP'],
      );
      expect(result).toEqual(['MVP']);
    });

    it('still matches the canonical word directly without needing an alias', () => {
      const result = detectWordsWithAliases('lets discuss the mvp scope', ['MVP']);
      expect(result).toEqual(['MVP']);
    });

    it('does not double-report a word matched both directly and via alias', () => {
      const result = detectWordsWithAliases(
        'the mvp is also the minimum viable product',
        ['MVP'],
      );
      expect(result).toEqual(['MVP']);
    });

    it('resolves the CI/CD alias from "continuous integration"', () => {
      const result = detectWordsWithAliases(
        'we invested heavily in continuous integration',
        ['CI/CD'],
      );
      expect(result).toEqual(['CI/CD']);
    });

    it('skips alias resolution for words already filled', () => {
      const result = detectWordsWithAliases(
        'the minimum viable product shipped',
        ['MVP'],
        new Set(['mvp']),
      );
      expect(result).toEqual([]);
    });

    it('has alias entries keyed in lowercase matching known card words', () => {
      expect(Object.keys(WORD_ALIASES)).toEqual(
        expect.arrayContaining(['ci/cd', 'mvp', 'roi', 'api', 'devops']),
      );
    });
  });
});
