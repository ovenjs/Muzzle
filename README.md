# Muzzle Text Filtering System

![Version](https://img.shields.io/npm/v/@ovendjs/muzzle)
![License](https://img.shields.io/npm/l/@ovendjs/muzzle)
![Types](https://img.shields.io/npm/types/@ovendjs/muzzle)
![Build Status](https://img.shields.io/github/actions/workflow/status/ovendjs/muzzle/ci.yml)

A comprehensive, extensible text filtering system for Node.js applications, designed to detect and filter inappropriate content with extensive customization options for banned words sources.

## Features

- **Multiple Banned Words Sources**: Support for various input methods:
  - Comma-separated strings (e.g., "word1,word2")
  - Arrays of strings (e.g., ["word1", "word2"])
  - Local file paths (e.g., /path/to/words.txt)
  - URLs pointing to plain text files (e.g., https://example.com/words.txt)
  - Default GitHub profanity words list (https://github.com/coffee-and-fun/google-profanity-words)

- **Parameterized Word Definitions**: Enhanced word definitions with key-value parameters:
  - Word type classification (e.g., "slur", "profanity", "hate")
  - Custom severity levels for different words
  - Extensible parameter system for future features
  - Backward compatibility with simple word definitions

- **Advanced Text Matching**:
  - Custom word lists
  - Regular expressions
  - Case sensitivity options
  - Whole-word matching
  - URL-based word list fetching with caching

- **Flexible Configuration**:
  - Seamless switching between input methods
  - Customizable refresh intervals for dynamic sources
  - Configurable caching options
  - Extensible matching strategies
  - Unified parameter handling across all components

- **Performance Optimized**:
  - In-memory and file-based caching
  - Asynchronous processing
  - Batch operations
  - Minimal memory footprint

## Installation

```bash
npm install @ovendjs/muzzle
```

## Quick Start

### Basic Text Filtering

```typescript
import { Muzzle } from '@ovendjs/muzzle';

// Initialize with default configuration (uses GitHub profanity words list)
const muzzle = new Muzzle();

// Check text for inappropriate content
const result = await muzzle.filterText('This is some sample text to check');
console.log(result);
```

### Using Different Banned Words Sources

#### Comma-separated String

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse'
    }
  }
});

const result = await muzzle.filterText('This contains a badword');
console.log(result.matched); // true
```

#### Array of Strings

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: ['badword', 'profanity', 'swear', 'curse']
    }
  }
});

const result = await muzzle.filterText('This contains profanity');
console.log(result.matched); // true
```

#### Local File Path

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'file',
      filePath: '/path/to/your/banned-words.txt',
      refreshInterval: 3600000, // 1 hour
      cache: true
    }
  }
});

const result = await muzzle.filterText('This contains a word from the file');
console.log(result);
```

#### URL Source

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/banned-words.txt',
      refreshInterval: 86400000, // 24 hours
      cache: true,
      ttl: 86400000 // 24 hours
    }
  }
});

const result = await muzzle.filterText('This contains a word from the URL');
console.log(result);
```

### Parameterized Word Definitions

Parameterized words allow you to define banned words with additional metadata for more sophisticated filtering:

#### Basic Parameterized Words

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword[type=slur][severity=8],profanity[type=profanity][severity=5],hate[type=hate][severity=9]'
    }
  }
});

const result = await muzzle.filterText('This contains a badword and profanity');
console.log(result.matches);
// Output will include word type and severity for each match
```

#### Array with Parameterized Words

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: [
        'badword[type=slur][severity=8]',
        'profanity[type=profanity][severity=5]',
        // Or use object format
        {
          word: 'hate',
          parameters: {
            type: 'hate',
            severity: 9,
            blocked: true
          }
        }
      ]
    }
  }
});

const result = await muzzle.filterText('This contains hate speech');
console.log(result.matches[0]?.parameters?.type); // 'hate'
console.log(result.matches[0]?.parameters?.severity); // 9
```

#### Parameter Handling Configuration

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,hate'
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
        }
      }
    }
  }
});

const result = await muzzle.filterText('This contains badword');
console.log(result.matches[0]?.parameters?.type); // 'unknown' (default)
console.log(result.matches[0]?.severity); // 1 (default severity)
```

### Advanced Configuration

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: ['badword', 'profanity', 'swear', 'curse']
    },
    caseSensitive: false,
    wholeWord: true,
    exactPhrase: false,
    useRegex: false,
    maxTextLength: 1000000,
    preprocessText: true
  },
  caching: {
    defaultTTL: 3600000, // 1 hour
    maxSize: 1000,
    backend: {
      type: 'memory'
    }
  },
  response: {
    format: 'detailed',
    includeMatches: true,
    includeSeverity: true
  }
});

const result = await muzzle.filterText('This contains a badword');
console.log(result);
```

### Batch Processing

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear'
    }
  }
});

// Process multiple text items
const results = await muzzle.filterBatch([
  { text: 'This is clean text' },
  { text: 'This contains bad words' },
  { text: 'Another clean text' }
]);

console.log(`Filtered ${results.length} texts`);
results.forEach((result, index) => {
  console.log(`Text ${index + 1}: ${result.passed ? 'Clean' : 'Filtered'}`);
});
```

## API Reference

### Muzzle

The main class for text filtering.

#### Constructor

```typescript
new Muzzle(options?: MuzzleOptions)
```

#### Methods

- `filterText(text: string, options?: TextFilterOptions): Promise<TextMatchResult>` - Filter text content
- `filterContent(text?: string, options?: { text?: TextFilterOptions; response?: ResponseFormatOptions }): Promise<FilterResult>` - Filter text with response formatting
- `filterBatch(items: Array<{ text?: string; options?: { text?: TextFilterOptions; response?: ResponseFormatOptions } }>, batchOptions?: { concurrency?: number; timeout?: number }): Promise<FilterResult[]>` - Filter multiple texts
- `refresh(): Promise<void>` - Refresh dynamic word lists
- `getStatus(): Promise<MuzzleStatus>` - Get system status
- `updateConfig(config: Partial<MuzzleConfig>): Promise<void>` - Update configuration
- `dispose(): void` - Clean up resources

### Types

#### BannedWordsSource

```typescript
interface BannedWordsSource {
  type: 'string' | 'array' | 'file' | 'url' | 'default';
  string?: string;                    // For string type
  array?: string[];                   // For array type
  filePath?: string;                  // For file type
  url?: string;                       // For URL type
  refreshInterval?: number;           // For dynamic sources (file, url)
  format?: 'json' | 'text' | 'csv';   // File/URL format
  cache?: boolean;                    // Enable caching
  cacheKey?: string;                  // Custom cache key
  ttl?: number;                       // Cache TTL
  caseSensitive?: boolean;            // Override global case sensitivity
  wholeWord?: boolean;                // Override global whole word matching
  exactPhrase?: boolean;              // Override global exact phrase matching
  useRegex?: boolean;                 // Override global regex usage
  parameterHandling?: ParameterHandlingConfig; // Parameter handling configuration
}
```

#### TextMatchResult

```typescript
interface TextMatchResult {
  matched: boolean;
  matches: TextMatch[];
  severity?: number;
  error?: string;
}
```

#### TextMatch

```typescript
interface TextMatch {
  word: string;
  position: {
    start: number;
    end: number;
  };
  line?: number;
  column?: number;
  context: string;                    // Surrounding text
  severity?: number;
  parameters?: WordParameters;        // Word parameters (if parameterized words are used)
}
```

#### WordParameters

```typescript
interface WordParameters {
  type?: string;                      // Word type (e.g., 'slur', 'profanity', 'hate')
  severity?: number | string;         // Severity level (number 0-10 or string like 'low', 'medium', 'high')
  blocked?: boolean;                  // Whether the word is blocked
  [key: string]: any;                 // Additional custom parameters
}
```

#### ParameterizedWord

```typescript
interface ParameterizedWord {
  word: string;                       // The word to match
  parameters: WordParameters;         // Associated parameters
}
```

#### FilterResult

```typescript
interface FilterResult {
  passed: boolean;
  text?: TextMatchResult;
  severity: number;
  metadata?: {
    processingTime: number;
    timestamp: Date;
    version: string;
    [key: string]: any;
  };
}
```

## Configuration

### Text Filtering Options

```typescript
interface TextFilteringConfig {
  caseSensitive?: boolean;            // Case sensitive matching
  wholeWord?: boolean;                // Whole word matching
  exactPhrase?: boolean;              // Exact phrase matching
  useRegex?: boolean;                 // Use regex patterns
  bannedWordsSource?: BannedWordsSource; // Banned words source configuration
  maxTextLength?: number;             // Maximum text length to process
  preprocessText?: boolean;           // Enable text preprocessing
  parameterHandling?: ParameterHandlingConfig; // Parameter handling configuration
}
```

### Cache Options

```typescript
interface CacheConfig {
  defaultTTL?: number;                // Default TTL in milliseconds
  maxSize?: number;                   // Maximum cache size
  cleanupInterval?: number;           // Cleanup interval
  backend?: {
    type: 'memory' | 'file' | 'custom';
    config?: Record<string, any>;
  };
}
```

### Response Options

```typescript
interface ResponseConfig {
  format?: 'simple' | 'detailed' | 'json' | 'xml' | 'custom';
  includeMatches?: boolean;           // Include matched content
  includeSeverity?: boolean;          // Include severity scores
  includeMetadata?: boolean;          // Include metadata
  formatter?: (result: FilterResult) => any; // Custom response formatter
}
```

### Parameter Handling Options

```typescript
interface ParameterHandlingConfig {
  defaultParameters?: WordParameters; // Default parameters for non-parameterized words
  includeParametersInResults?: boolean; // Whether to include parameters in filter results
  autoConvertNonParameterized?: boolean; // Whether to auto-convert simple words to parameterized
  severityMapping?: {
    defaultSeverity?: number;         // Default severity level
    byType?: Record<string, number>;  // Severity mapping by word type
  };
  parameterValidation?: {
    required?: string[];              // Required parameter names
    allowedTypes?: Record<string, 'string' | 'number' | 'boolean'>; // Parameter type validation
    constraints?: Record<string, {    // Parameter value constraints
      min?: number;
      max?: number;
      enum?: any[];
      pattern?: string;
    }>;
  };
}
```

## Performance Considerations

- Use caching for frequently accessed word lists, especially for URL and file sources
- Batch operations when processing multiple items
- Adjust refresh intervals based on how often your word lists change
- Consider memory usage when processing large texts
- Use appropriate TTL values for cached word lists

## Troubleshooting

### Common Issues

1. **Network Issues**: For URL-based sources, ensure network connectivity and proper URL formatting
2. **File Access Issues**: For file-based sources, ensure proper file permissions and paths
3. **Memory Issues**: Reduce batch sizes or use file-based caching for large word lists
4. **Slow Performance**: Enable caching and adjust TTL settings for dynamic sources

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const muzzle = new Muzzle({
  debug: true,
  logLevel: 'debug'
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/ovendjs/muzzle.git
cd muzzle
npm install
npm run build
npm test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- [Documentation](https://ovendjs.github.io/muzzle/)
- [Issues](https://github.com/ovendjs/muzzle/issues)
- [Discussions](https://github.com/ovendjs/muzzle/discussions)
