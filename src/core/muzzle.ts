/**
 * Main Muzzle class for the text filtering system
 *
 * This file contains the core Muzzle class that serves as the primary entry point for the text filtering system.
 * It provides methods for filtering text content, managing configuration, and handling batch processing.
 * The class follows a modular architecture with separate components for text filtering, response generation,
 * and processing engine management.
 */

import {
  MuzzleConfig,
  MuzzleOptions,
  TextFilterOptions,
  FilterResult,
  TextMatchResult,
  ViolationReport,
  MuzzleStatus,
  ResponseFormatOptions,
  ReplacementConfig,
  TextMatch,
} from '../types';

import { DEFAULT_CONFIG, ConfigValidator } from './config';
import { TextFilter } from '../modules/text-filter';
import { ReplacementEngine } from '../modules/replacement/replacement-engine';

/**
 * Main class for the Muzzle text filtering system
 *
 * The Muzzle class provides the primary interface for text filtering and content moderation.
 * It manages the entire filtering pipeline including text analysis, response generation,
 * and batch processing capabilities.
 *
 * @example
 * ```typescript
 * const muzzle = new Muzzle({
 *   config: {
 *     textFiltering: {
 *       caseSensitive: false,
 *       wholeWord: true
 *     }
 *   }
 * });
 *
 * await muzzle.initialize();
 * const result = await muzzle.filterText('This is some text to filter');
 * console.log(result);
 * ```
 */
export class Muzzle {
  private config: MuzzleConfig;
  private textFilter?: TextFilter;
  private replacementEngine?: ReplacementEngine;
  private responseFramework?: any;
  private processingEngine?: any;
  private initialized = false;

  /**
   * Creates a new Muzzle instance with the specified configuration
   *
   * @param options - Configuration options for the Muzzle system
   * @param options.config - Configuration object that overrides default settings
   * @throws {Error} When configuration validation fails
   */
  constructor(options: MuzzleOptions = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options.config,
    };

    // Validate configuration
    const validation = ConfigValidator.validate(this.config);
    if (validation.errors.length > 0) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0 && this.config.debug) {
      console.warn('Configuration warnings:', validation.warnings);
    }

    // Initialize modules with placeholder implementations
    this.initializeModules(options);
  }

  /**
   * Initializes the internal modules of the Muzzle system
   *
   * This method sets up the text filter, response framework, and processing engine
   * with the provided configuration. Each module is initialized with placeholder
   * implementations that can be overridden or extended.
   *
   * @param options - Configuration options for module initialization
   * @private
   */
  private initializeModules(options: MuzzleOptions): void {
    // Initialize text filter
    this.textFilter = new TextFilter(this.config.textFiltering || {});
    
    // Initialize replacement engine
    this.replacementEngine = new ReplacementEngine();

    // Initialize response framework
    this.responseFramework = {
      /**
       * Generates a standardized response from text filtering results
       * @param textResult - The result from text filtering
       * @returns Formatted response with pass/fail status and metadata
       */
      generateResponse: (textResult?: any) => ({
        passed: !textResult?.matched,
        severity: textResult?.severity || 0,
        text: textResult,
        metadata: {
          processingTime: 0,
          timestamp: new Date(),
          version: '1.0.0',
        },
      }),
      /**
       * Generates a detailed violation report for filtered content
       * @param result - The filtering result to report on
       * @returns Structured violation report with details and recommendations
       */
      generateViolationReport: (result: any) => ({
        type: 'text' as const,
        severity: 0,
        details: {},
        recommendations: [],
        timestamp: new Date(),
      }),
      /**
       * Formats the response according to the specified format
       * @param result - The result to format
       * @param format - The desired output format
       * @returns Formatted response
       */
      formatResponse: (result: any, format?: string) => result,
    };

    // Placeholder for processing engine implementation
    this.processingEngine = {
      /**
       * Processes a single task asynchronously
       * @param task - The task function to execute
       * @returns Promise that resolves with the task result
       */
      process: async <T>(task: () => Promise<T>) => task(),
      /**
       * Processes multiple tasks in batch
       * @param tasks - Array of task functions to execute
       * @param options - Batch processing options
       * @returns Promise that resolves with array of task results
       */
      processBatch: async <T>(tasks: Array<() => Promise<T>>, options?: any) =>
        Promise.all(tasks.map(task => task())),
      /**
       * Gets the current status of the processing engine
       * @returns Status object with processing statistics
       */
      getStatus: () => ({
        running: false,
        pending: 0,
        completed: 0,
        failed: 0,
        concurrency: 0,
      }),
    };
  }

  /**
   * Initialize the Muzzle system
   *
   * This method initializes all internal modules and prepares the system for operation.
   * It must be called before any filtering operations can be performed. The method
   * is idempotent and can be called multiple times without side effects.
   *
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} When initialization fails
   *
   * @example
   * ```typescript
   * const muzzle = new Muzzle();
   * await muzzle.initialize();
   * // System is now ready for filtering operations
   * ```
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize all modules
      const initPromises = [this.textFilter?.initialize()];

      await Promise.all(initPromises);

      this.initialized = true;

      if (this.config.debug) {
        console.log('Muzzle initialized successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize Muzzle:', errorMessage);
      throw error;
    }
  }

  /**
   * Filter text content for inappropriate or banned words
   *
   * This is the core filtering method that analyzes text content against configured
   * word lists and filtering rules. It returns detailed information about any matches found.
   *
   * @param text - The text content to filter
   * @param options - Optional filtering parameters to override defaults
   * @returns Promise that resolves with filtering results including matches and severity
   * @throws {Error} When text filtering is not available or system is not initialized
   *
   * @example
   * ```typescript
   * const result = await muzzle.filterText('This text contains bad words');
   * console.log(result.matched); // true if matches found
   * console.log(result.matches); // array of match details
   * ```
   */
  async filterText(text: string, options?: TextFilterOptions): Promise<TextMatchResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.textFilter) {
      throw new Error('Text filtering is not available');
    }

    // Get the basic filtering result
    const result = (
      this.processingEngine?.process(() => this.textFilter!.filter(text, options)) ||
      this.textFilter.filter(text, options)
    );

    // Apply text replacement if configured
    const replacementConfig = options?.replacement || this.config.replacement;
    if (replacementConfig?.enabled && result.matches) {
      const replacementResult = this.replacementEngine!.applyReplacements(
        text,
        result.matches,
        replacementConfig
      );
      
      // Update the result with replacement information
      result.matches = result.matches.map((match: TextMatch) => {
        const replacedMatch = replacementResult.replacedMatches.find((rm: any) =>
          rm.position.start === match.position.start && rm.position.end === match.position.end
        );
        return replacedMatch || match;
      });
    }

    return result;
  }

  /**
   * Filter text content with response formatting
   *
   * This method provides a complete filtering pipeline including text analysis,
   * response generation, and optional formatting. It returns a standardized
   * FilterResult object that can be customized with response options.
   *
   * @param text - Optional text content to filter
   * @param options - Configuration options for text filtering and response formatting
   * @param options.text - Text filtering options
   * @param options.response - Response formatting options
   * @returns Promise that resolves with formatted filter result
   *
   * @example
   * ```typescript
   * const result = await muzzle.filterContent('Text to filter', {
   *   text: { caseSensitive: false },
   *   response: { format: 'detailed' }
   * });
   * console.log(result.passed); // true if content passed filtering
   * ```
   */
  async filterContent(
    text?: string,
    options?: {
      text?: TextFilterOptions;
      response?: ResponseFormatOptions;
      replacement?: ReplacementConfig;
    }
  ): Promise<FilterResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Process text
    const textResult = text
      ? await this.filterTextWithReplacement(text, options?.text)
      : Promise.resolve(undefined);

    // Generate response
    const response = this.responseFramework!.generateResponse(textResult);

    // Apply response formatting options
    if (options?.response) {
      return this.responseFramework!.formatResponse(response, options.response.format);
    }

    return response;
  }

  /**
   * Filter multiple content items in batch
   *
   * This method processes multiple filtering requests efficiently, with support
   * for concurrent processing and configurable batch options. It's ideal for
   * processing large volumes of content in a single operation.
   *
   * @param items - Array of content items to filter
   * @param items.text - Text content to filter (optional)
   * @param items.options - Filtering and response options for each item
   * @param batchOptions - Batch processing configuration
   * @param batchOptions.concurrency - Maximum number of concurrent operations
   * @param batchOptions.timeout - Timeout for batch processing in milliseconds
   * @returns Promise that resolves with array of filter results
   *
   * @example
   * ```typescript
   * const items = [
   *   { text: 'First text to filter' },
   *   { text: 'Second text to filter' }
   * ];
   * const results = await muzzle.filterBatch(items, {
   *   concurrency: 5,
   *   timeout: 30000
   * });
   * ```
   */
  async filterBatch(
    items: Array<{
      text?: string;
      options?: {
        text?: TextFilterOptions;
        response?: ResponseFormatOptions;
      };
    }>,
    batchOptions?: {
      concurrency?: number;
      timeout?: number;
    }
  ): Promise<FilterResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return (
      this.processingEngine?.processBatch(
        items.map(item => () => this.filterContent(item.text, item.options)),
        batchOptions
      ) || Promise.all(items.map(item => this.filterContent(item.text, item.options)))
    );
  }

  /**
   * Generate a violation report for filtered content
   *
   * This method analyzes content and generates a detailed violation report
   * that includes information about the type of violation, severity level,
   * specific details, and recommendations for handling the violation.
   *
   * @param text - Optional text content to analyze
   * @param options - Text filtering options
   * @returns Promise that resolves with detailed violation report
   *
   * @example
   * ```typescript
   * const report = await muzzle.generateViolationReport('Inappropriate content');
   * console.log(report.type); // 'text'
   * console.log(report.severity); // severity level
   * console.log(report.recommendations); // handling recommendations
   * ```
   */
  async generateViolationReport(
    text?: string,
    options?: {
      text?: TextFilterOptions;
    }
  ): Promise<ViolationReport> {
    const result = await this.filterContent(text, options);
    return this.responseFramework!.generateViolationReport(result);
  }

  /**
   * Refresh dynamic word lists and cached data
   *
   * This method updates the system's word lists and clears stale cached data.
   * It's useful when word lists are configured to refresh from external sources
   * or when you need to ensure the latest filtering rules are applied.
   *
   * @returns Promise that resolves when refresh is complete
   *
   * @example
   * ```typescript
   * await muzzle.refresh();
   * // Word lists and cache are now updated
   * ```
   */
  async refresh(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.textFilter?.refreshWordLists();

    // Additional refresh logic can be added here
  }

  /**
   * Get system status and statistics
   *
   * This method provides comprehensive information about the current state
   * of the Muzzle system, including initialization status, module readiness,
   * word list statistics, and processing engine metrics.
   *
   * @returns Promise that resolves with system status information
   *
   * @example
   * ```typescript
   * const status = await muzzle.getStatus();
   * console.log(status.initialized); // true if system is initialized
   * console.log(status.textFilter.ready); // true if text filter is ready
   * console.log(status.processing); // processing engine statistics
   * ```
   */
  async getStatus(): Promise<MuzzleStatus> {
    return {
      initialized: this.initialized,
      textFilter: {
        ready: this.textFilter ? true : false,
        wordListSource: (await this.textFilter?.getWordListStats()) || {},
      },
      processing: this.processingEngine?.getStatus() || {
        running: false,
        pending: 0,
        completed: 0,
        failed: 0,
        concurrency: 0,
      },
    };
  }

  /**
   * Update configuration dynamically
   *
   * This method allows you to update the system configuration after initialization.
   * It validates the new configuration and reinitializes the system with the
   * updated settings if the system was already initialized.
   *
   * @param config - Partial configuration object with updated values
   * @returns Promise that resolves when configuration update is complete
   * @throws {Error} When the new configuration is invalid
   *
   * @example
   * ```typescript
   * await muzzle.updateConfig({
   *   textFiltering: {
   *     caseSensitive: true,
   *     wholeWord: false
   *   }
   * });
   * // Configuration updated and system reinitialized
   * ```
   */
  async updateConfig(config: Partial<MuzzleConfig>): Promise<void> {
    // Validate new configuration
    const validation = ConfigValidator.validate({ ...this.config, ...config });
    if (validation.errors.length > 0) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.config = { ...this.config, ...config };

    // Reinitialize modules with new configuration
    if (this.initialized) {
      // Dispose existing modules
      this.dispose();

      // Reinitialize modules
      this.initializeModules({
        config: this.config,
      });

      // Reinitialize the system
      await this.initialize();
    }
  }

  /**
   * Clean up resources and dispose of the Muzzle instance
   *
   * This method properly releases all resources held by the Muzzle system,
   * including text filter resources and any cached data. It should be called
   * when the Muzzle instance is no longer needed to prevent memory leaks.
   *
   * @example
   * ```typescript
   * muzzle.dispose();
   * // All resources have been released
   * ```
   */
  dispose(): void {
    this.textFilter?.dispose();
    this.initialized = false;

    if (this.config.debug) {
      console.log('Muzzle disposed');
    }
  }

  /**
   * Filter text with optional replacement configuration
   *
   * This method filters text and applies replacement strategies based on the provided configuration.
   * It allows for per-request customization of replacement behavior.
   *
   * @param text - The text content to filter
   * @param textOptions - Text filtering options
   * @param replacementConfig - Replacement configuration (overrides global if provided)
   * @returns Promise that resolves with filtering results including replacements
   * @private
   */
  private async filterTextWithReplacement(
    text: string,
    textOptions?: TextFilterOptions,
    replacementConfig?: ReplacementConfig
  ): Promise<TextMatchResult> {
    // Get the basic filtering result
    const result = await this.filterText(text, textOptions);

    // Apply text replacement if configured
    const configToUse = replacementConfig || this.config.replacement;
    if (configToUse?.enabled) {
      const replacementResult = this.replacementEngine!.applyReplacements(
        text,
        result.matches,
        configToUse
      );
      
      // Update the result with replacement information
      result.matches = result.matches.map(match => {
        const replacedMatch = replacementResult.replacedMatches.find((rm: any) =>
          rm.position.start === match.position.start && rm.position.end === match.position.end
        );
        return replacedMatch || match;
      });
    }

    return result;
  }

  /**
   * Get the modified text with replacements applied
   *
   * This method returns the text after all replacements have been applied,
   * which can be useful for displaying the filtered content to users.
   *
   * @param text - The original text to process
   * @param options - Filtering and replacement options
   * @returns Promise that resolves with the modified text
   */
  async getFilteredText(
    text: string,
    options?: {
      text?: TextFilterOptions;
      replacement?: ReplacementConfig;
    }
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const replacementConfig = options?.replacement || (this.config as any).replacement;
    
    if (!replacementConfig?.enabled) {
      return text;
    }

    // Get matches and apply replacements
    const textResult = await this.filterTextWithReplacement(
      text,
      options?.text,
      replacementConfig
    );

    const replacementResult = this.replacementEngine!.applyReplacements(
      text,
      textResult.matches,
      replacementConfig
    );

    return replacementResult.modifiedText;
  }
}
