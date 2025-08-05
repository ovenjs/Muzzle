/**
 * Array word list provider implementation
 */

import { WordListProvider, BannedWordsSource, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for array-based word lists with parameter support
 */
export class ArrayWordListProvider implements WordListProvider {
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
