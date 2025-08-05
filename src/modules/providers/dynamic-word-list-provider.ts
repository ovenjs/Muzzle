/**
 * Dynamic word list provider implementation
 */

import { WordListProvider, BannedWordsSource, CacheBackend, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for dynamic word lists fetched from URLs with parameter support
 */
export class DynamicWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;
  private cache: CacheBackend | undefined;
  private lastRefresh = 0;

  constructor(config: BannedWordsSource, cache?: CacheBackend) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: BannedWordsSource): Promise<void> {
    this.config = config;

    if (!config.url) {
      throw new Error('Dynamic word list provider requires a URL');
    }

    // Try to load from cache first
    if (this.cache && config.cache !== false) {
      const cacheKey = config.cacheKey || `wordlist:${config.url}`;
      try {
        const cachedWords = await this.cache.get(cacheKey);
        if (cachedWords && Array.isArray(cachedWords)) {
          this.words = cachedWords;
          // Convert simple words to parameterized words for backward compatibility
          this.parameterizedWords = this.words.map(word =>
            WordParser.createParameterizedWord(word, 'unknown')
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
    if (!this.config.url) {
      throw new Error('Dynamic word list provider requires a URL');
    }

    try {
      const response = await fetch(this.config.url, {
        headers:
          this.config.format === 'json' ? { Accept: 'application/json' } : { Accept: 'text/plain' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const parameterizedWords = this.parseContent(content, this.config.format || 'text');

      this.parameterizedWords = parameterizedWords;
      this.words = parameterizedWords.map(pw => pw.word);
      this.ready = true;
      this.lastRefresh = Date.now();

      // Cache the words if caching is enabled
      if (this.cache && this.config.cache !== false) {
        const cacheKey = this.config.cacheKey || `wordlist:${this.config.url}`;
        const ttl = this.config.ttl || 3600000; // Default 1 hour
        try {
          await this.cache.set(cacheKey, this.words, ttl);
        } catch (error) {
          console.warn('Failed to cache word list:', error);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch word list from ${this.config.url}: ${
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
  private parseContent(content: string, format: string): ParameterizedWord[] {
    switch (format) {
      case 'json':
        try {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            return data.map(item => {
              if (typeof item === 'string') {
                return WordParser.createParameterizedWord(item);
              } else if (
                item &&
                typeof item === 'object' &&
                'word' in item &&
                'parameters' in item
              ) {
                return item as ParameterizedWord;
              } else {
                return WordParser.createParameterizedWord(String(item));
              }
            });
          }
          return [];
        } catch (error) {
          throw new Error(
            `Invalid JSON format: ${error instanceof Error ? error.message : String(error)}`
          );
        }

      case 'csv':
        return content
          .split(/[,\n\r\t\s]+/)
          .map(word => word.trim())
          .filter(word => word.length > 0)
          .map(word => WordParser.createParameterizedWord(word));

      case 'text':
      default:
        // Check if content contains parameterized word syntax
        if (content.includes('[') && content.includes(']')) {
          // Try to parse parameterized words
          try {
            return WordParser.parseParameterizedWords(content);
          } catch {
            // Fall back to simple word parsing
            return content
              .split(/[,\n\r\t\s]+/)
              .map(word => word.trim())
              .filter(word => word.length > 0)
              .map(word => WordParser.createParameterizedWord(word));
          }
        } else {
          // Simple word parsing for non-parameterized content
          return content
            .split(/[,\n\r\t\s]+/)
            .map(word => word.trim())
            .filter(word => word.length > 0)
            .map(word => WordParser.createParameterizedWord(word));
        }
    }
  }
}
