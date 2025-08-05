/**
 * File word list provider implementation
 */

import { WordListProvider, BannedWordsSource, CacheBackend, ParameterizedWord } from '../../types';
import { WordParser } from '../word-parser';

/**
 * Provider for file-based word lists with parameter support
 */
export class FileWordListProvider implements WordListProvider {
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
   * Refresh the word list from the file
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
