/**
 * Configuration system for the Muzzle content filtering system
 *
 * This file provides comprehensive configuration management for the Muzzle system,
 * including validation, loading from various sources (files, environment variables),
 * and default configuration definitions. The configuration system ensures that
 * all settings are properly validated and provides detailed error reporting.
 *
 * @module config
 * @description Configuration management system for Muzzle with validation and loading capabilities
 */

import { MuzzleConfig, ValidationResult, ReplacementConfig } from '../types';

// Import Node.js modules
const fs = require('fs');
const path = require('path');

/**
 * Configuration validator for Muzzle
 *
 * This class provides static methods for validating Muzzle configuration objects.
 * It performs comprehensive validation of all configuration sections and provides
 * detailed error and warning messages to help users correct configuration issues.
 *
 * @example
 * ```typescript
 * const config = { textFiltering: { caseSensitive: true } };
 * const validation = ConfigValidator.validate(config);
 * if (validation.errors.length > 0) {
 *   console.error('Configuration errors:', validation.errors);
 * }
 * if (validation.warnings.length > 0) {
 *   console.warn('Configuration warnings:', validation.warnings);
 * }
 * ```
 */
export class ConfigValidator {
  /**
   * Validates a Muzzle configuration object
   *
   * This method performs comprehensive validation of all configuration sections
   * including text filtering, processing, response, and caching settings.
   * It returns detailed error and warning messages for any issues found.
   *
   * @param config - Partial configuration object to validate
   * @returns ValidationResult object containing arrays of errors and warnings
   *
   * @example
   * ```typescript
   * const config = {
   *   textFiltering: {
   *     bannedWordsSource: { type: 'file' } // Missing filePath
   *   }
   * };
   * const result = ConfigValidator.validate(config);
   * // result.errors will contain ['File banned words source requires a file path']
   * ```
   */
  static validate(config: Partial<MuzzleConfig>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate text filtering configuration
    if (config.textFiltering) {
      const textValidation = this.validateTextFiltering(config.textFiltering);
      errors.push(...textValidation.errors);
      warnings.push(...textValidation.warnings);
    }

    // Validate processing configuration
    if (config.processing) {
      const processingValidation = this.validateProcessing(config.processing);
      errors.push(...processingValidation.errors);
      warnings.push(...processingValidation.warnings);
    }

    // Validate response configuration
    if (config.response) {
      const responseValidation = this.validateResponse(config.response);
      errors.push(...responseValidation.errors);
      warnings.push(...responseValidation.warnings);
    }

    // Validate caching configuration
    if (config.caching) {
      const cachingValidation = this.validateCaching(config.caching);
      errors.push(...cachingValidation.errors);
      warnings.push(...cachingValidation.warnings);
    }

    // Validate replacement configuration
    if (config.replacement) {
      const replacementValidation = this.validateReplacement(config.replacement);
      errors.push(...replacementValidation.errors);
      warnings.push(...replacementValidation.warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validates text filtering configuration
   *
   * This method validates all aspects of text filtering configuration including
   * banned words sources, text length limits, and other text-related settings.
   *
   * @param config - Text filtering configuration object to validate
   * @returns ValidationResult with errors and warnings specific to text filtering
   * @private
   */
  private static validateTextFiltering(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate banned words source
    if (config.bannedWordsSource) {
      const source = config.bannedWordsSource;

      if (source.type === 'string' && source.string === undefined) {
        errors.push('String banned words source requires a string value');
      }

      if (source.type === 'array' && (!source.array || !Array.isArray(source.array))) {
        errors.push('Array banned words source requires an array value');
      }

      if (source.type === 'file' && !source.filePath) {
        errors.push('File banned words source requires a file path');
      }

      if (source.type === 'url' && !source.url) {
        errors.push('URL banned words source requires a URL');
      }

      if (
        (source.type === 'file' || source.type === 'url') &&
        source.refreshInterval &&
        source.refreshInterval < 60000
      ) {
        warnings.push('Refresh interval less than 1 minute may cause excessive requests');
      }
    }

    // Validate text length
    if (config.maxTextLength && config.maxTextLength > 10000000) {
      warnings.push('Very large max text length may impact performance');
    }

    return { errors, warnings };
  }

  /**
   * Validates processing configuration
   *
   * This method validates processing-related settings including concurrency limits,
   * batch processing configuration, and timeout settings.
   *
   * @param config - Processing configuration object to validate
   * @returns ValidationResult with errors and warnings specific to processing
   * @private
   */
  private static validateProcessing(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate concurrency
    if (config.concurrency) {
      if (config.concurrency.max < 1) {
        errors.push('Max concurrency must be at least 1');
      }

      if (config.concurrency.max > 100) {
        warnings.push('Very high concurrency may impact system stability');
      }
    }

    // Validate batch configuration
    if (config.batch) {
      if (config.batch.size < 1) {
        errors.push('Batch size must be at least 1');
      }

      if (config.batch.size > 1000) {
        warnings.push('Very large batch size may impact performance');
      }
    }

    return { errors, warnings };
  }

  /**
   * Validates response configuration
   *
   * This method validates response formatting settings including format types
   * and output options.
   *
   * @param config - Response configuration object to validate
   * @returns ValidationResult with errors and warnings specific to response formatting
   * @private
   */
  private static validateResponse(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate format
    if (config.format && !['simple', 'detailed', 'json', 'xml'].includes(config.format)) {
      errors.push('Invalid response format');
    }

    return { errors, warnings };
  }

  /**
   * Validates caching configuration
   *
   * This method validates caching-related settings including TTL values,
   * cache size limits, and cleanup intervals.
   *
   * @param config - Caching configuration object to validate
   * @returns ValidationResult with errors and warnings specific to caching
   * @private
   */
  private static validateCaching(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate TTL
    if (config.defaultTTL && config.defaultTTL < 1000) {
      warnings.push('Very short TTL may cause excessive cache refreshes');
    }

    // Validate max size
    if (config.maxSize && config.maxSize < 100) {
      warnings.push('Very small cache size may cause frequent evictions');
    }

    return { errors, warnings };
  }

  /**
   * Validates replacement configuration
   *
   * This method validates replacement-related settings including strategy selection,
   * custom strings, and other replacement options.
   *
   * @param config - Replacement configuration object to validate
   * @returns ValidationResult with errors and warnings specific to replacement
   * @private
   */
  private static validateReplacement(config: ReplacementConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate strategy
    if (config.strategy && !['asterisks', 'custom', 'remove', 'none'].includes(config.strategy)) {
      errors.push('Invalid replacement strategy');
    }

    // Validate custom string for custom strategy
    if (config.strategy === 'custom' && !config.customString) {
      errors.push('Custom replacement strategy requires a custom string');
    }

    // Validate custom string length
    if (config.customString && config.customString.length > 1000) {
      warnings.push('Very long custom replacement string may impact performance');
    }

    // Validate asterisk count
    if (config.asteriskCount && typeof config.asteriskCount !== 'number' && config.asteriskCount !== 'full') {
      errors.push('Asterisk count must be a number or "full"');
    }

    // Validate asterisk character
    if (config.asteriskChar && config.asteriskChar.length !== 1) {
      errors.push('Asterisk character must be a single character');
    }

    return { errors, warnings };
  }
}

/**
 * Configuration loader for Muzzle
 *
 * This class provides static methods for loading configuration from various sources
 * including files (JSON, JavaScript) and environment variables. It supports
 * hierarchical configuration merging where environment variables can override
 * file-based settings.
 *
 * @example
 * ```typescript
 * // Load configuration from file and environment variables
 * const config = await ConfigLoader.load('./config.json', 'MUZZLE_');
 * console.log(config.debug); // Value from file or environment
 * ```
 */
export class ConfigLoader {
  /**
   * Loads configuration from multiple sources with environment variable override
   *
   * This method loads configuration from a specified file (if provided) and then
   * overrides any settings with environment variables. Environment variables take
   * precedence over file-based configuration.
   *
   * @param configPath - Optional path to configuration file (JSON or JS)
   * @param envPrefix - Prefix for environment variables (default: 'MUZZLE_')
   * @returns Promise that resolves with merged configuration object
   * @throws {Error} When configuration file cannot be loaded or parsed
   *
   * @example
   * ```typescript
   * // Load from config.json with MUZZLE_ environment variable prefix
   * const config = await ConfigLoader.load('./config.json');
   *
   * // Load with custom environment variable prefix
   * const config = await ConfigLoader.load('./config.json', 'APP_');
   *
   * // Load only from environment variables
   * const config = await ConfigLoader.load();
   * ```
   */
  static async load(configPath?: string, envPrefix = 'MUZZLE_'): Promise<MuzzleConfig> {
    const config: MuzzleConfig = {};

    // Load from file if provided
    if (configPath) {
      const fileConfig = await this.loadFromFile(configPath);
      Object.assign(config, fileConfig);
    }

    // Load from environment variables
    const envConfig = this.loadFromEnvironment(envPrefix);
    Object.assign(config, envConfig);

    return config;
  }

  /**
   * Loads configuration from a file
   *
   * This method loads configuration from either JSON or JavaScript files.
   * It handles file resolution, parsing, and error handling for unsupported formats.
   * JavaScript files can export either a configuration object or a function that
   * returns a configuration object.
   *
   * @param configPath - Path to the configuration file
   * @returns Promise that resolves with partial configuration object
   * @throws {Error} When file is not found, cannot be parsed, or format is unsupported
   * @private
   *
   * @example
   * ```typescript
   * // Load from JSON file
   * const config = await ConfigLoader['loadFromFile']('./config.json');
   *
   * // Load from JavaScript file
   * const config = await ConfigLoader['loadFromFile']('./config.js');
   * ```
   */
  private static async loadFromFile(configPath: string): Promise<Partial<MuzzleConfig>> {
    try {
      // Check if we're in a browser environment
      if (typeof (globalThis as any).window !== 'undefined') {
        throw new Error('File-based configuration is not supported in browser environment');
      }

      // Resolve the config path
      const resolvedPath = path.resolve(configPath);

      // Check if file exists
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Configuration file not found: ${resolvedPath}`);
      }

      // Read file content
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');

      // Determine file format by extension
      const ext = path.extname(resolvedPath).toLowerCase();
      let config: Partial<MuzzleConfig> = {};

      switch (ext) {
        case '.json':
          try {
            config = JSON.parse(fileContent);
          } catch (parseError) {
            throw new Error(
              `Invalid JSON in configuration file: ${
                parseError instanceof Error ? parseError.message : String(parseError)
              }`
            );
          }
          break;

        case '.js':
          try {
            // For JS files, we need to be careful about execution
            const configModule = eval(`(${fileContent})`);
            config = typeof configModule === 'function' ? configModule() : configModule;
          } catch (execError) {
            throw new Error(
              `Error executing JS configuration file: ${
                execError instanceof Error ? execError.message : String(execError)
              }`
            );
          }
          break;

        default:
          throw new Error(
            `Unsupported configuration file format: ${ext}. Supported formats: .json, .js`
          );
      }

      return config;
    } catch (error) {
      throw new Error(
        `Failed to load config from ${configPath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Loads configuration from environment variables
   *
   * This method extracts configuration values from environment variables using
   * a specified prefix. It supports all major configuration sections including
   * global settings, text filtering, processing, and caching options.
   *
   * Supported environment variables:
   * - {PREFIX}DEBUG: Enable debug mode (true/false)
   * - {PREFIX}LOG_LEVEL: Set logging level (error/warn/info/debug)
   * - {PREFIX}TEXT_CASE_SENSITIVE: Enable case-sensitive text filtering (true/false)
   * - {PREFIX}TEXT_WHOLE_WORD: Enable whole-word matching (true/false)
   * - {PREFIX}PROCESSING_CONCURRENCY: Set maximum concurrency (number)
   * - {PREFIX}CACHE_TTL: Set cache TTL in milliseconds (number)
   *
   * @param prefix - Prefix for environment variables (e.g., 'MUZZLE_')
   * @returns Partial configuration object with values from environment variables
   * @private
   *
   * @example
   * ```typescript
   * // With environment variables set:
   * // MUZZLE_DEBUG=true
   * // MUZZLE_LOG_LEVEL=debug
   * // MUZZLE_TEXT_CASE_SENSITIVE=false
   *
   * const config = ConfigLoader['loadFromEnvironment']('MUZZLE_');
   * console.log(config.debug); // true
   * console.log(config.logLevel); // 'debug'
   * console.log(config.textFiltering?.caseSensitive); // false
   * ```
   */
  private static loadFromEnvironment(prefix: string): Partial<MuzzleConfig> {
    const config: Partial<MuzzleConfig> = {};

    // Check if we're in a Node.js environment
    // Use a type-safe approach to access process.env
    const env = (globalThis as any).process?.env as Record<string, string> | undefined;

    if (env) {
      // Global settings
      if (env[`${prefix}DEBUG`]) {
        config.debug = env[`${prefix}DEBUG`] === 'true';
      }

      if (env[`${prefix}LOG_LEVEL`]) {
        config.logLevel = env[`${prefix}LOG_LEVEL`] as any;
      }

      // Text filtering settings
      if (env[`${prefix}TEXT_CASE_SENSITIVE`]) {
        config.textFiltering = config.textFiltering || {};
        config.textFiltering.caseSensitive = env[`${prefix}TEXT_CASE_SENSITIVE`] === 'true';
      }

      if (env[`${prefix}TEXT_WHOLE_WORD`]) {
        config.textFiltering = config.textFiltering || {};
        config.textFiltering.wholeWord = env[`${prefix}TEXT_WHOLE_WORD`] === 'true';
      }

      // Processing settings
      if (env[`${prefix}PROCESSING_CONCURRENCY`]) {
        config.processing = config.processing || {};
        config.processing.concurrency = {
          max: parseInt(env[`${prefix}PROCESSING_CONCURRENCY`] || '10', 10),
        };
      }

      // Caching settings
      if (env[`${prefix}CACHE_TTL`]) {
        config.caching = config.caching || {};
        const value = env[`${prefix}CACHE_TTL`];
        if (value) {
          config.caching.defaultTTL = parseInt(value, 10);
        }
      }
    }

    return config;
  }
}

/**
 * Default configuration for Muzzle
 *
 * This constant provides the default configuration values used by the Muzzle system.
 * These values are used as the base configuration that can be overridden by user-provided
 * settings through the constructor, configuration files, or environment variables.
 *
 * The default configuration is designed to provide a good balance between performance
 * and accuracy for most common use cases. It includes sensible defaults for text filtering,
 * processing, caching, and response formatting.
 *
 * @example
 * ```typescript
 * // Use default configuration
 * const muzzle = new Muzzle();
 *
 * // Override specific defaults
 * const muzzle = new Muzzle({
 *   config: {
 *     textFiltering: {
 *       caseSensitive: true // Override default of false
 *     }
 *   }
 * });
 * ```
 */
export const DEFAULT_CONFIG: MuzzleConfig = {
  debug: false,
  logLevel: 'info',
  textFiltering: {
    caseSensitive: false,
    wholeWord: true,
    exactPhrase: false,
    useRegex: false,
    bannedWordsSource: {
      type: 'default',
      refreshInterval: 86400000, // 24 hours
      format: 'text',
      cache: true,
      ttl: 86400000, // 24 hours
    },
    maxTextLength: 1000000,
    preprocessText: true,
  },
  processing: {
    async: true,
    batch: {
      enabled: true,
      size: 50,
      timeout: 30000,
    },
    concurrency: {
      max: 10,
      queueSize: 100,
    },
    timeout: {
      text: 10000,
      overall: 30000,
    },
  },
  caching: {
    defaultTTL: 3600000, // 1 hour
    maxSize: 1000,
    cleanupInterval: 300000, // 5 minutes
    backend: {
      type: 'memory',
    },
  },
  response: {
    format: 'detailed',
    includeMatches: true,
    includeSeverity: true,
    includeMetadata: true,
  },
  replacement: {
    enabled: false,
    strategy: 'asterisks',
    customString: '[REDACTED]',
    asteriskChar: '*',
    asteriskCount: 'full',
    preserveBoundaries: true,
    preserveCase: true,
    wholeWordOnly: true,
  },
};
