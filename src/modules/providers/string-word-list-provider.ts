/**
 * String word list provider implementation
 *
 * This module provides a WordListProvider implementation for comma-separated string word lists.
 * It supports both simple words and parameterized word definitions with parameters.
 *
 * @module StringWordListProvider
 */

import { WordListProvider, BannedWordsSource, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for comma-separated string word lists with parameter support.
 *
 * This provider handles word lists provided as comma-separated strings, which can contain
 * both simple words and parameterized word definitions. It parses the string to extract
 * words and their parameters, maintaining backward compatibility with simple word lists.
 *
 * @example
 * ```typescript
 * const provider = new StringWordListProvider({
 *   string: "badword[severity=high], anotherword[category=profanity]"
 * });
 * await provider.initialize(config);
 * const words = await provider.getWords();
 * const paramWords = await provider.getParameterizedWords();
 * ```
 */
export class StringWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;

  /**
   * Creates a new StringWordListProvider instance.
   *
   * @param config - Configuration for the word list provider
   */
  constructor(config: BannedWordsSource) {
    this.config = config;
  }

  /**
   * Initialize the provider with configuration.
   *
   * This method parses the string configuration to extract both simple words
   * and parameterized words with their parameters.
   *
   * @param config - Configuration containing the string word list
   * @throws Error - If no string value is provided in the configuration
   * @example
   * ```typescript
   * await provider.initialize({
   *   string: "badword[severity=high], anotherword[category=profanity]"
   * });
   * ```
   */
  async initialize(config: BannedWordsSource): Promise<void> {
    this.config = config;

    if (config.string !== undefined) {
      // Parse parameterized words from the string
      this.parameterizedWords = WordParser.parseParameterizedWords(config.string);

      // Extract simple words for backward compatibility
      this.words = this.parameterizedWords.map(pw => pw.word);
    } else {
      throw new Error('String word list provider requires a string value');
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
   * console.log(words); // ["badword", "anotherword"]
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
   * //   { word: "anotherword", parameters: { category: "profanity" } }
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
