/**
 * Core types for the Muzzle text filtering system
 */

// Global Configuration Types
export interface MuzzleConfig {
  // Global configuration
  debug?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';

  // Text filtering configuration
  textFiltering?: TextFilteringConfig;

  // Processing configuration
  processing?: ProcessingConfig;

  // Caching configuration
  caching?: CacheConfig;

  // Response configuration
  response?: ResponseConfig;
}

export interface MuzzleOptions {
  config?: MuzzleConfig;
  customCache?: CacheBackend;
}

// Text Filtering Types
export interface ParameterHandlingConfig {
  // Default parameter values for words without explicit parameters
  defaultParameters?: WordParameters;

  // Whether to include parameters in filter results
  includeParametersInResults?: boolean;

  // Parameter validation rules
  parameterValidation?: {
    // Required parameters
    required?: string[];

    // Allowed parameter types
    allowedTypes?: Record<string, 'string' | 'number' | 'boolean'>;

    // Parameter value constraints
    constraints?: Record<
      string,
      {
        min?: number;
        max?: number;
        enum?: any[];
        pattern?: string;
      }
    >;
  };

  // Severity mapping based on parameters
  severityMapping?: {
    // Default severity for words without explicit severity
    defaultSeverity?: number;

    // Severity mapping by parameter values
    byParameter?: Record<string, Record<string, number>>;

    // Severity mapping by word type
    byType?: Record<string, number>;
  };

  // Whether to automatically convert non-parameterized words
  autoConvertNonParameterized?: boolean;
}

export interface TextFilteringConfig {
  // Default matching options
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  useRegex?: boolean;

  // Word list configuration
  bannedWordsSource?: BannedWordsSource;

  // Performance options
  maxTextLength?: number;
  preprocessText?: boolean;

  // Parameter handling configuration
  parameterHandling?: ParameterHandlingConfig;
}

export interface BannedWordsSource {
  // Source type
  type: 'string' | 'array' | 'file' | 'url' | 'default';

  // For string type
  string?: string;

  // For array type
  array?: string[];

  // For file type
  filePath?: string;

  // For URL type
  url?: string;

  // For dynamic sources (file, url)
  refreshInterval?: number; // in milliseconds
  format?: 'json' | 'text' | 'csv';

  // Caching configuration
  cache?: boolean;
  cacheKey?: string;
  ttl?: number; // in milliseconds

  // Matching options (overrides global)
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  useRegex?: boolean;

  // Parameter handling configuration (overrides global)
  parameterHandling?: ParameterHandlingConfig;

  // Additional configuration
  config?: Record<string, any>;
}

export interface TextFilterOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  useRegex?: boolean;
}

export interface TextMatchResult {
  matched: boolean;
  matches: TextMatch[];
  severity?: number;
  error?: string;
}

export interface TextMatch {
  word: string;
  position: {
    start: number;
    end: number;
  };
  line?: number;
  column?: number;
  context: string; // Surrounding text
  severity?: number;
  parameters?: WordParameters; // Parameters associated with the matched word
}

// Caching Types
export interface CacheConfig {
  // Default TTL in milliseconds
  defaultTTL?: number;

  // Maximum cache size
  maxSize?: number;

  // Cleanup interval
  cleanupInterval?: number;

  // Storage backend configuration
  backend?: {
    type: 'memory' | 'file' | 'custom';
    config?: Record<string, any>;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  keys: string[];
}

export interface CacheBackend {
  // Initialize the cache
  initialize(config?: Record<string, any>): Promise<void>;

  // Get a value from cache
  get(key: string): Promise<any>;

  // Set a value in cache
  set(key: string, value: any, ttl?: number): Promise<void>;

  // Delete a value from cache
  delete(key: string): Promise<void>;

  // Check if a key exists
  has(key: string): Promise<boolean>;

  // Clear all cache entries
  clear(): Promise<void>;

  // Get cache statistics
  getStats?(): Promise<CacheStats>;

  // Cleanup resources
  dispose?(): void;
}

// Response Framework Types
export interface ResponseConfig {
  // Response format
  format?: 'simple' | 'detailed' | 'json' | 'xml' | 'custom';

  // Include matched content
  includeMatches?: boolean;

  // Include severity scores
  includeSeverity?: boolean;

  // Include metadata
  includeMetadata?: boolean;

  // Custom response formatter
  formatter?: (result: FilterResult) => any;
}

export interface ResponseFormatOptions {
  format?: 'simple' | 'detailed' | 'json' | 'xml' | 'custom';
}

export interface FilterResult {
  // Overall result
  passed: boolean;

  // Text filtering results
  text?: TextMatchResult;

  // Combined severity score
  severity: number;

  // Metadata
  metadata?: {
    processingTime: number;
    timestamp: Date;
    version: string;
    [key: string]: any;
  };
}

export interface ViolationReport {
  // Violation type
  type: 'text';

  // Severity level
  severity: number;

  // Violation details
  details: {
    text?: TextViolationDetails;
  };

  // Recommendations
  recommendations?: string[];

  // Timestamp
  timestamp: Date;
}

export interface TextViolationDetails {
  // Matched words/phrases
  matches: TextMatch[];

  // Word lists that triggered violations
  source: string;

  // Context snippets
  snippets: string[];
}

// Processing Engine Types
export interface ProcessingConfig {
  // Asynchronous processing
  async?: boolean;

  // Batch processing
  batch?: {
    enabled: boolean;
    size: number;
    timeout: number; // in milliseconds
  };

  // Concurrency limits
  concurrency?: {
    max: number;
    queueSize?: number;
  };

  // Timeout settings
  timeout?: {
    text?: number;
    overall?: number;
  };
}

export interface ProcessorStatus {
  running: boolean;
  pending: number;
  completed: number;
  failed: number;
  concurrency: number;
}

export interface BatchStatus {
  size: number;
  maxSize: number;
  processing: boolean;
  lastProcessed?: Date;
}

export interface BatchResult<T> {
  item: T;
  result: any;
  success: boolean;
  error?: Error;
  processingTime: number;
}

// Severity Scoring Types
export interface SeverityConfig {
  // Severity thresholds
  thresholds?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };

  // Scoring weights
  weights?: {
    text: number;
  };

  // Custom scoring rules
  rules?: SeverityRule[];
}

export interface SeverityRule {
  // Rule name
  name: string;

  // Rule condition
  condition: (matches: TextMatch[]) => boolean;

  // Severity score when condition matches
  score: number;

  // Rule priority (higher = higher priority)
  priority?: number;
}

// System Status Types
export interface MuzzleStatus {
  initialized: boolean;
  textFilter: {
    ready: boolean;
    wordListSource: Record<string, any>;
  };
  processing: ProcessorStatus;
}

// URL Fetching Types
export interface URLFetchOptions {
  format?: 'json' | 'text' | 'csv';
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

// Interface for all providers
export interface WordListProvider {
  // Initialize the provider
  initialize(config: BannedWordsSource): Promise<void>;

  // Get the current word list (backward compatibility)
  getWords(): Promise<string[]>;

  // Get the current parameterized word list
  getParameterizedWords?(): Promise<ParameterizedWord[]>;

  // Refresh the word list (for dynamic lists)
  refresh?(): Promise<void>;

  // Check if the provider is ready
  isReady(): boolean;

  // Cleanup resources
  dispose?(): void;
}

// Interface for severity scoring
export interface SeverityScorer {
  // Calculate severity for text matches
  calculateTextSeverity(matches: TextMatch[]): number;
}

// Interface for response formatting
export interface ResponseFormatter {
  format(result: FilterResult): any;
}

// Matching strategy interface
export interface MatchingStrategy {
  match(text: string, pattern: string, options: TextFilterOptions): MatchPosition[];
}

export interface MatchPosition {
  start: number;
  end: number;
}

// Parameterized word definitions
export interface WordParameters {
  // Required parameter for word type
  type: string;

  // Additional optional parameters for extensibility
  [key: string]: any;
}

// Interface for parameterized word entries
export interface ParameterizedWord {
  // The actual word to match
  word: string;

  // Parameters associated with the word
  parameters: WordParameters;
}
