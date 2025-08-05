/**
 * Text filtering module for the Muzzle content filtering system
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
 */
export class TextFilter {
  private config: TextFilteringConfig;
  private provider: WordListProvider | undefined;
  private matchingStrategy: MatchingStrategy;
  private initialized = false;

  constructor(config: TextFilteringConfig) {
    this.config = config;
    this.matchingStrategy = new DefaultMatchingStrategy();
  }

  /**
   * Initialize the text filter
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
   */
  async refreshWordLists(): Promise<void> {
    if (this.provider && typeof this.provider.refresh === 'function') {
      await this.provider.refresh();
    }
  }

  /**
   * Get word list statistics
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
   */
  private preprocessText(text: string): string {
    // Basic preprocessing - can be extended
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
