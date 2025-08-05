/**
 * Default matching strategy implementation
 */

import { MatchingStrategy, TextFilterOptions, MatchPosition } from '../../types';

/**
 * Default implementation of the matching strategy
 */
export class DefaultMatchingStrategy implements MatchingStrategy {
  /**
   * Find all matches of a pattern in text
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
   * Simple string matching implementation
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
   * Check if a match is a whole word
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
   * Check if a character is a word character
   */
  private isWordChar(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }
}
