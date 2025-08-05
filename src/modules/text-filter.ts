/**
 * Text filtering module for the Muzzle content filtering system
 *
 * This module provides the core text filtering functionality for the Muzzle system.
 * It implements a flexible filtering pipeline that can handle various word sources,
 * matching strategies, and parameterized word definitions. The module supports
 * both simple word matching and advanced parameter-based filtering with severity
 * calculation and context extraction.
 *
 * @module text-filter
 * @description Core text filtering implementation with support for parameterized words and multiple providers
 */

import {
  TextFilteringConfig,
  BannedWordsSource,
  TextFilterOptions,
  TextMatchResult,
  TextMatch,
  WordListProvider,
  MatchingStrategy,
  MatchPosition,
  ParameterizedWord,
  ParameterHandlingConfig,
} from '../types';

import { StringWordListProvider } from './providers/string-word-list-provider';
import { ArrayWordListProvider } from './providers/array-word-list-provider';
import { FileWordListProvider } from './providers/file-word-list-provider';
import { DynamicWordListProvider } from './providers/dynamic-word-list-provider';
import { DefaultWordListProvider } from './providers/default-word-list-provider';
import { DefaultMatchingStrategy } from './strategies/default-matching-strategy';
import { WordParser } from './word-parser';

/**
 * Text filtering implementation
 *
 * The TextFilter class provides the main text filtering functionality for the Muzzle system.
 * It manages word list providers, matching strategies, and parameter handling to provide
 * comprehensive content filtering capabilities. The class supports various word sources
 * including strings, arrays, files, URLs, and default word lists.
 *
 * @example
 * ```typescript
 * const config = {
 *   caseSensitive: false,
 *   wholeWord: true,
 *   bannedWordsSource: {
 *     type: 'array',
 *     array: ['badword1', 'badword2']
 *   }
 * };
 *
 * const textFilter = new TextFilter(config);
 * await textFilter.initialize();
 *
 * const result = await textFilter.filter('This text contains badword1');
 * console.log(result.matched); // true
 * console.log(result.matches); // array of match details
 * ```
 */
export class TextFilter {
  private config: TextFilteringConfig;
  private provider: WordListProvider | undefined;
  private matchingStrategy: MatchingStrategy;
  private initialized = false;

  /**
   * Creates a new TextFilter instance with the specified configuration
   *
   * @param config - Configuration object for text filtering behavior
   *
   * @example
   * ```typescript
   * const config = {
   *   caseSensitive: false,
   *   wholeWord: true,
   *   bannedWordsSource: {
   *     type: 'string',
   *     string: 'badword1,badword2'
   *   }
   * };
   * const textFilter = new TextFilter(config);
   * ```
   */
  constructor(config: TextFilteringConfig) {
    this.config = config;
    this.matchingStrategy = new DefaultMatchingStrategy();
  }

  /**
   * Initialize the text filter
   *
   * This method initializes the text filter by setting up the appropriate word list provider
   * based on the banned words source configuration. It must be called before any filtering
   * operations can be performed. The method is idempotent and can be called multiple times.
   *
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} When initialization fails due to invalid configuration or provider errors
   *
   * @example
   * ```typescript
   * const textFilter = new TextFilter(config);
   * await textFilter.initialize();
   * // Text filter is now ready for filtering operations
   * ```
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize word list provider based on banned words source
      if (this.config.bannedWordsSource) {
        const source = this.config.bannedWordsSource;

        switch (source.type) {
          case 'string':
            this.provider = new StringWordListProvider(source);
            break;
          case 'array':
            this.provider = new ArrayWordListProvider(source);
            break;
          case 'file':
            this.provider = new FileWordListProvider(source);
            break;
          case 'url':
            this.provider = new DynamicWordListProvider(source);
            break;
          case 'default':
            this.provider = new DefaultWordListProvider(source);
            break;
          default:
            throw new Error(`Unknown banned words source type: ${source.type}`);
        }

        await this.provider.initialize(source);
      } else {
        // Use default provider if none is specified
        const defaultSource: BannedWordsSource = {
          type: 'default',
          refreshInterval: 86400000, // 24 hours
          format: 'text',
          cache: true,
          ttl: 86400000, // 24 hours
        };

        this.provider = new DefaultWordListProvider(defaultSource);
        await this.provider.initialize(defaultSource);
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize text filter: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Filter text for inappropriate content
   *
   * This is the core filtering method that analyzes text content against configured
   * word lists and filtering rules. It returns detailed information about any matches found,
   * including positions, context, severity, and parameter information.
   *
   * @param text - The text content to filter
   * @param options - Optional filtering parameters to override defaults
   * @returns Promise that resolves with filtering results including matches and severity
   *
   * @example
   * ```typescript
   * const result = await textFilter.filter('This text contains bad words', {
   *   caseSensitive: false,
   *   wholeWord: true
   * });
   * console.log(result.matched); // true if matches found
   * console.log(result.matches); // array of match details with positions and context
   * console.log(result.severity); // calculated severity score
   * ```
   */
  async filter(text: string, options?: TextFilterOptions): Promise<TextMatchResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Apply preprocessing if enabled
      const processedText = this.config.preprocessText ? this.preprocessText(text) : text;

      // Get all parameterized words from the provider
      const allParameterizedWords = await this.getAllParameterizedWords();

      // Filter options with defaults
      const filterOptions: TextFilterOptions = {
        caseSensitive: this.config.caseSensitive ?? false,
        wholeWord: this.config.wholeWord ?? true,
        exactPhrase: this.config.exactPhrase ?? false,
        useRegex: this.config.useRegex ?? false,
        ...options,
      };

      // Find matches
      const matches: TextMatch[] = [];

      for (const paramWord of allParameterizedWords) {
        const positions = this.matchingStrategy.match(processedText, paramWord.word, filterOptions);

        for (const position of positions) {
          // Extract context around the match
          const contextStart = Math.max(0, position.start - 20);
          const contextEnd = Math.min(processedText.length, position.end + 20);
          const context = processedText.substring(contextStart, contextEnd);

          // Calculate line and column
          const linesBefore = processedText.substring(0, position.start).split('\n');
          const line = linesBefore.length;
          const column = (linesBefore[linesBefore.length - 1]?.length ?? 0) + 1;

          // Calculate severity based on word parameters
          const severity = this.calculateSeverity(paramWord.parameters);

          // Check if parameters should be included in results
          const paramConfig = this.getParameterHandlingConfig();
          const includeParameters = paramConfig?.includeParametersInResults !== false;

          const match: TextMatch = {
            word: paramWord.word,
            position: {
              start: position.start,
              end: position.end,
            },
            line,
            column,
            context,
            severity,
          };

          // Only include parameters if configured to do so
          if (includeParameters) {
            match.parameters = paramWord.parameters;
          }

          matches.push(match);
        }
      }

      // Calculate overall severity
      const severity = matches.length > 0 ? Math.min(matches.length * 0.2, 1.0) : 0;

      return {
        matched: matches.length > 0,
        matches,
        severity,
      };
    } catch (error) {
      return {
        matched: false,
        matches: [],
        severity: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Refresh dynamic word lists
   *
   * This method refreshes the word lists from their source if the provider supports
   * dynamic refreshing. This is useful for word lists that are loaded from URLs
   * or files that may change over time.
   *
   * @returns Promise that resolves when word lists have been refreshed
   *
   * @example
   * ```typescript
   * await textFilter.refreshWordLists();
   * // Word lists are now updated from their source
   * ```
   */
  async refreshWordLists(): Promise<void> {
    if (this.provider && typeof this.provider.refresh === 'function') {
      await this.provider.refresh();
    }
  }

  /**
   * Get word list statistics
   *
   * This method provides statistics about the current word list including word count,
   * readiness status, and source type information. It's useful for monitoring and
   * debugging the text filter state.
   *
   * @returns Promise that resolves with word list statistics
   *
   * @example
   * ```typescript
   * const stats = await textFilter.getWordListStats();
   * console.log(stats.wordCount); // number of words in the list
   * console.log(stats.ready); // true if the provider is ready
   * console.log(stats.sourceType); // type of word source (e.g., 'array', 'file', 'url')
   * ```
   */
  async getWordListStats(): Promise<Record<string, any>> {
    if (!this.provider) {
      return {};
    }

    const words = await this.provider.getWords();
    return {
      wordCount: words.length,
      ready: this.provider.isReady(),
      sourceType: this.config.bannedWordsSource?.type || 'default',
    };
  }

  /**
   * Clean up resources
   *
   * This method properly releases all resources held by the text filter,
   * including the word list provider and any cached data. It should be called
   * when the text filter is no longer needed to prevent memory leaks.
   *
   * @example
   * ```typescript
   * textFilter.dispose();
   * // All resources have been released
   * ```
   */
  dispose(): void {
    if (this.provider && typeof this.provider.dispose === 'function') {
      this.provider.dispose();
    }

    this.provider = undefined;
    this.initialized = false;
  }

  /**
   * Get all words from the provider (backward compatibility)
   *
   * This method retrieves all words from the word list provider and removes duplicates.
   * It's maintained for backward compatibility with older providers that don't support
   * parameterized words.
   *
   * @returns Promise that resolves with array of unique words
   * @private
   */
  private async getAllWords(): Promise<string[]> {
    if (!this.provider || !this.provider.isReady()) {
      return [];
    }

    const words = await this.provider.getWords();

    // Remove duplicates
    return [...new Set(words)];
  }

  /**
   * Get all parameterized words from the provider
   *
   * This method retrieves parameterized words from the provider, with fallback support
   * for providers that only return simple words. It handles automatic conversion of
   * simple words to parameterized words based on configuration settings.
   *
   * @returns Promise that resolves with array of unique parameterized words
   * @private
   */
  private async getAllParameterizedWords(): Promise<ParameterizedWord[]> {
    if (!this.provider || !this.provider.isReady()) {
      return [];
    }

    let parameterizedWords: ParameterizedWord[] = [];

    // Try to get parameterized words if the provider supports it
    if (typeof this.provider.getParameterizedWords === 'function') {
      parameterizedWords = await this.provider.getParameterizedWords();
    } else {
      // Fallback to simple words and convert them to parameterized words
      const words = await this.provider.getWords();
      const paramConfig = this.getParameterHandlingConfig();

      // Check if auto-conversion is enabled (default: true)
      const autoConvert = paramConfig?.autoConvertNonParameterized !== false;

      if (autoConvert) {
        // Use default parameters from configuration or fallback to 'unknown' type
        const defaultParams = paramConfig?.defaultParameters || { type: 'unknown' };

        parameterizedWords = words.map(word => ({
          word,
          parameters: { ...defaultParams },
        }));
      } else {
        // Don't auto-convert, create minimal parameterized words
        parameterizedWords = words.map(word => WordParser.createParameterizedWord(word, 'unknown'));
      }
    }

    // Remove duplicates based on word value
    const uniqueWords = new Map<string, ParameterizedWord>();
    for (const paramWord of parameterizedWords) {
      if (!uniqueWords.has(paramWord.word)) {
        uniqueWords.set(paramWord.word, paramWord);
      }
    }

    return Array.from(uniqueWords.values());
  }

  /**
   * Calculate severity based on word parameters and configuration
   *
   * This method calculates a severity score for a word based on its parameters
   * and the configured severity mapping. It supports both explicit severity values
   * and type-based severity mapping with fallback to default values.
   *
   * @param parameters - Word parameters containing type and severity information
   * @returns Calculated severity score (0-10)
   * @private
   */
  private calculateSeverity(parameters: any): number {
    // Get parameter handling configuration
    const paramConfig = this.getParameterHandlingConfig();

    // Default severity from configuration or fallback
    let severity = paramConfig?.severityMapping?.defaultSeverity || 1;

    // Check for explicit severity parameter
    if (parameters.severity !== undefined) {
      if (typeof parameters.severity === 'number') {
        severity = Math.max(0, Math.min(10, parameters.severity));
      } else if (typeof parameters.severity === 'string') {
        const severityMap: Record<string, number> = {
          low: 1,
          medium: 3,
          high: 5,
          critical: 10,
        };
        severity = severityMap[parameters.severity.toLowerCase()] || severity;
      }
    }

    // Adjust severity based on word type using configuration mapping
    if (parameters.type && paramConfig?.severityMapping?.byType) {
      const typeSeverity = paramConfig.severityMapping.byType[parameters.type.toLowerCase()];
      if (typeSeverity !== undefined) {
        severity = Math.max(severity, typeSeverity);
      }
    }

    // Fallback to default type mapping if not configured
    if (parameters.type) {
      const typeSeverityMap: Record<string, number> = {
        slur: 8,
        profanity: 5,
        hate: 9,
        harassment: 7,
        violence: 6,
        adult: 4,
        unknown: 1,
      };

      const typeSeverity = typeSeverityMap[parameters.type.toLowerCase()] || 1;
      severity = Math.max(severity, typeSeverity);
    }

    return severity;
  }

  /**
   * Get parameter handling configuration with proper fallback
   *
   * This method retrieves the parameter handling configuration, checking first
   * the banned words source configuration (which takes precedence) and falling
   * back to the global text filtering configuration.
   *
   * @returns Parameter handling configuration or undefined if not configured
   * @private
   */
  private getParameterHandlingConfig(): ParameterHandlingConfig | undefined {
    // Check banned words source configuration first (overrides global)
    if (this.config.bannedWordsSource?.parameterHandling) {
      return this.config.bannedWordsSource.parameterHandling;
    }

    // Fall back to global text filtering configuration
    return this.config.parameterHandling;
  }

  /**
   * Preprocess text for better matching
   *
   * This method applies basic preprocessing to text to improve matching accuracy.
   * Currently it normalizes whitespace and trims leading/trailing spaces, but
   * can be extended to support additional preprocessing steps.
   *
   * @param text - The text to preprocess
   * @returns Preprocessed text
   * @private
   */
  private preprocessText(text: string): string {
    // Basic preprocessing - can be extended
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
