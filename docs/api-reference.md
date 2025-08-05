---
layout: page
title: API Reference
permalink: /api-reference/
---

# API Reference

This document provides detailed information about all classes, interfaces, and methods available in the Muzzle text filtering system.

## Core Classes

### Muzzle

The main class for the Muzzle text filtering system.

#### Constructor

```typescript
constructor(options?: MuzzleOptions)
```

**Parameters:**
- `options` (optional): Configuration options for Muzzle

**Example:**
```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'string',
        string: 'badword,profanity'
      }
    }
  }
});
```

#### Methods

##### `initialize()`

Initialize the Muzzle system and load word lists.

```typescript
async initialize(): Promise<void>
```

**Example:**
```typescript
await muzzle.initialize();
```

##### `filterText()`

Filter text for inappropriate content.

```typescript
async filterText(text: string, options?: TextFilterOptions): Promise<TextMatchResult>
```

**Parameters:**
- `text`: The text to filter
- `options` (optional): Filtering options that override the defaults

**Returns:** A `TextMatchResult` object containing the filtering results

**Example:**
```typescript
const result = await muzzle.filterText('This contains a badword', {
  caseSensitive: false,
  wholeWord: true
});
```

##### `filterContent()`

Filter text content with response formatting.

```typescript
async filterContent(
  text?: string,
  options?: {
    text?: TextFilterOptions;
    response?: ResponseFormatOptions;
  }
): Promise<FilterResult>
```

**Parameters:**
- `text` (optional): The text to filter
- `options` (optional): Options for text filtering and response formatting

**Returns:** A `FilterResult` object with formatted response

**Example:**
```typescript
const result = await muzzle.filterContent('Some text to filter', {
  response: {
    format: 'detailed'
  }
});
```

##### `filterBatch()`

Filter multiple content items in batch.

```typescript
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
): Promise<FilterResult[]>
```

**Parameters:**
- `items`: Array of items to filter
- `batchOptions` (optional): Batch processing options

**Returns:** Array of `FilterResult` objects

**Example:**
```typescript
const results = await muzzle.filterBatch([
  { text: 'Clean text' },
  { text: 'Text with badword' }
]);
```

##### `generateViolationReport()`

Generate a violation report for filtered content.

```typescript
async generateViolationReport(
  text?: string,
  options?: {
    text?: TextFilterOptions;
  }
): Promise<ViolationReport>
```

**Parameters:**
- `text` (optional): The text to analyze
- `options` (optional): Text filtering options

**Returns:** A `ViolationReport` object

**Example:**
```typescript
const report = await muzzle.generateViolationReport('Inappropriate text');
```

##### `refresh()`

Refresh dynamic word lists and cached data.

```typescript
async refresh(): Promise<void>
```

**Example:**
```typescript
await muzzle.refresh();
```

##### `getStatus()`

Get system status and statistics.

```typescript
async getStatus(): Promise<MuzzleStatus>
```

**Returns:** A `MuzzleStatus` object

**Example:**
```typescript
const status = await muzzle.getStatus();
console.log('System initialized:', status.initialized);
```

##### `updateConfig()`

Update configuration and reinitialize the system.

```typescript
async updateConfig(config: Partial<MuzzleConfig>): Promise<void>
```

**Parameters:**
- `config`: Partial configuration object with updates

**Example:**
```typescript
await muzzle.updateConfig({
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'new,banned,words'
    }
  }
});
```

##### `dispose()`

Clean up resources.

```typescript
dispose(): void
```

**Example:**
```typescript
muzzle.dispose();
```

## Interfaces

### MuzzleConfig

Configuration interface for the Muzzle system.

```typescript
interface MuzzleConfig {
  debug?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  textFiltering?: TextFilteringConfig;
  processing?: ProcessingConfig;
  caching?: CacheConfig;
  response?: ResponseConfig;
}
```

### TextFilteringConfig

Configuration for text filtering behavior.

```typescript
interface TextFilteringConfig {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  useRegex?: boolean;
  bannedWordsSource?: BannedWordsSource;
  maxTextLength?: number;
  preprocessText?: boolean;
  parameterHandling?: ParameterHandlingConfig; // Parameter handling configuration
}
```

### BannedWordsSource

Configuration for banned words sources.

```typescript
interface BannedWordsSource {
  type: 'string' | 'array' | 'file' | 'url' | 'default';
  string?: string;
  array?: string[];
  filePath?: string;
  url?: string;
  refreshInterval?: number;
  format?: 'json' | 'text' | 'csv';
  cache?: boolean;
  cacheKey?: string;
  ttl?: number;
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  useRegex?: boolean;
  config?: Record<string, any>;
  parameterHandling?: ParameterHandlingConfig; // Parameter handling configuration
}
```

### ParameterHandlingConfig

Configuration for handling parameterized words.

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

### TextFilterOptions

Options for text filtering that can override defaults.

```typescript
interface TextFilterOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  useRegex?: boolean;
}
```

### TextMatchResult

Result of text filtering operation.

```typescript
interface TextMatchResult {
  matched: boolean;
  matches: TextMatch[];
  severity?: number;
  error?: string;
}
```

### TextMatch

Individual match found in text.

```typescript
interface TextMatch {
  word: string;
  position: {
    start: number;
    end: number;
  };
  line?: number;
  column?: number;
  context: string;
  severity?: number;
  parameters?: WordParameters;        // Word parameters (if parameterized words are used)
}
```

### WordParameters

Parameters associated with a word.

```typescript
interface WordParameters {
  type?: string;                      // Word type (e.g., 'slur', 'profanity', 'hate')
  severity?: number | string;         // Severity level (number 0-10 or string like 'low', 'medium', 'high')
  blocked?: boolean;                  // Whether the word is blocked
  [key: string]: any;                 // Additional custom parameters
}
```

### ParameterizedWord

A word with associated parameters.

```typescript
interface ParameterizedWord {
  word: string;                       // The word to match
  parameters: WordParameters;         // Associated parameters
}
```

### FilterResult

Formatted response from content filtering.

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

### MuzzleStatus

System status information.

```typescript
interface MuzzleStatus {
  initialized: boolean;
  textFilter: {
    ready: boolean;
    wordListSource: Record<string, any>;
  };
  processing: ProcessorStatus;
}
```

## Word List Providers

Muzzle supports different types of word list providers through the `BannedWordsSource` interface. Each provider handles a different source of banned words:

### StringWordListProvider

Handles comma-separated strings of banned words.

**Configuration:**
```typescript
{
  type: 'string',
  string: 'badword,profanity,swear'
}
```

### ArrayWordListProvider

Handles arrays of banned words.

**Configuration:**
```typescript
{
  type: 'array',
  array: ['badword', 'profanity', 'swear']
}
```

### FileWordListProvider

Handles banned words from local files.

**Configuration:**
```typescript
{
  type: 'file',
  filePath: '/path/to/banned-words.txt',
  format: 'text' // or 'json', 'csv'
}
```

### DynamicWordListProvider

Handles banned words from URLs with automatic refresh.

**Configuration:**
```typescript
{
  type: 'url',
  url: 'https://example.com/banned-words.txt',
  format: 'text',
  refreshInterval: 86400000, // 24 hours
  cache: true
}
```

### DefaultWordListProvider

Uses the default GitHub profanity words list.

**Configuration:**
```typescript
{
  type: 'default',
  refreshInterval: 86400000, // 24 hours
  cache: true
}
```

## Error Handling

Muzzle provides comprehensive error handling through the following mechanisms:

1. **Initialization Errors**: Errors during initialization are thrown and should be caught with try-catch blocks.

2. **Filtering Errors**: Errors during filtering are returned in the `error` property of the result object.

3. **Network Errors**: For URL-based word lists, network errors are handled gracefully with retry mechanisms.

4. **Validation Errors**: Configuration validation errors are thrown during initialization.

**Example Error Handling:**
```typescript
try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
  
  const result = await muzzle.filterText('Some text');
  
  if (result.error) {
    console.error('Filtering error:', result.error);
  }
} catch (error) {
  console.error('Initialization error:', error);
}
```

## Performance Considerations

1. **Caching**: Enable caching for URL-based word lists to improve performance.

2. **Batch Processing**: Use `filterBatch()` for processing multiple texts efficiently.

3. **Preprocessing**: Enable text preprocessing for better matching performance.

4. **Word List Size**: Large word lists may impact performance. Consider using only relevant words.

5. **Memory Usage**: Monitor memory usage when processing large volumes of text.