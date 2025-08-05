/**
 * Default word list provider implementation
 */

import { WordListProvider, BannedWordsSource, CacheBackend, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for the default GitHub profanity words list
 */
export class DefaultWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;
  private cache: CacheBackend | undefined;
  private lastRefresh = 0;

  // Default URL for the Google profanity words list
  private static readonly DEFAULT_URL =
    'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt';

  constructor(config: BannedWordsSource, cache?: CacheBackend) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: BannedWordsSource): Promise<void> {
    this.config = config;

    // Try to load from cache first
    if (this.cache && config.cache !== false) {
      const cacheKey = config.cacheKey || 'wordlist:default:profanity';
      try {
        const cachedWords = await this.cache.get(cacheKey);
        if (cachedWords && Array.isArray(cachedWords)) {
          this.words = cachedWords;
          // Convert simple words to parameterized words for backward compatibility
          this.parameterizedWords = this.words.map(word =>
            WordParser.createParameterizedWord(word, 'profanity')
          );
          this.ready = true;
          return;
        }
      } catch (error) {
        // Cache miss or error, continue with fetch
        console.warn('Failed to load word list from cache:', error);
      }
    }

    // Fetch from URL
    await this.refresh();
  }

  /**
   * Get the current word list (backward compatibility)
   */
  async getWords(): Promise<string[]> {
    if (!this.ready) {
      await this.initialize(this.config);
    }

    // Check if refresh is needed
    if (
      this.config.refreshInterval &&
      Date.now() - this.lastRefresh > this.config.refreshInterval
    ) {
      try {
        await this.refresh();
      } catch (error) {
        console.warn('Failed to refresh word list:', error);
        // Continue with cached words
      }
    }

    return [...this.words];
  }

  /**
   * Get the current parameterized word list
   */
  async getParameterizedWords(): Promise<ParameterizedWord[]> {
    if (!this.ready) {
      await this.initialize(this.config);
    }

    // Check if refresh is needed
    if (
      this.config.refreshInterval &&
      Date.now() - this.lastRefresh > this.config.refreshInterval
    ) {
      try {
        await this.refresh();
      } catch (error) {
        console.warn('Failed to refresh word list:', error);
        // Continue with cached words
      }
    }

    return [...this.parameterizedWords];
  }

  /**
   * Refresh the word list from the URL
   */
  async refresh(): Promise<void> {
    try {
      const url = this.config.url || DefaultWordListProvider.DEFAULT_URL;

      const response = await fetch(url, {
        headers: { Accept: 'text/plain' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const words = this.parseContent(content, this.config.format || 'text');

      this.words = words;
      // Convert simple words to parameterized words with default type
      this.parameterizedWords = this.words.map(word =>
        WordParser.createParameterizedWord(word, 'profanity')
      );
      this.ready = true;
      this.lastRefresh = Date.now();

      // Cache the words if caching is enabled
      if (this.cache && this.config.cache !== false) {
        const cacheKey = this.config.cacheKey || 'wordlist:default:profanity';
        const ttl = this.config.ttl || 3600000; // Default 1 hour
        try {
          await this.cache.set(cacheKey, words, ttl);
        } catch (error) {
          console.warn('Failed to cache word list:', error);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch default word list: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
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
    this.lastRefresh = 0;
  }

  /**
   * Parse content based on format
   */
  private parseContent(content: string, format: string): string[] {
    switch (format) {
      case 'json':
        try {
          const data = JSON.parse(content);
          return Array.isArray(data) ? data : [];
        } catch (error) {
          throw new Error(
            `Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`
          );
        }

      case 'csv':
        return content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

      case 'text':
      default:
        return content
          .split(/[,\n\r\t\s]+/)
          .map(word => word.trim())
          .filter(word => word.length > 0);
    }
  }
}
