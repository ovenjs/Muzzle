/**
 * File word list provider implementation
 *
 * This module provides a WordListProvider implementation for file-based word lists.
 * It supports loading word lists from local files in various formats (text, CSV, JSON)
 * with optional caching and automatic refresh capabilities.
 *
 * @module FileWordListProvider
 */

import { WordListProvider, BannedWordsSource, CacheBackend, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for file-based word lists with parameter support.
 *
 * This provider handles word lists stored in local files, supporting multiple formats:
 * - Text files with comma-separated or line-separated words
 * - CSV files with one word per line
 * - JSON files containing arrays of words or parameterized word objects
 *
 * The provider supports caching to improve performance and automatic refresh
 * based on configurable intervals. Note that this provider is not available
 * in browser environments as it requires Node.js file system access.
 *
 * @example
 * ```typescript
 * const provider = new FileWordListProvider({
 *   filePath: './wordlist.txt',
 *   format: 'text',
 *   refreshInterval: 3600000, // 1 hour
 *   cache: true
 * }, cacheBackend);
 * await provider.initialize(config);
 * const words = await provider.getWords();
 * const paramWords = await provider.getParameterizedWords();
 * ```
 */
export class FileWordListProvider implements WordListProvider {
  private config: BannedWordsSource;
  private words: string[] = [];
  private parameterizedWords: ParameterizedWord[] = [];
  private ready = false;
  private cache: CacheBackend | undefined;
  private lastRefresh = 0;

  /**
   * Creates a new FileWordListProvider instance.
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
   * If not found in cache or caching is disabled, it loads the word list from the file.
   *
   * @param config - Configuration containing the file path and other options
   * @throws Error - If no file path is provided in the configuration
   * @example
   * ```typescript
   * await provider.initialize({
   *   filePath: './wordlist.txt',
   *   format: 'text',
   *   refreshInterval: 3600000,
   *   cache: true
   * });
   * ```
   */
  async initialize(config: BannedWordsSource): Promise<void> {
    this.config = config;

    if (!config.filePath) {
      throw new Error('File word list provider requires a file path');
    }

    // Try to load from cache first
    if (this.cache && config.cache !== false) {
      const cacheKey = config.cacheKey || `wordlist:file:${config.filePath}`;
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
        // Cache miss or error, continue with file read
        console.warn('Failed to load word list from cache:', error);
      }
    }

    // Load from file
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
   * Refresh the word list from the file.
   *
   * This method reads the file from disk, parses its content based on the configured format,
   * and updates the internal word lists. It also caches the results if caching is enabled.
   *
   * @throws Error - If the file cannot be read or parsed
   * @example
   * ```typescript
   * await provider.refresh();
   * ```
   */
  async refresh(): Promise<void> {
    if (!this.config.filePath) {
      throw new Error('File word list provider requires a file path');
    }

    try {
      // Check if we're in a browser environment
      if (typeof (globalThis as any).window !== 'undefined') {
        throw new Error('File-based word lists are not supported in browser environment');
      }

      // Import Node.js modules dynamically to avoid browser errors
      const fs = require('fs');
      const path = require('path');

      // Resolve the file path
      const resolvedPath = path.resolve(this.config.filePath);

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Word list file not found: ${resolvedPath}`);
      }

      // Read file content
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const parameterizedWords = this.parseContent(content, this.config.format || 'text');

      this.parameterizedWords = parameterizedWords;
      this.words = parameterizedWords.map(pw => pw.word);
      this.ready = true;
      this.lastRefresh = Date.now();

      // Cache the words if caching is enabled
      if (this.cache && this.config.cache !== false) {
        const cacheKey = this.config.cacheKey || `wordlist:file:${this.config.filePath}`;
        const ttl = this.config.ttl || 3600000; // Default 1 hour
        try {
          await this.cache.set(cacheKey, this.words, ttl);
        } catch (error) {
          console.warn('Failed to cache word list:', error);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to load word list from file ${this.config.filePath}: ${
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
   * This private method parses file content based on the specified format:
   * - JSON: Parses as JSON array and converts to ParameterizedWord objects
   * - CSV: Splits by newlines and treats each line as a word
   * - Text: Splits by commas, newlines, or whitespace and handles parameterized words
   *
   * @param content - The file content to parse
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
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
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
