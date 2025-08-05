/**
 * Configuration system for the Muzzle content filtering system
 */

import { MuzzleConfig, ValidationResult } from '../types';

// Import Node.js modules
const fs = require('fs');
const path = require('path');

/**
 * Configuration validator for Muzzle
 */
export class ConfigValidator {
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

    return { errors, warnings };
  }

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

  private static validateResponse(config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate format
    if (config.format && !['simple', 'detailed', 'json', 'xml'].includes(config.format)) {
      errors.push('Invalid response format');
    }

    return { errors, warnings };
  }

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
}

/**
 * Configuration loader for Muzzle
 */
export class ConfigLoader {
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
};
