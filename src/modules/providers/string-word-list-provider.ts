/**
 * String word list provider implementation
 */

import { WordListProvider, BannedWordsSource, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for comma-separated string word lists with parameter support
 */
export class StringWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;

  constructor(config: BannedWordsSource) {
    this.config = config;
  }

  /**
   * Initialize the provider
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
   * Get the current word list (backward compatibility)
   */
  async getWords(): Promise<string[]> {
    return [...this.words];
  }

  /**
   * Get the current parameterized word list
   */
  async getParameterizedWords(): Promise<ParameterizedWord[]> {
    return [...this.parameterizedWords];
  }

  /**
   * Check if the provider is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.words = [];
    this.parameterizedWords = [];
    this.ready = false;
  }
}
