/**
 * Main Muzzle class for the text filtering system
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
} from '../types';

import { DEFAULT_CONFIG, ConfigValidator } from './config';
import { TextFilter } from '../modules/text-filter';

/**
 * Main class for the Muzzle text filtering system
 */
export class Muzzle {
  private config: MuzzleConfig;
  private textFilter?: TextFilter;
  private responseFramework?: any;
  private processingEngine?: any;
  private initialized = false;

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

  private initializeModules(options: MuzzleOptions): void {
    // Initialize text filter
    this.textFilter = new TextFilter(this.config.textFiltering || {});

    // Initialize response framework
    this.responseFramework = {
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
      generateViolationReport: (result: any) => ({
        type: 'text' as const,
        severity: 0,
        details: {},
        recommendations: [],
        timestamp: new Date(),
      }),
      formatResponse: (result: any, format?: string) => result,
    };

    // Placeholder for processing engine implementation
    this.processingEngine = {
      process: async <T>(task: () => Promise<T>) => task(),
      processBatch: async <T>(tasks: Array<() => Promise<T>>, options?: any) =>
        Promise.all(tasks.map(task => task())),
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
   * Filter text content
   */
  async filterText(text: string, options?: TextFilterOptions): Promise<TextMatchResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.textFilter) {
      throw new Error('Text filtering is not available');
    }

    return (
      this.processingEngine?.process(() => this.textFilter!.filter(text, options)) ||
      this.textFilter.filter(text, options)
    );
  }

  /**
   * Filter text content with response formatting
   */
  async filterContent(
    text?: string,
    options?: {
      text?: TextFilterOptions;
      response?: ResponseFormatOptions;
    }
  ): Promise<FilterResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Process text
    const textResult = text
      ? await this.filterText(text, options?.text)
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
   * Update configuration
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
   * Clean up resources
   */
  dispose(): void {
    this.textFilter?.dispose();
    this.initialized = false;

    if (this.config.debug) {
      console.log('Muzzle disposed');
    }
  }
}
