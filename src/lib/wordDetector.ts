/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .trim();
}

/**
 * Check if transcript contains any card words.
 * Returns the array of detected words (in their original card casing).
 */
export function detectWords(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string> = new Set(),
): string[] {
  const normalizedTranscript = normalizeText(transcript);
  const detected: string[] = [];

  for (const word of cardWords) {
    // Skip already filled words
    if (alreadyFilled.has(word.toLowerCase())) continue;

    const normalizedWord = normalizeText(word);

    // Handle multi-word phrases
    if (normalizedWord.includes(' ')) {
      // Direct substring match for phrases
      if (normalizedTranscript.includes(normalizedWord)) {
        detected.push(word);
      }
    } else {
      // Word boundary match for single words
      const regex = new RegExp(`\\b${escapeRegex(normalizedWord)}\\b`, 'i');
      if (regex.test(normalizedTranscript)) {
        detected.push(word);
      }
    }
  }

  return detected;
}

/**
 * Common variations/synonyms mapping
 */
export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration'],
  mvp: ['minimum viable product', 'm.v.p.'],
  roi: ['return on investment', 'r.o.i.'],
  api: ['a.p.i.', 'interface'],
  devops: ['dev ops', 'dev-ops'],
};

/**
 * Enhanced detection with aliases
 */
export function detectWordsWithAliases(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string> = new Set(),
): string[] {
  const detected = detectWords(transcript, cardWords, alreadyFilled);
  const normalizedTranscript = normalizeText(transcript);

  // Check for aliases
  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    if (detected.includes(word)) continue;

    const aliases = WORD_ALIASES[word.toLowerCase()];
    if (aliases) {
      for (const alias of aliases) {
        if (normalizedTranscript.includes(alias)) {
          detected.push(word);
          break;
        }
      }
    }
  }

  return detected;
}
