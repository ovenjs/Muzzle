---
layout: page
title: API Reference
permalink: /api-reference/
---

# 📚 API Reference

This document provides detailed information about all classes, interfaces, and methods available in the Muzzle text filtering system.

## 🏗️ Core Classes

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
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity'
    }
  }
};

const muzzle = new Muzzle({ config });
```

#### Methods

##### `initialize()`

Initialize the Muzzle system and load word lists.

```typescript
async initialize(): Promise<void>
```

**Example:**
```typescript
try {
  await muzzle.initialize();
  console.log('✅ Muzzle initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Muzzle:', error);
}
```

> **💡 Tip**: Always call `initialize()` before filtering text. This loads the word lists and prepares the filter for use.

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

if (result.matched) {
  console.log('🚫 Inappropriate content detected');
  console.log('Matches:', result.matches?.map(m => m.word));
} else {
  console.log('✅ Content is clean');
}
```

##### `filterBatch()`

Filter multiple content items in batch.

```typescript
async filterBatch(
  items: Array<{
    text: string;
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
const texts = [
  'This is clean text',
  'This contains badword',
  'Another text with profanity'
];

const results = await muzzle.filterBatch(
  texts.map(text => ({ text }))
);

results.forEach((result, index) => {
  console.log(`Text ${index + 1}: ${result.passed ? '✅ Passed' : '❌ Failed'}`);
});
```

> **💡 Tip**: Use batch processing for filtering multiple texts. It's more efficient than filtering texts one by one.

##### `refresh()`

Refresh dynamic word lists and cached data.

```typescript
async refresh(): Promise<void>
```

**Example:**
```typescript
try {
  await muzzle.refresh();
  console.log('✅ Word lists refreshed successfully');
} catch (error) {
  console.error('❌ Failed to refresh word lists:', error);
}
```

> **💡 Tip**: Call `refresh()` periodically if you're using URL-based word lists that change frequently.

##### `getStatus()`

Get system status and statistics.

```typescript
async getStatus(): Promise<MuzzleStatus>
```

**Returns:** A `MuzzleStatus` object

**Example:**
```typescript
const status = await muzzle.getStatus();
console.log('📊 System Status:');
console.log('- Initialized:', status.initialized);
console.log('- Word List Size:', status.wordListSize);
console.log('- Last Updated:', new Date(status.lastUpdated || 0).toLocaleString());
```

> **💡 Tip**: Use the status API to monitor the health and performance of your filtering system.

##### `updateConfig()`

Update configuration and reinitialize the system.

```typescript
async updateConfig(config: Partial<MuzzleConfig>): Promise<void>
```

**Parameters:**
- `config`: Partial configuration object with updates

**Example:**
```typescript
try {
  await muzzle.updateConfig({
    textFiltering: {
      bannedWordsSource: {
        type: 'string',
        string: 'new,banned,words'
      }
    }
  });
  console.log('✅ Configuration updated successfully');
} catch (error) {
  console.error('❌ Failed to update configuration:', error);
}
```

> **💡 Tip**: Use `updateConfig()` to change filtering behavior without restarting your application.

##### `dispose()`

Clean up resources.

```typescript
dispose(): void
```

**Example:**
```typescript
// When shutting down your application
muzzle.dispose();
console.log('🧹 Muzzle resources cleaned up');
```

> **💡 Tip**: Call `dispose()` when shutting down your application to free up resources.

## 🔧 Interfaces

### MuzzleConfig

Configuration interface for the Muzzle system.

```typescript
interface MuzzleConfig {
  textFiltering?: TextFilteringConfig;
  processing?: ProcessingConfig;
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `textFiltering` | `TextFilteringConfig` | Optional | Configuration for text filtering behavior |
| `processing` | `ProcessingConfig` | Optional | Configuration for text processing |

### TextFilteringConfig

Configuration for text filtering behavior.

```typescript
interface TextFilteringConfig {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  exactPhrase?: boolean;
  bannedWordsSource?: BannedWordsSource;
  maxTextLength?: number;
  preprocessText?: boolean;
  parameterHandling?: ParameterHandlingConfig;
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `caseSensitive` | `boolean` | `false` | Whether to perform case-sensitive matching |
| `wholeWord` | `boolean` | `false` | Whether to match whole words only |
| `exactPhrase` | `boolean` | `false` | Whether to require exact phrase matching |
| `bannedWordsSource` | `BannedWordsSource` | - | Configuration for banned words source |
| `maxTextLength` | `number` | `1000000` | Maximum text length to process |
| `preprocessText` | `boolean` | `true` | Whether to preprocess text before filtering |
| `parameterHandling` | `ParameterHandlingConfig` | - | Configuration for parameterized words |

### BannedWordsSource

Configuration for banned words sources.

```typescript
interface BannedWordsSource {
  type: 'string' | 'array' | 'file' | 'url' | 'default';
  string?: string;
  array?: Array<string | ParameterizedWord>;
  path?: string;
  url?: string;
  refreshInterval?: number;
  cache?: boolean;
}
```

**Properties:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `string` | Required | Type of word list source |
| `string` | `string` | For `string` type | Comma-separated list of banned words |
| `array` | `Array<string \| ParameterizedWord>` | For `array` type | Array of banned words |
| `path` | `string` | For `file` type | Path to the word list file |
| `url` | `string` | For `url` type | URL to fetch the word list from |
| `refreshInterval` | `number` | Optional | How often to refresh the word list (ms) |
| `cache` | `boolean` | Optional | Whether to cache the word list |

### ParameterHandlingConfig

Configuration for handling parameterized words.

```typescript
interface ParameterHandlingConfig {
  defaultParameters?: WordParameters;
  includeParametersInResults?: boolean;
  autoConvertNonParameterized?: boolean;
  severityMapping?: {
    defaultSeverity?: number;
    byType?: Record<string, number>;
  };
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `defaultParameters` | `WordParameters` | - | Default parameters for non-parameterized words |
| `includeParametersInResults` | `boolean` | `true` | Whether to include parameters in results |
| `autoConvertNonParameterized` | `boolean` | `true` | Whether to auto-convert simple words |
| `severityMapping` | `object` | - | Severity mapping configuration |

### TextMatchResult

Result of text filtering operation.

```typescript
interface TextMatchResult {
  matched: boolean;
  matches?: TextMatch[];
  severity?: number;
  error?: string;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `matched` | `boolean` | Whether inappropriate content was found |
| `matches` | `TextMatch[]` | Array of matches found (if any) |
| `severity` | `number` | Overall severity score (0-10) |
| `error` | `string` | Error message if filtering failed |

### TextMatch

Individual match found in text.

```typescript
interface TextMatch {
  word: string;
  position: number;
  context: string;
  parameters?: WordParameters;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `word` | `string` | The matched word |
| `position` | `number` | Position of the match in the text |
| `context` | `string` | Context around the match |
| `parameters` | `WordParameters` | Parameters associated with the word |

### WordParameters

Parameters associated with a word.

```typescript
interface WordParameters {
  type?: string;
  severity?: number;
  [key: string]: any;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Word type (e.g., 'profanity', 'hate') |
| `severity` | `number` | Severity level (0-10) |
| `[key: string]` | `any` | Additional custom parameters |

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
    [key: string]: any;
  };
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `passed` | `boolean` | Whether the content passed filtering |
| `text` | `TextMatchResult` | Text filtering result details |
| `severity` | `number` | Overall severity score |
| `metadata` | `object` | Processing metadata |

### MuzzleStatus

System status information.

```typescript
interface MuzzleStatus {
  initialized: boolean;
  wordListSize?: number;
  lastUpdated?: number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `initialized` | `boolean` | Whether the system is initialized |
| `wordListSize` | `number` | Number of words in the word list |
| `lastUpdated` | `number` | Timestamp of last update |

## 📚 Word List Providers

Muzzle supports different types of word list providers through the `BannedWordsSource` interface. Each provider handles a different source of banned words:

### 📝 StringWordListProvider

Handles comma-separated strings of banned words.

**Configuration:**
```typescript
{
  type: 'string',
  string: 'badword,profanity,swear'
}
```

**✅ Best for:**
- Small, static word lists
- Quick prototyping
- Simple applications

### 📋 ArrayWordListProvider

Handles arrays of banned words.

**Configuration:**
```typescript
{
  type: 'array',
  array: [
    'badword',
    'profanity',
    { word: 'hate', parameters: { type: 'hate', severity: 8 } }
  ]
}
```

**✅ Best for:**
- Dynamically generated word lists
- Parameterized words with metadata
- Complex word categorization

### 📁 FileWordListProvider

Handles banned words from local files.

**Configuration:**
```typescript
{
  type: 'file',
  path: './banned-words.txt'
}
```

**✅ Best for:**
- Large word lists
- Version-controlled word lists
- Custom word lists managed separately

### 🌐 DynamicWordListProvider

Handles banned words from URLs with automatic refresh.

**Configuration:**
```typescript
{
  type: 'url',
  url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
  refreshInterval: 86400000, // 24 hours
  cache: true
}
```

**✅ Best for:**
- Centrally managed word lists
- Dynamic word lists that change frequently
- Community-maintained word lists

### 🏁 DefaultWordListProvider

Uses the default GitHub profanity words list.

**Configuration:**
```typescript
{
  type: 'default',
  refreshInterval: 86400000, // 24 hours
  cache: true
}
```

**✅ Best for:**
- Quick start
- General-purpose content filtering
- Testing and evaluation

## 🚨 Error Handling

Muzzle provides comprehensive error handling through the following mechanisms:

### 1. Initialization Errors

Errors during initialization are thrown and should be caught with try-catch blocks.

```typescript
try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
  console.log('✅ Muzzle initialized successfully');
} catch (error) {
  console.error('❌ Initialization error:', error);
  // Handle initialization errors
}
```

### 2. Filtering Errors

Errors during filtering are returned in the `error` property of the result object.

```typescript
const result = await muzzle.filterText('Some text');

if (result.error) {
  console.error('❌ Filtering error:', result.error);
  // Handle filtering errors
}
```

### 3. Network Errors

For URL-based word lists, network errors are handled gracefully with retry mechanisms.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/banned-words.txt'
    }
  }
};

try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    console.error('❌ Network error:', error.message);
    // Implement fallback mechanism
  } else {
    console.error('❌ Initialization error:', error);
  }
}
```

### 4. Validation Errors

Configuration validation errors are thrown during initialization.

```typescript
try {
  const config = {
    textFiltering: {
      bannedWordsSource: {
        type: 'invalid-type' // This will cause a validation error
      }
    }
  };
  
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
} catch (error) {
  if (error.code === 'INVALID_CONFIG') {
    console.error('❌ Configuration error:', error.message);
    // Fix configuration
  } else {
    console.error('❌ Unexpected error:', error);
  }
}
```

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `INVALID_CONFIG` | Invalid configuration object | Check configuration structure |
| `WORD_LIST_LOAD_FAILED` | Failed to load word list | Check file path or URL |
| `NETWORK_ERROR` | Network request failed | Check internet connection |
| `INITIALIZATION_FAILED` | Failed to initialize | Check logs for details |
| `FILTERING_FAILED` | Text filtering failed | Check input text |

## ⚡ Performance Considerations

### 1. Caching

Enable caching for URL-based word lists to improve performance.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/banned-words.txt',
      cache: true, // Enable caching
      refreshInterval: 86400000 // Refresh every 24 hours
    }
  }
};
```

### 2. Batch Processing

Use `filterBatch()` for processing multiple texts efficiently.

```typescript
// ✅ Good: Use batch processing
const results = await muzzle.filterBatch(texts.map(text => ({ text })));

// ❌ Bad: Process texts one by one
for (const text of texts) {
  const result = await muzzle.filterText(text);
  // Process result
}
```

### 3. Preprocessing

Enable text preprocessing for better matching performance.

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity'
    },
    preprocessText: true // Enable preprocessing
  }
};
```

### 4. Word List Size

Large word lists may impact performance. Consider using only relevant words.

```typescript
// ✅ Good: Use focused word lists
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,hate,violence' // Only relevant words
    }
  }
};

// ❌ Bad: Use excessively large word lists
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/huge-word-list.txt' // 100,000+ words
    }
  }
};
```

### 5. Memory Usage

Monitor memory usage when processing large volumes of text.

```typescript
// Monitor memory usage
const status = await muzzle.getStatus();
const memoryUsage = process.memoryUsage();
console.log(`Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);

// Set appropriate text length limits
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity'
    },
    maxTextLength: 10000 // Limit text length
  }
};
```

### 6. Concurrency Control

Set appropriate concurrency limits for batch processing.

```typescript
const results = await muzzle.filterBatch(
  texts.map(text => ({ text })),
  {
    concurrency: 10 // Process 10 texts concurrently
  }
);
```

---

**Need help?** Check out our [GitHub repository](https://github.com/your-org/muzzle) or open an issue for support.