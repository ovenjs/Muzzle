/**
 * Default matching strategy implementation
 *
 * This module provides the default implementation of the MatchingStrategy interface.
 * It supports both simple string matching and regular expression matching with
 * options for case sensitivity and whole word matching.
 *
 * @module DefaultMatchingStrategy
 */

import { MatchingStrategy, TextFilterOptions, MatchPosition } from '../../types';

/**
 * Default implementation of the matching strategy.
 *
 * This class provides flexible pattern matching capabilities with support for:
 * - Simple string matching
 * - Regular expression matching
 * - Case-sensitive and case-insensitive matching
 * - Whole word matching
 *
 * The strategy is designed to be used by the TextFilter class to find matches
 * of patterns in text according to the specified options.
 *
 * @example
 * ```typescript
 * const strategy = new DefaultMatchingStrategy();
 * const matches = strategy.match(
 *   "This is a test string with bad words",
 *   "bad",
 *   { caseSensitive: false, wholeWord: true }
 * );
 * console.log(matches); // [{ start: 23, end: 26 }]
 * ```
 */
export class DefaultMatchingStrategy implements MatchingStrategy {
  /**
   * Find all matches of a pattern in text.
   *
   * This method searches for all occurrences of a pattern within the given text,
   * applying the specified options such as case sensitivity, whole word matching,
   * and regular expression matching.
   *
   * @param text - The text to search within
   * @param pattern - The pattern to search for
   * @param options - Options for controlling the matching behavior
   * @returns Array of MatchPosition objects representing the start and end indices of each match
   * @example
   * ```typescript
   * const matches = strategy.match(
   *   "This is a test string with bad words",
   *   "bad",
   *   { caseSensitive: false, wholeWord: true }
   * );
   * console.log(matches); // [{ start: 23, end: 26 }]
   * ```
   */
  match(text: string, pattern: string, options: TextFilterOptions): MatchPosition[] {
    const matches: MatchPosition[] = [];

    if (!text || !pattern) {
      return matches;
    }

    // Apply options
    const caseSensitive = options.caseSensitive || false;
    const wholeWord = options.wholeWord || false;
    const useRegex = options.useRegex || false;

    // Prepare text and pattern based on case sensitivity
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

    if (useRegex) {
      // Regex matching
      try {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(searchPattern, flags);
        let match;

        while ((match = regex.exec(text)) !== null) {
          // Check whole word constraint if enabled
          if (wholeWord && !this.isWholeWord(text, match.index, match[0].length)) {
            continue;
          }

          matches.push({
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      } catch (error) {
        // Invalid regex, fall back to simple string matching
        console.warn('Invalid regex pattern, falling back to simple matching:', error);
        return this.simpleMatch(searchText, searchPattern, text, wholeWord);
      }
    } else {
      // Simple string matching
      return this.simpleMatch(searchText, searchPattern, text, wholeWord);
    }

    return matches;
  }

  /**
   * Simple string matching implementation.
   *
   * This private method implements simple string matching with optional
   * whole word constraint. It searches for all occurrences of the pattern
   * in the text and returns their positions.
   *
   * @param searchText - The text to search within (already case-normalized)
   * @param searchPattern - The pattern to search for (already case-normalized)
   * @param originalText - The original text with original case
   * @param wholeWord - Whether to enforce whole word matching
   * @returns Array of MatchPosition objects representing the start and end indices of each match
   */
  private simpleMatch(
    searchText: string,
    searchPattern: string,
    originalText: string,
    wholeWord: boolean
  ): MatchPosition[] {
    const matches: MatchPosition[] = [];
    let index = 0;

    while (index < searchText.length) {
      const foundIndex = searchText.indexOf(searchPattern, index);

      if (foundIndex === -1) {
        break;
      }

      // Check whole word constraint if enabled
      if (wholeWord && !this.isWholeWord(originalText, foundIndex, searchPattern.length)) {
        index = foundIndex + 1;
        continue;
      }

      matches.push({
        start: foundIndex,
        end: foundIndex + searchPattern.length,
      });

      index = foundIndex + searchPattern.length;
    }

    return matches;
  }

  /**
   * Check if a match is a whole word.
   *
   * This private method checks if a match at the given position in the text
   * is a whole word by verifying that it is bounded by non-word characters
   * or the start/end of the text.
   *
   * @param text - The text containing the match
   * @param index - The starting index of the match
   * @param length - The length of the match
   * @returns True if the match is a whole word, false otherwise
   */
  private isWholeWord(text: string, index: number, length: number): boolean {
    const start = index;
    const end = index + length;

    // Check start boundary
    let isStartBoundary = start === 0;
    if (!isStartBoundary && start > 0) {
      const charBefore = text[start - 1];
      if (charBefore) {
        isStartBoundary = !this.isWordChar(charBefore);
      }
    }

    // Check end boundary
    let isEndBoundary = end === text.length;
    if (!isEndBoundary && end < text.length) {
      const charAfter = text[end];
      if (charAfter) {
        isEndBoundary = !this.isWordChar(charAfter);
      }
    }

    return isStartBoundary && isEndBoundary;
  }

  /**
   * Check if a character is a word character.
   *
   * This private method determines if a character is considered a word character
   * (alphanumeric or underscore) for the purpose of whole word matching.
   *
   * @param char - The character to check
   * @returns True if the character is a word character, false otherwise
   */
  private isWordChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }
}
