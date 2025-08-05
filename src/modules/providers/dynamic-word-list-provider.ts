/**
 * Dynamic word list provider implementation
 *
 * This module provides a WordListProvider implementation for dynamically fetched word lists.
 * It supports loading word lists from remote URLs in various formats (text, CSV, JSON)
 * with optional caching and automatic refresh capabilities.
 *
 * @module DynamicWordListProvider
 */

import { WordListProvider, BannedWordsSource, CacheBackend, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for dynamic word lists fetched from URLs with parameter support.
 *
 * This provider handles word lists fetched from remote URLs, supporting multiple formats:
 * - Text files with comma-separated or line-separated words
 * - CSV files with one word per line
 * - JSON files containing arrays of words or parameterized word objects
 *
 * The provider supports caching to improve performance and automatic refresh
 * based on configurable intervals. This provider works in both Node.js and
 * browser environments.
 *
 * @example
 * ```typescript
 * const provider = new DynamicWordListProvider({
 *   url: 'https://example.com/wordlist.txt',
 *   format: 'text',
 *   refreshInterval: 3600000, // 1 hour
 *   cache: true
 * }, cacheBackend);
 * await provider.initialize(config);
 * const words = await provider.getWords();
 * const paramWords = await provider.getParameterizedWords();
 * ```
 */
export class DynamicWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;
  private cache: CacheBackend | undefined;
  private lastRefresh = 0;

  /**
   * Creates a new DynamicWordListProvider instance.
   *
   * @param config - Configuration for the word list provider
   * @param cache - Optional cache backend for caching word lists
   */
  constructor(config: BannedWordsSource, cache?: CacheBackend) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * Initialize the provider with configuration.
   *
   * This method attempts to load the word list from cache if available and enabled.
   * If not found in cache or caching is disabled, it fetches the word list from the URL.
   *
   * @param config - Configuration containing the URL and other options
   * @throws Error - If no URL is provided in the configuration
   * @example
   * ```typescript
   * await provider.initialize({
   *   url: 'https://example.com/wordlist.txt',
   *   format: 'text',
   *   refreshInterval: 3600000,
   *   cache: true
   * });
   * ```
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
   * Get the current word list (backward compatibility).
   *
   * Returns an array of simple words extracted from the parameterized words.
   * This method is provided for backward compatibility with systems that
   * only work with simple word lists. It also handles automatic refresh
   * if the refresh interval has elapsed.
   *
   * @returns Promise resolving to an array of words
   * @example
   * ```typescript
   * const words = await provider.getWords();
   * console.log(words); // ["badword", "anotherword", ...]
   * ```
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
   * Get the current parameterized word list.
   *
   * Returns an array of parameterized words with their associated parameters.
   * This is the preferred method for accessing the word list as it provides
   * full access to word parameters. It also handles automatic refresh
   * if the refresh interval has elapsed.
   *
   * @returns Promise resolving to an array of parameterized words
   * @example
   * ```typescript
   * const paramWords = await provider.getParameterizedWords();
   * console.log(paramWords); //
   * // [
   * //   { word: "badword", parameters: { severity: "high" } },
   * //   { word: "anotherword", parameters: { category: "profanity" } },
   * //   ...
   * // ]
   * ```
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
   * Refresh the word list from the URL.
   *
   * This method fetches the word list from the remote URL, parses its content
   * based on the configured format, and updates the internal word lists.
   * It also caches the results if caching is enabled.
   *
   * @throws Error - If the URL cannot be fetched or the content cannot be parsed
   * @example
   * ```typescript
   * await provider.refresh();
   * ```
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
    this.lastRefresh = 0;
  }

  /**
   * Parse content based on format.
   *
   * This private method parses fetched content based on the specified format:
   * - JSON: Parses as JSON array and converts to ParameterizedWord objects
   * - CSV: Splits by commas, newlines, or whitespace and treats each as a word
   * - Text: Splits by commas, newlines, or whitespace and handles parameterized words
   *
   * @param content - The fetched content to parse
   * @param format - The format of the content ('json', 'csv', or 'text')
   * @returns Array of ParameterizedWord objects
   * @throws Error - If JSON content is invalid
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
