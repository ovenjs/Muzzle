/**
 * Static word list provider implementation
 */

import { WordListProvider, BannedWordsSource } from '../../types';

/**
 * Provider for static word lists
 */
export class StaticWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private ready = false;

  constructor(config: BannedWordsSource) {
    this.config = config;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: BannedWordsSource): Promise<void> {
    this.config = config;

    if (config.array) {
      this.words = [...config.array];
    } else {
      // Default word list if none provided
      this.words = [
        'ass',
        'badword',
        'damn',
        'hell',
        'shit',
        'fuck',
        'crap',
        'piss',
        'bastard',
        'bitch',
      ];
    }

    this.ready = true;
  }

  /**
   * Get the current word list
   */
  async getWords(): Promise<string[]> {
    return [...this.words];
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
    this.ready = false;
  }
}
