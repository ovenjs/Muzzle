---
layout: page
title: Configuration Guide
permalink: /configuration/
---

# Configuration Guide

This guide provides detailed information about configuring Muzzle for different use cases and environments.

## Overview

Muzzle uses a flexible configuration system that allows you to customize every aspect of the text filtering behavior. Configuration is done through the `MuzzleConfig` interface, which supports various options for text filtering, processing, caching, and response formatting.

## Basic Configuration Structure

```typescript
interface MuzzleConfig {
  // Global settings
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
```

## Text Filtering Configuration

### Banned Words Sources

Muzzle supports multiple sources for banned words. Each source type has its own configuration options.

#### String Source

Use comma-separated strings for simple word lists.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate'
    }
  }
};
```

**Best for:**
- Small, static word lists
- Quick prototyping
- Simple applications

**Options:**
- `string`: Comma-separated list of banned words

#### Array Source

Use JavaScript arrays for programmatic word lists.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: ['badword', 'profanity', 'swear', 'curse', 'hate']
    }
  }
};
```

**Best for:**
- Dynamically generated word lists
- Multi-language support
- Complex word categorization

**Options:**
- `array`: Array of banned words

#### File Source

Load banned words from local files in various formats.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'file',
      filePath: '/path/to/banned-words.txt',
      format: 'text', // 'text', 'csv', or 'json'
      refreshInterval: 3600000, // 1 hour
      cache: true,
      ttl: 1800000 // 30 minutes
    }
  }
};
```

**Supported Formats:**

**Text Format (.txt):**
```
badword
profanity
swear
curse
```

**CSV Format (.csv):**
```csv
badword
profanity
swear
```

**JSON Format (.json):**
```json
[
  "badword",
  "profanity",
  "swear",
  "curse"
]
```

**Best for:**
- Large word lists
- Shared word lists across applications
- Version-controlled word lists

**Options:**
- `filePath`: Path to the word list file
- `format`: File format ('text', 'csv', or 'json')
- `refreshInterval`: How often to check for file changes (milliseconds)
- `cache`: Whether to cache the word list in memory
- `ttl`: Cache time-to-live (milliseconds)

#### URL Source

Fetch banned words from remote URLs with automatic refresh.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/banned-words.txt',
      format: 'text',
      refreshInterval: 86400000, // 24 hours
      cache: true,
      ttl: 43200000, // 12 hours
      timeout: 10000 // 10 seconds
    }
  }
};
```

**Best for:**
- Centrally managed word lists
- Dynamic word lists that change frequently
- Multi-application deployments

**Options:**
- `url`: URL to fetch the word list from
- `format`: Expected format ('text', 'csv', or 'json')
- `refreshInterval`: How often to refresh the word list (milliseconds)
- `cache`: Whether to cache the word list
- `ttl`: Cache time-to-live (milliseconds)
- `timeout`: Request timeout (milliseconds)

#### Default Source

Use the built-in GitHub profanity words list.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'default',
      refreshInterval: 86400000, // 24 hours
      cache: true,
      ttl: 43200000 // 12 hours
    }
  }
};
```

**Best for:**
- Quick start
- General-purpose content filtering
- Applications without custom word lists

**Options:**
- `refreshInterval`: How often to refresh the word list (milliseconds)
- `cache`: Whether to cache the word list
- `ttl`: Cache time-to-live (milliseconds)

### Matching Options

Configure how words are matched in the text.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity'
    },
    caseSensitive: false,    // Match case-insensitively
    wholeWord: true,        // Match whole words only
    exactPhrase: false,      // Don't require exact phrase matching
    useRegex: false         // Don't use regex patterns
  }
};
```

**Options:**

- `caseSensitive` (boolean, default: false)
  - `true`: Match words with exact case
  - `false`: Match words ignoring case
  
- `wholeWord` (boolean, default: true)
  - `true`: Match only whole words (e.g., "bad" won't match "badminton")
  - `false`: Match partial words (e.g., "bad" will match "badminton")
  
- `exactPhrase` (boolean, default: false)
  - `true`: Match exact phrases only
  - `false`: Match individual words
  
- `useRegex` (boolean, default: false)
  - `true`: Treat banned words as regex patterns
  - `false`: Treat banned words as literal strings

### Performance Options

Configure performance-related settings.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity'
    },
    maxTextLength: 1000000,    // Maximum text length to process
    preprocessText: true      // Preprocess text before filtering
  }
};
```

**Options:**

- `maxTextLength` (number, default: 1000000)
  - Maximum length of text to process (characters)
  - Longer texts will be truncated
  
- `preprocessText` (boolean, default: true)
  - `true`: Normalize whitespace and clean text before processing
  - `false`: Process text as-is

## Parameter Handling Configuration

Configure how parameterized words are handled and processed.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword[type=slur][severity=8],profanity[type=profanity][severity=5]'
    },
    parameterHandling: {
      defaultParameters: {
        type: 'unknown'
      },
      includeParametersInResults: true,
      autoConvertNonParameterized: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'slur': 8,
          'profanity': 5,
          'hate': 9,
          'harassment': 7,
          'violence': 6,
          'adult': 4,
          'unknown': 1
        }
      },
      parameterValidation: {
        required: ['type'],
        allowedTypes: {
          'type': 'string',
          'severity': 'number',
          'blocked': 'boolean'
        },
        constraints: {
          'severity': {
            min: 0,
            max: 10
          }
        }
      }
    }
  }
};
```

### Parameter Handling Options

- `defaultParameters` (object)
  - Default parameters to apply to non-parameterized words
  - Useful for ensuring all words have consistent metadata
  
- `includeParametersInResults` (boolean, default: true)
  - Whether to include word parameters in filter results
  - Set to false to reduce response size if parameters aren't needed
  
- `autoConvertNonParameterized` (boolean, default: true)
  - Whether to automatically convert simple words to parameterized words
  - Ensures backward compatibility with existing word lists
  
- `severityMapping` (object)
  - `defaultSeverity` (number): Default severity level for words without explicit severity
  - `byType` (object): Severity mapping by word type
  
- `parameterValidation` (object)
  - `required` (array): List of required parameter names
  - `allowedTypes` (object): Parameter type validation rules
  - `constraints` (object): Parameter value constraints

### Parameterized Word Formats

Muzzle supports multiple formats for parameterized words:

#### String Format
```typescript
// Simple parameterized words
'badword[type=slur][severity=8]'
'profanity[type=profanity][severity=5][blocked=true]'
```

#### Object Format
```typescript
{
  word: 'hate',
  parameters: {
    type: 'hate',
    severity: 9,
    blocked: true,
    customFlag: 'value'
  }
}
```

#### Mixed Format
```typescript
// Arrays can contain both string and object formats
[
  'badword[type=slur][severity=8]',
  {
    word: 'profanity',
    parameters: {
      type: 'profanity',
      severity: 5
    }
  }
]
```

## Processing Configuration

Configure how text is processed and filtered.

```typescript
const config = {
  processing: {
    async: true,  // Enable asynchronous processing
    batch: {
      enabled: true,
      size: 50,
      timeout: 30000
    },
    concurrency: {
      max: 10,
      queueSize: 100
    },
    timeout: {
      text: 10000,
      overall: 30000
    }
  }
};
```

**Options:**

- `async` (boolean, default: true)
  - Enable asynchronous processing for better performance
  
- `batch` (object)
  - `enabled` (boolean): Enable batch processing
  - `size` (number): Default batch size
  - `timeout` (number): Batch processing timeout (milliseconds)
  
- `concurrency` (object)
  - `max` (number): Maximum concurrent operations
  - `queueSize` (number): Maximum queue size for pending operations
  
- `timeout` (object)
  - `text` (number): Timeout for individual text filtering (milliseconds)
  - `overall` (number): Overall timeout for operations (milliseconds)

## Caching Configuration

Configure caching behavior for improved performance.

```typescript
const config = {
  caching: {
    defaultTTL: 3600000,     // 1 hour
    maxSize: 1000,
    cleanupInterval: 300000, // 5 minutes
    backend: {
      type: 'memory',
      config: {}
    }
  }
};
```

**Options:**

- `defaultTTL` (number, default: 3600000)
  - Default time-to-live for cache entries (milliseconds)
  
- `maxSize` (number, default: 1000)
  - Maximum number of items in cache
  
- `cleanupInterval` (number, default: 300000)
  - Interval for cache cleanup (milliseconds)
  
- `backend` (object)
  - `type` (string): Cache backend type ('memory', 'file', 'custom')
  - `config` (object): Backend-specific configuration

## Response Configuration

Configure how filtering results are formatted and returned.

```typescript
const config = {
  response: {
    format: 'detailed',           // 'simple', 'detailed', 'json', 'xml'
    includeMatches: true,        // Include matched words in response
    includeSeverity: true,       // Include severity scores
    includeMetadata: true,       // Include processing metadata
    formatter: (result) => {
      // Custom response formatter
      return {
        success: !result.text?.matched,
        score: result.severity,
        issues: result.text?.matches || []
      };
    }
  }
};
```

**Options:**

- `format` (string, default: 'detailed')
  - Response format ('simple', 'detailed', 'json', 'xml')
  
- `includeMatches` (boolean, default: true)
  - Include matched words in the response
  
- `includeSeverity` (boolean, default: true)
  - Include severity scores in the response
  
- `includeMetadata` (boolean, default: true)
  - Include processing metadata in the response
  
- `formatter` (function)
  - Custom response formatter function

## Environment Variables

Muzzle can be configured using environment variables with the `MUZZLE_` prefix:

```bash
# Global settings
MUZZLE_DEBUG=true
MUZZLE_LOG_LEVEL=debug

# Text filtering settings
MUZZLE_TEXT_CASE_SENSITIVE=false
MUZZLE_TEXT_WHOLE_WORD=true

# Processing settings
MUZZLE_PROCESSING_CONCURRENCY=10

# Caching settings
MUZZLE_CACHE_TTL=3600000
```

## Configuration Examples

### High-Performance Web Application

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://cdn.example.com/banned-words.txt',
      format: 'text',
      refreshInterval: 86400000, // 24 hours
      cache: true,
      ttl: 43200000 // 12 hours
    },
    caseSensitive: false,
    wholeWord: true,
    maxTextLength: 50000,
    preprocessText: true
  },
  processing: {
    async: true,
    batch: {
      enabled: true,
      size: 100,
      timeout: 15000
    },
    concurrency: {
      max: 20,
      queueSize: 200
    },
    timeout: {
      text: 5000,
      overall: 15000
    }
  },
  caching: {
    defaultTTL: 7200000, // 2 hours
    maxSize: 2000,
    cleanupInterval: 600000 // 10 minutes
  },
  response: {
    format: 'detailed',
    includeMatches: true,
    includeSeverity: true,
    includeMetadata: false
  }
};
```

### Simple Chat Application

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate,violence'
    },
    caseSensitive: false,
    wholeWord: true
  },
  processing: {
    async: true,
    timeout: {
      text: 3000,
      overall: 5000
    }
  },
  response: {
    format: 'simple',
    includeMatches: true,
    includeSeverity: false,
    includeMetadata: false
  }
};
```

### Content Management System

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'file',
      filePath: '/etc/muzzle/content-words.json',
      format: 'json',
      refreshInterval: 1800000, // 30 minutes
      cache: true,
      ttl: 900000 // 15 minutes
    },
    caseSensitive: false,
    wholeWord: true,
    exactPhrase: false,
    maxTextLength: 100000,
    preprocessText: true
  },
  processing: {
    async: true,
    batch: {
      enabled: true,
      size: 25,
      timeout: 60000
    },
    concurrency: {
      max: 5,
      queueSize: 50
    }
  },
  caching: {
    defaultTTL: 3600000, // 1 hour
    maxSize: 500,
    cleanupInterval: 300000 // 5 minutes
  },
  response: {
    format: 'detailed',
    includeMatches: true,
    includeSeverity: true,
    includeMetadata: true
  }
};
```

## Configuration Validation

Muzzle automatically validates configuration on initialization. Validation errors will be thrown as exceptions:

```typescript
try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
} catch (error) {
  console.error('Configuration error:', error.message);
  // Handle configuration errors
}
```

Common validation errors include:
- Missing required fields for banned words sources
- Invalid file paths or URLs
- Invalid numeric values (negative timeouts, etc.)
- Unsupported configuration options

## Dynamic Configuration Updates

Muzzle supports updating configuration at runtime:

```typescript
const muzzle = new Muzzle({ config });
await muzzle.initialize();

// Update configuration
await muzzle.updateConfig({
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'new,banned,words'
    }
  }
});
```

When updating configuration, Muzzle will:
1. Validate the new configuration
2. Dispose of existing resources
3. Reinitialize with the new configuration
4. Continue processing with updated settings

## Best Practices

1. **Choose the Right Word List Source**
   - Use `string` or `array` for small, static word lists
   - Use `file` for large, version-controlled word lists
   - Use `url` for centrally managed, dynamic word lists
   - Use `default` for general-purpose filtering

2. **Configure Caching Appropriately**
   - Enable caching for URL and file sources
   - Set appropriate TTL values based on how often word lists change
   - Monitor cache memory usage in production

3. **Optimize Performance**
   - Use batch processing for multiple texts
   - Set appropriate concurrency limits
   - Configure timeouts based on your use case

4. **Handle Errors Gracefully**
   - Always wrap initialization in try-catch blocks
   - Implement fallback mechanisms for URL-based sources
   - Monitor for configuration validation errors

5. **Monitor and Adjust**
   - Use the status API to monitor system health
   - Adjust configuration based on performance metrics
   - Regularly review and update word lists