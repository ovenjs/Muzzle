/**
 * Core type definitions for the Muzzle text filtering system
 * 
 * This file contains all the core type definitions used throughout the Muzzle system,
 * including configuration interfaces, data structures for text filtering results,
 * and parameterized word definitions. All interfaces are documented with TsDoc
 * for better developer experience and IDE support.
 */

// Global Configuration Types

/**
 * Main configuration interface for the Muzzle text filtering system.
 * Defines all available configuration options for customizing the behavior
 * of the text filtering system.
 */
export interface MuzzleConfig {
  /** Enable debug mode for troubleshooting */
  debug?: boolean;
  /** Logging level for the system */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  /** Configuration for text filtering behavior */
  textFiltering?: TextFilteringConfig;
  /** Configuration for text processing options */
  processing?: ProcessingConfig;
  /** Configuration for caching behavior */
  caching?: CacheConfig;
  /** Configuration for response formatting */
  response?: ResponseConfig;
  /** Configuration for text replacement behavior */
  replacement?: ReplacementConfig;
}

/**
 * Options for the Muzzle constructor.
 * Allows for providing initial configuration when creating a Muzzle instance.
 */
export interface MuzzleOptions {
  /** Initial configuration for the Muzzle system */
  config?: MuzzleConfig;
  /** Custom cache backend implementation */
  customCache?: CacheBackend;
}

// Text Filtering Types

/**
 * Configuration interface for handling parameterized words.
 * Defines how parameterized words are processed and validated in the system.
 */
export interface ParameterHandlingConfig {
  /** Default parameters to apply to non-parameterized words */
  defaultParameters?: WordParameters;
  /** Whether to include word parameters in filter results */
  includeParametersInResults?: boolean;
  /** Configuration for parameter validation */
  parameterValidation?: {
    /** List of required parameter names */
    required?: string[];
    /** Parameter type validation rules */
    allowedTypes?: Record<string, 'string' | 'number' | 'boolean'>;
    /** Parameter value constraints */
    constraints?: Record<
      string,
      {
        /** Minimum value for numeric parameters */
        min?: number;
        /** Maximum value for numeric parameters */
        max?: number;
        /** Allowed enum values */
        enum?: any[];
        /** Regular expression pattern for string parameters */
        pattern?: string;
      }
    >;
  };
  /** Configuration for severity mapping based on parameters */
  severityMapping?: {
    /** Default severity level for words without explicit severity */
    defaultSeverity?: number;
    /** Severity mapping by parameter values */
    byParameter?: Record<string, Record<string, number>>;
    /** Severity mapping by word type */
    byType?: Record<string, number>;
  };
  /** Whether to automatically convert simple words to parameterized words */
  autoConvertNonParameterized?: boolean;
}

/**
 * Configuration interface for text filtering behavior.
 * Defines options for how text is processed and matched against banned words.
 */
export interface TextFilteringConfig {
  /** Whether to perform case-sensitive matching (default: false) */
  caseSensitive?: boolean;
  /** Whether to match whole words only (default: true) */
  wholeWord?: boolean;
  /** Whether to require exact phrase matching (default: false) */
  exactPhrase?: boolean;
  /** Whether to treat banned words as regex patterns (default: false) */
  useRegex?: boolean;
  /** Configuration for the banned words source */
  bannedWordsSource?: BannedWordsSource;
  /** Maximum text length to process in characters (default: 1000000) */
  maxTextLength?: number;
  /** Whether to preprocess text before filtering (default: true) */
  preprocessText?: boolean;
  /** Configuration for handling parameterized words */
  parameterHandling?: ParameterHandlingConfig;
  /** Configuration for text replacement behavior */
  replacement?: ReplacementConfig;
}

/**
 * Configuration interface for banned words sources.
 * Defines the source of banned words and related options for different source types.
 */
export interface BannedWordsSource {
  /** Type of the banned words source */
  type: 'string' | 'array' | 'file' | 'url' | 'default';
  /** Comma-separated string of banned words (for string type) */
  string?: string;
  /** Array of banned words (for array type) */
  array?: string[];
  /** Path to the file containing banned words (for file type) */
  filePath?: string;
  /** URL to fetch banned words from (for url type) */
  url?: string;
  /** Refresh interval for dynamic sources in milliseconds (for file and url types) */
  refreshInterval?: number;
  /** Format of the banned words data (for file and url types) */
  format?: 'json' | 'text' | 'csv';
  /** Whether to cache the word list (for file and url types) */
  cache?: boolean;
  /** Custom cache key (for file and url types) */
  cacheKey?: string;
  /** Cache time-to-live in milliseconds (for file and url types) */
  ttl?: number;
  /** Override global case sensitivity setting */
  caseSensitive?: boolean;
  /** Override global whole word matching setting */
  wholeWord?: boolean;
  /** Override global exact phrase matching setting */
  exactPhrase?: boolean;
  /** Override global regex usage setting */
  useRegex?: boolean;
  /** Configuration for handling parameterized words (overrides global) */
  parameterHandling?: ParameterHandlingConfig;
  /** Additional configuration for the source */
  config?: Record<string, any>;
}

/**
 * Options for text filtering that can override defaults.
 * Allows for per-request customization of filtering behavior.
 */
export interface TextFilterOptions {
  /** Override case sensitivity setting */
  caseSensitive?: boolean;
  /** Override whole word matching setting */
  wholeWord?: boolean;
  /** Override exact phrase matching setting */
  exactPhrase?: boolean;
  /** Override regex usage setting */
  useRegex?: boolean;
  /** Override replacement configuration */
  replacement?: ReplacementConfig;
}

/**
 * Result of a text filtering operation.
 * Contains information about whether matches were found and details about those matches.
 */
export interface TextMatchResult {
  /** Whether any banned words were found */
  matched: boolean;
  /** Array of matches found in the text */
  matches: TextMatch[];
  /** Overall severity score for all matches */
  severity?: number;
  /** Error message if an error occurred during filtering */
  error?: string;
}

/**
 * Represents an individual match found in text.
 * Contains information about the matched word and its location.
 */
export interface TextMatch {
  /** The matched word */
  word: string;
  /** Position of the match in the text */
  position: {
    /** Start position (0-based) */
    start: number;
    /** End position (0-based) */
    end: number;
  };
  /** Line number where the match was found (if available) */
  line?: number;
  /** Column number where the match was found (if available) */
  column?: number;
  /** Surrounding text context for the match */
  context: string;
  /** Calculated severity score for the match */
  severity?: number;
  /** Parameters associated with the matched word (if parameterized) */
  parameters?: WordParameters;
  /** Replacement text for this match (if configured) */
  replacement?: string | undefined;
}

/**
 * Configuration for text replacement behavior.
 * Defines how matched content should be replaced or handled.
 */
export interface ReplacementConfig {
  /** Whether to enable text replacement (default: false) */
  enabled?: boolean;
  /** Replacement strategy to use */
  strategy?: 'asterisks' | 'custom' | 'remove' | 'none';
  /** Custom replacement string (used when strategy is 'custom') */
  customString?: string;
  /** Character to use for asterisk replacement (default: '*') */
  asteriskChar?: string;
  /** Number of characters to replace with asterisks (default: word length) */
  asteriskCount?: 'full' | number;
  /** Whether to preserve word boundaries when replacing (default: true) */
  preserveBoundaries?: boolean;
  /** Whether to apply case-sensitive replacement (default: true) */
  preserveCase?: boolean;
  /** Whether to replace only whole words or partial matches (default: true) */
  wholeWordOnly?: boolean;
}

// Caching Types

/**
 * Configuration for caching behavior.
 * Defines how caching is implemented and managed in the system.
 */
export interface CacheConfig {
  /** Default time-to-live for cache entries in milliseconds */
  defaultTTL?: number;
  /** Maximum number of items in cache */
  maxSize?: number;
  /** Interval for cache cleanup in milliseconds */
  cleanupInterval?: number;
  /** Cache backend configuration */
  backend?: {
    /** Type of cache backend */
    type: 'memory' | 'file' | 'custom';
    /** Backend-specific configuration */
    config?: Record<string, any>;
  };
}

/**
 * Cache statistics information.
 * Provides metrics about cache performance and usage.
 */
export interface CacheStats {
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Current number of items in cache */
  size: number;
  /** Array of cache keys */
  keys: string[];
}

/**
 * Interface for cache backends.
 * Defines the contract that all cache implementations must follow.
 */
export interface CacheBackend {
  /**
   * Initialize the cache with optional configuration.
   * @param config - Optional configuration for the cache backend
   * @returns A promise that resolves when initialization is complete
   */
  initialize(config?: Record<string, any>): Promise<void>;

  /**
   * Get a value from the cache.
   * @param key - The cache key
   * @returns A promise that resolves to the cached value
   */
  get(key: string): Promise<any>;

  /**
   * Set a value in the cache.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Optional time-to-live in milliseconds
   * @returns A promise that resolves when the value is cached
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Delete a value from the cache.
   * @param key - The cache key
   * @returns A promise that resolves when the value is deleted
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a key exists in the cache.
   * @param key - The cache key
   * @returns A promise that resolves to true if the key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all values from the cache.
   * @returns A promise that resolves when the cache is cleared
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics.
   * @returns A promise that resolves to cache statistics
   */
  getStats?(): Promise<CacheStats>;

  /**
   * Cleanup resources used by the cache.
   */
  dispose?(): void;
}

// Response Framework Types

/**
 * Configuration for response formatting.
 * Defines how filtering results are formatted and returned.
 */
export interface ResponseConfig {
  /** Response format */
  format?: 'simple' | 'detailed' | 'json' | 'xml' | 'custom';
  /** Whether to include matched words in the response */
  includeMatches?: boolean;
  /** Whether to include severity scores in the response */
  includeSeverity?: boolean;
  /** Whether to include processing metadata in the response */
  includeMetadata?: boolean;
  /** Custom response formatter function */
  formatter?: (result: FilterResult) => any;
}

/**
 * Options for response formatting that can be applied per request.
 * Allows for customization of response format for individual filtering operations.
 */
export interface ResponseFormatOptions {
  /** Response format */
  format?: 'simple' | 'detailed' | 'json' | 'xml' | 'custom';
}

/**
 * Formatted response from content filtering.
 * Provides a standardized response format for filtering operations.
 */
export interface FilterResult {
  /** Whether the content passed filtering (no matches found) */
  passed: boolean;
  /** Text filtering results (if applicable) */
  text?: TextMatchResult;
  /** Overall severity score */
  severity: number;
  /** Processing metadata */
  metadata?: {
    /** Time taken to process the content in milliseconds */
    processingTime: number;
    /** Timestamp when the processing occurred */
    timestamp: Date;
    /** Version of the filtering system */
    version: string;
    /** Additional metadata properties */
    [key: string]: any;
  };
}

/**
 * Violation report for filtered content.
 * Provides detailed information about violations found in content.
 */
export interface ViolationReport {
  /** Type of violation */
  type: 'text';
  /** Severity level of the violation */
  severity: number;
  /** Detailed information about the violation */
  details: {
    /** Text violation details (if applicable) */
    text?: TextViolationDetails;
  };
  /** Recommendations for addressing violations */
  recommendations?: string[];
  /** Timestamp when the violation was detected */
  timestamp: Date;
}

/**
 * Detailed information about text violations.
 * Provides specific details about text content violations.
 */
export interface TextViolationDetails {
  /** Matched words/phrases */
  matches: TextMatch[];
  /** Word lists that triggered violations */
  source: string;
  /** Context snippets around violations */
  snippets: string[];
}

// Processing Engine Types

/**
 * Configuration for text processing options.
 * Defines how text is processed and filtered.
 */
export interface ProcessingConfig {
  /** Whether to enable asynchronous processing */
  async?: boolean;
  /** Batch processing configuration */
  batch?: {
    /** Whether batch processing is enabled */
    enabled: boolean;
    /** Default batch size */
    size: number;
    /** Batch processing timeout in milliseconds */
    timeout: number;
  };
  /** Concurrency configuration */
  concurrency?: {
    /** Maximum concurrent operations */
    max: number;
    /** Maximum queue size for pending operations */
    queueSize?: number;
  };
  /** Timeout configuration */
  timeout?: {
    /** Timeout for individual text filtering in milliseconds */
    text?: number;
    /** Overall timeout for operations in milliseconds */
    overall?: number;
  };
}

/**
 * Status information for the processing component.
 * Provides information about the current state of text processing.
 */
export interface ProcessorStatus {
  /** Whether the processor is currently running */
  running: boolean;
  /** Number of pending operations */
  pending: number;
  /** Number of completed operations */
  completed: number;
  /** Number of failed operations */
  failed: number;
  /** Current concurrency level */
  concurrency: number;
}

/**
 * Status information for batch processing.
 * Provides information about the current state of batch operations.
 */
export interface BatchStatus {
  /** Current batch size */
  size: number;
  /** Maximum batch size */
  maxSize: number;
  /** Whether batch processing is currently active */
  processing: boolean;
  /** Timestamp when the last item was processed */
  lastProcessed?: Date;
}

/**
 * Result of a batch processing operation.
 * Contains information about the processing of an individual item in a batch.
 */
export interface BatchResult<T> {
  /** The item that was processed */
  item: T;
  /** The result of the processing */
  result: any;
  /** Whether the processing was successful */
  success: boolean;
  /** Error if processing failed */
  error?: Error;
  /** Time taken to process the item in milliseconds */
  processingTime: number;
}

// Severity Scoring Types

/**
 * Configuration for severity scoring.
 * Defines how severity scores are calculated for matches.
 */
export interface SeverityConfig {
  /** Severity thresholds */
  thresholds?: {
    /** Threshold for low severity */
    low: number;
    /** Threshold for medium severity */
    medium: number;
    /** Threshold for high severity */
    high: number;
    /** Threshold for critical severity */
    critical: number;
  };
  /** Scoring weights for different types of content */
  weights?: {
    /** Weight for text content severity */
    text: number;
  };
  /** Custom scoring rules */
  rules?: SeverityRule[];
}

/**
 * Custom severity scoring rule.
 * Defines a condition and associated severity score.
 */
export interface SeverityRule {
  /** Rule name for identification */
  name: string;
  /** Function that determines if the rule applies */
  condition: (matches: TextMatch[]) => boolean;
  /** Severity score when condition matches */
  score: number;
  /** Rule priority (higher = higher priority) */
  priority?: number;
}

// System Status Types

/**
 * System status information.
 * Provides information about the current state of the Muzzle system.
 */
export interface MuzzleStatus {
  /** Whether the system has been initialized */
  initialized: boolean;
  /** Status of the text filtering component */
  textFilter: {
    /** Whether the text filter is ready */
    ready: boolean;
    /** Information about the word list source */
    wordListSource: Record<string, any>;
  };
  /** Status of the processing component */
  processing: ProcessorStatus;
}

// URL Fetching Types

/**
 * Options for fetching content from URLs.
 * Defines how URL fetching is configured.
 */
export interface URLFetchOptions {
  /** Expected format of the content */
  format?: 'json' | 'text' | 'csv';
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Result of validation operations.
 * Contains information about validation errors and warnings.
 */
export interface ValidationResult {
  /** List of validation errors */
  errors: string[];
  /** List of validation warnings */
  warnings: string[];
}

// Provider and Strategy Interfaces

/**
 * Interface for word list providers.
 * Defines the contract that all word list implementations must follow.
 */
export interface WordListProvider {
  /**
   * Initialize the provider with configuration.
   * @param config - Configuration for the word list source
   * @returns A promise that resolves when initialization is complete
   */
  initialize(config: BannedWordsSource): Promise<void>;

  /**
   * Get the current word list (backward compatibility).
   * @returns A promise that resolves to an array of words
   */
  getWords(): Promise<string[]>;

  /**
   * Get the current parameterized word list.
   * @returns A promise that resolves to an array of parameterized words
   */
  getParameterizedWords?(): Promise<ParameterizedWord[]>;

  /**
   * Refresh the word list (for dynamic lists).
   * @returns A promise that resolves when the word list is refreshed
   */
  refresh?(): Promise<void>;

  /**
   * Check if the provider is ready.
   * @returns Whether the provider is ready
   */
  isReady(): boolean;

  /**
   * Cleanup resources.
   */
  dispose?(): void;
}

/**
 * Interface for severity scoring implementations.
 * Defines the contract for calculating severity scores.
 */
export interface SeverityScorer {
  /**
   * Calculate severity for text matches.
   * @param matches - Array of text matches
   * @returns Calculated severity score
   */
  calculateTextSeverity(matches: TextMatch[]): number;
}

/**
 * Interface for response formatting implementations.
 * Defines the contract for formatting filter results.
 */
export interface ResponseFormatter {
  /**
   * Format a filter result.
   * @param result - The filter result to format
   * @returns Formatted result
   */
  format(result: FilterResult): any;
}

/**
 * Interface for text matching strategies.
 * Defines the contract for implementing different matching algorithms.
 */
export interface MatchingStrategy {
  /**
   * Find all matches of a pattern in text.
   * @param text - The text to search in
   * @param pattern - The pattern to search for
   * @param options - Matching options
   * @returns Array of match positions
   */
  match(text: string, pattern: string, options: TextFilterOptions): MatchPosition[];
}

/**
 * Position information for a match.
 * Defines the start and end positions of a match in text.
 */
export interface MatchPosition {
  /** Start position (0-based) */
  start: number;
  /** End position (0-based) */
  end: number;
}

// Parameterized Word Types

/**
 * Interface for parameters associated with a word.
 * Defines metadata that can be attached to banned words for more sophisticated filtering.
 */
export interface WordParameters {
  /** Type of the word (e.g., 'slur', 'profanity', 'hate') */
  type: string;
  /** Additional custom parameters */
  [key: string]: any;
}

/**
 * Interface for a word with associated parameters.
 * Represents a banned word along with its metadata for enhanced filtering capabilities.
 */
export interface ParameterizedWord {
  /** The word to match */
  word: string;
  /** Parameters associated with the word */
  parameters: WordParameters;
}
