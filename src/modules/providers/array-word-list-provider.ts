/**
 * Array word list provider implementation
 *
 * This module provides a WordListProvider implementation for array-based word lists.
 * It supports arrays containing simple strings, parameterized word definition strings,
 * and pre-defined ParameterizedWord objects.
 *
 * @module ArrayWordListProvider
 */

import { WordListProvider, BannedWordsSource, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for array-based word lists with parameter support.
 *
 * This provider handles word lists provided as arrays, which can contain:
 * - Simple word strings
 * - Parameterized word definition strings (e.g., "badword[severity=high]")
 * - Pre-defined ParameterizedWord objects
 *
 * The provider processes each item in the array to extract words and their parameters,
 * maintaining backward compatibility with simple word lists.
 *
 * @example
 * ```typescript
 * const provider = new ArrayWordListProvider({
 *   array: [
 *     "badword[severity=high]",
 *     "anotherword[category=profanity]",
 *     { word: "thirdword", parameters: { type: "slang" } },
 *     "simpleword"
 *   ]
 * });
 * await provider.initialize(config);
 * const words = await provider.getWords();
 * const paramWords = await provider.getParameterizedWords();
 * ```
 */
export class ArrayWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;

  /**
   * Creates a new ArrayWordListProvider instance.
   *
   * @param config - Configuration for the word list provider
   */
  constructor(config: BannedWordsSource) {
    this.config = config;
  }

  /**
   * Initialize the provider with configuration.
   *
   * This method processes the array configuration to extract both simple words
   * and parameterized words with their parameters. It handles three types of array items:
   * - Simple word strings
   * - Parameterized word definition strings
   * - Pre-defined ParameterizedWord objects
   *
   * @param config - Configuration containing the array word list
   * @throws Error - If no array value is provided in the configuration
   * @example
   * ```typescript
   * await provider.initialize({
   *   array: [
   *     "badword[severity=high]",
   *     "anotherword[category=profanity]",
   *     { word: "thirdword", parameters: { type: "slang" } },
   *     "simpleword"
   *   ]
   * });
   * ```
   */
  async initialize(config: BannedWordsSource): Promise<void> {
    this.config = config;

    if (config.array && Array.isArray(config.array)) {
      // Process the array to handle both simple strings and parameterized strings
      this.parameterizedWords = [];

      for (const item of config.array) {
        if (typeof item === 'string') {
          // Check if it's a parameterized word definition
          if (item.includes('[') && item.includes(']')) {
            const parsedWords = WordParser.parseParameterizedWords(item);
            this.parameterizedWords.push(...parsedWords);
          } else {
            // Simple word
            this.parameterizedWords.push(WordParser.createParameterizedWord(item));
          }
        } else if (item && typeof item === 'object' && 'word' in item && 'parameters' in item) {
          // Already a parameterized word object
          this.parameterizedWords.push(item as ParameterizedWord);
        }
      }

      // Extract simple words for backward compatibility
      this.words = this.parameterizedWords.map(pw => pw.word);
    } else {
      throw new Error('Array word list provider requires an array value');
    }

    this.ready = true;
  }

  /**
   * Get the current word list (backward compatibility).
   *
   * Returns an array of simple words extracted from the parameterized words.
   * This method is provided for backward compatibility with systems that
   * only work with simple word lists.
   *
   * @returns Promise resolving to an array of words
   * @example
   * ```typescript
   * const words = await provider.getWords();
   * console.log(words); // ["badword", "anotherword", "thirdword", "simpleword"]
   * ```
   */
  async getWords(): Promise<string[]> {
    return [...this.words];
  }

  /**
   * Get the current parameterized word list.
   *
   * Returns an array of parameterized words with their associated parameters.
   * This is the preferred method for accessing the word list as it provides
   * full access to word parameters.
   *
   * @returns Promise resolving to an array of parameterized words
   * @example
   * ```typescript
   * const paramWords = await provider.getParameterizedWords();
   * console.log(paramWords); //
   * // [
   * //   { word: "badword", parameters: { severity: "high" } },
   * //   { word: "anotherword", parameters: { category: "profanity" } },
   * //   { word: "thirdword", parameters: { type: "slang" } },
   * //   { word: "simpleword", parameters: {} }
   * // ]
   * ```
   */
  async getParameterizedWords(): Promise<ParameterizedWord[]> {
    return [...this.parameterizedWords];
  }

  /**
   * Check if the provider is ready.
   *
   * Returns true if the provider has been initialized and is ready to provide words.
   *
   * @returns True if the provider is ready, false otherwise
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Cleanup resources.
   *
   * Resets the provider state, clearing all loaded words and marking it as not ready.
   * This should be called when the provider is no longer needed to free up resources.
   */
  dispose(): void {
    this.words = [];
    this.parameterizedWords = [];
    this.ready = false;
  }
}
