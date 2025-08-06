---
layout: page
title: Configuration Guide
permalink: /configuration/
---

# ⚙️ Configuration Guide

This guide provides detailed information about configuring Muzzle for different use cases and environments.

## 📋 Overview

Muzzle uses a flexible configuration system that allows you to customize every aspect of the text filtering behavior. Configuration is done through the `MuzzleConfig` interface, which supports various options for text filtering, processing, and response formatting.

## 🏗️ Basic Configuration Structure

```typescript
import { MuzzleConfig } from '@ovendjs/muzzle';

interface MuzzleConfig {
  // Text filtering configuration
  textFiltering?: TextFilteringConfig;
  
  // Processing configuration
  processing?: ProcessingConfig;
}
```

> **💡 Tip**: Most applications only need to configure `textFiltering`. The other sections are optional and provide advanced customization options.

## 🎯 Text Filtering Configuration

### 📚 Banned Words Sources

Muzzle supports multiple sources for banned words. Each source type has its own configuration options.

#### 📝 String Source

Use comma-separated strings for simple word lists.

```typescript
import { MuzzleConfig } from '@ovendjs/muzzle';

const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate,violence'
    }
  }
};
```

**✅ Best for:**
- Small, static word lists
- Quick prototyping
- Simple applications
- Testing and development

**⚙️ Options:**
- `string`: Comma-separated list of banned words

#### 📋 Array Source

Use JavaScript arrays for programmatic word lists.

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: [
        'badword',
        'profanity',
        'swear',
        { word: 'hate', parameters: { type: 'hate', severity: 8 } },
        { word: 'violence', parameters: { type: 'violence', severity: 7 } }
      ]
    }
  }
};
```

**✅ Best for:**
- Dynamically generated word lists
- Multi-language support
- Complex word categorization
- Parameterized words with metadata

**⚙️ Options:**
- `array`: Array of banned words (strings or objects with parameters)

#### 📁 File Source

Load banned words from local files in various formats.

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'file',
      path: './banned-words.txt',
      refreshInterval: 3600000, // 1 hour
      cache: true
    }
  }
};
```

**📄 Supported Formats:**

**Text Format (.txt):**
```
badword
profanity
swear
curse
hate
violence
```

**JSON Format (.json):**
```json
[
  "badword",
  "profanity",
  "swear",
  "curse",
  {
    "word": "hate",
    "parameters": {
      "type": "hate",
      "severity": 8
    }
  }
]
```

**✅ Best for:**
- Large word lists
- Shared word lists across applications
- Version-controlled word lists
- Custom word lists managed separately

**⚙️ Options:**
- `path`: Path to the word list file
- `refreshInterval`: How often to check for file changes (milliseconds)
- `cache`: Whether to cache the word list in memory

#### 🌐 URL Source

Fetch banned words from remote URLs with automatic refresh.

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000, // 24 hours
      cache: true,
      timeout: 10000 // 10 seconds
    }
  }
};
```

**✅ Best for:**
- Centrally managed word lists
- Dynamic word lists that change frequently
- Multi-application deployments
- Community-maintained word lists

**⚙️ Options:**
- `url`: URL to fetch the word list from
- `refreshInterval`: How often to refresh the word list (milliseconds)
- `cache`: Whether to cache the word list
- `timeout`: Request timeout (milliseconds)

#### 🏁 Default Source

Use the built-in GitHub profanity words list.

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'default',
      refreshInterval: 86400000, // 24 hours
      cache: true
    }
  }
};
```

**✅ Best for:**
- Quick start
- General-purpose content filtering
- Applications without custom word lists
- Testing and evaluation

**⚙️ Options:**
- `refreshInterval`: How often to refresh the word list (milliseconds)
- `cache`: Whether to cache the word list

### 🔍 Matching Options

Configure how words are matched in the text.

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity'
    },
    caseSensitive: false,    // Match case-insensitively
    wholeWord: true,        // Match whole words only
    exactPhrase: false      // Don't require exact phrase matching
  }
};
```

**⚙️ Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `caseSensitive` | `boolean` | `false` | Match words with exact case |
| `wholeWord` | `boolean` | `false` | Match only whole words (e.g., "bad" won't match "badminton") |
| `exactPhrase` | `boolean` | `false` | Match exact phrases only |

**📋 Examples:**

```typescript
// Case-insensitive matching (default)
const config1 = {
  textFiltering: {
    bannedWordsSource: { type: 'string', string: 'badword' },
    caseSensitive: false
  }
};
// Matches: "badword", "BadWord", "BADWORD"

// Case-sensitive matching
const config2 = {
  textFiltering: {
    bannedWordsSource: { type: 'string', string: 'badword' },
    caseSensitive: true
  }
};
// Matches: "badword" only

// Whole word matching
const config3 = {
  textFiltering: {
    bannedWordsSource: { type: 'string', string: 'bad' },
    wholeWord: true
  }
};
// Matches: "bad" but not "badminton"

// Partial word matching
const config4 = {
  textFiltering: {
    bannedWordsSource: { type: 'string', string: 'bad' },
    wholeWord: false
  }
};
// Matches: "bad", "badminton", "badass"
```

### ⚡ Performance Options

Configure performance-related settings.

```typescript
const config: MuzzleConfig = {
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

**⚙️ Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTextLength` | `number` | `1000000` | Maximum length of text to process (characters) |
| `preprocessText` | `boolean` | `true` | Normalize whitespace and clean text before processing |

**💡 Performance Tips:**

- Set `maxTextLength` to a reasonable value for your use case to prevent processing very large texts
- Enable `preprocessText` for better matching accuracy (recommended)
- Use batch processing for filtering multiple texts
- Enable caching for URL and file-based word lists

## 🏷️ Parameterized Words

Parameterized words allow you to add metadata to banned words for more sophisticated filtering and categorization.

### 📝 Parameterized Word Formats

Muzzle supports multiple formats for parameterized words:

#### String Format
```typescript
// Simple parameterized words
'badword[type=slur][severity=8]'
'profanity[type=profanity][severity=5][blocked=true]'
'hate[type=hate][severity=9]'
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

### ⚙️ Parameter Handling Configuration

Configure how parameterized words are handled and processed.

```typescript
const config: MuzzleConfig = {
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
      }
    }
  }
};
```

**⚙️ Parameter Handling Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultParameters` | `object` | `{}` | Default parameters to apply to non-parameterized words |
| `includeParametersInResults` | `boolean` | `true` | Whether to include word parameters in filter results |
| `autoConvertNonParameterized` | `boolean` | `true` | Whether to automatically convert simple words to parameterized words |
| `severityMapping` | `object` | - | Severity mapping configuration |

**📊 Severity Mapping Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultSeverity` | `number` | `1` | Default severity level for words without explicit severity |
| `byType` | `object` | `{}` | Severity mapping by word type |

### 🎯 Using Parameterized Words

Parameterized words enable sophisticated content filtering based on categories and severity levels:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: `
        badword[type=profanity][severity=3],
        hate[type=hate][severity=9],
        violence[type=violence][severity=7],
        slur[type=slur][severity=8]
      `
    },
    parameterHandling: {
      includeParametersInResults: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'profanity': 3,
          'hate': 9,
          'violence': 7,
          'slur': 8
        }
      }
    }
  }
};

const muzzle = new Muzzle({ config });
await muzzle.initialize();

const result = await muzzle.filterText('This contains hate speech and profanity');

if (result.matched) {
  console.log('Matches found:');
  result.matches?.forEach(match => {
    console.log(`- Word: ${match.word}`);
    console.log(`  Type: ${match.parameters?.type}`);
    console.log(`  Severity: ${match.parameters?.severity}`);
    console.log(`  Position: ${match.position}`);
  });
  
  // Calculate overall severity
  const maxSeverity = Math.max(...result.matches.map(m => m.parameters?.severity || 1));
  console.log(`Overall severity: ${maxSeverity}/10`);
}
```

**🔍 Use Cases for Parameterized Words:**

1. **Content Moderation Tiers**:
   - Low severity (1-3): Warning or flag for review
   - Medium severity (4-6): Automatic removal with user notification
   - High severity (7-8): Immediate removal and temporary suspension
   - Critical severity (9-10): Immediate removal and permanent ban

2. **Category-Based Actions**:
   - Profanity: Replace with asterisks
   - Hate speech: Immediate removal and report
   - Violence: Remove and escalate to moderators
   - Harassment: Remove and initiate safety protocols

3. **Context-Aware Filtering**:
   - Different rules for different content types
   - Age-appropriate filtering based on user demographics
   - Cultural sensitivity adjustments

## 🚀 Processing Configuration

Configure how text is processed and filtered.

```typescript
const config: MuzzleConfig = {
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

**⚙️ Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `async` | `boolean` | `true` | Enable asynchronous processing for better performance |
| `batch` | `object` | - | Batch processing configuration |
| `concurrency` | `object` | - | Concurrency control configuration |
| `timeout` | `object` | - | Timeout configuration |

**📋 Batch Processing Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable batch processing |
| `size` | `number` | `50` | Default batch size |
| `timeout` | `number` | `30000` | Batch processing timeout (milliseconds) |

**📋 Concurrency Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max` | `number` | `10` | Maximum concurrent operations |
| `queueSize` | `number` | `100` | Maximum queue size for pending operations |

**📋 Timeout Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text` | `number` | `10000` | Timeout for individual text filtering (milliseconds) |
| `overall` | `number` | `30000` | Overall timeout for operations (milliseconds) |

**💡 Performance Tips:**

- Enable batch processing for filtering multiple texts
- Adjust concurrency based on your server capabilities
- Set appropriate timeouts to prevent hanging operations
- Monitor performance metrics and adjust as needed

## 🌍 Environment Variables

Muzzle can be configured using environment variables with the `MUZZLE_` prefix:

```bash
# Text filtering settings
MUZZLE_TEXT_CASE_SENSITIVE=false
MUZZLE_TEXT_WHOLE_WORD=true
MUZZLE_TEXT_MAX_TEXT_LENGTH=1000000

# Processing settings
MUZZLE_PROCESSING_ASYNC=true
MUZZLE_PROCESSING_BATCH_SIZE=50
MUZZLE_PROCESSING_CONCURRENCY_MAX=10

# Banned words source settings
MUZZLE_TEXT_BANNED_WORDS_SOURCE_TYPE=string
MUZZLE_TEXT_BANNED_WORDS_SOURCE_STRING=badword,profanity,swear
```

**📋 Supported Environment Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `MUZZLE_TEXT_CASE_SENSITIVE` | `boolean` | Enable case-sensitive matching |
| `MUZZLE_TEXT_WHOLE_WORD` | `boolean` | Enable whole-word matching |
| `MUZZLE_TEXT_MAX_TEXT_LENGTH` | `number` | Maximum text length to process |
| `MUZZLE_PROCESSING_ASYNC` | `boolean` | Enable asynchronous processing |
| `MUZZLE_PROCESSING_BATCH_SIZE` | `number` | Default batch size |
| `MUZZLE_PROCESSING_CONCURRENCY_MAX` | `number` | Maximum concurrent operations |
| `MUZZLE_TEXT_BANNED_WORDS_SOURCE_TYPE` | `string` | Banned words source type |
| `MUZZLE_TEXT_BANNED_WORDS_SOURCE_STRING` | `string` | String source content |
| `MUZZLE_TEXT_BANNED_WORDS_SOURCE_URL` | `string` | URL source location |
| `MUZZLE_TEXT_BANNED_WORDS_SOURCE_PATH` | `string` | File source path |

**💡 Usage Example:**

```typescript
// .env file
MUZZLE_TEXT_CASE_SENSITIVE=false
MUZZLE_TEXT_WHOLE_WORD=true
MUZZLE_TEXT_BANNED_WORDS_SOURCE_TYPE=string
MUZZLE_TEXT_BANNED_WORDS_SOURCE_STRING=badword,profanity,swear

// application.ts
import { config } from 'dotenv';
import { Muzzle } from '@ovendjs/muzzle';

config(); // Load environment variables

// Muzzle will automatically use environment variables
const muzzle = new Muzzle();
await muzzle.initialize();
```

## ✅ Configuration Validation

Muzzle automatically validates configuration on initialization. Validation errors will be thrown as exceptions:

```typescript
try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
  console.log('✅ Configuration is valid');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  // Handle configuration errors
}
```

**🚨 Common Validation Errors:**

| Error | Description | Solution |
|-------|-------------|----------|
| `INVALID_CONFIG` | Invalid configuration object | Check configuration structure |
| `MISSING_REQUIRED_FIELD` | Missing required field | Add missing field to configuration |
| `INVALID_WORD_LIST_SOURCE` | Invalid word list source | Check source type and options |
| `INVALID_FILE_PATH` | Invalid file path | Verify file exists and is accessible |
| `INVALID_URL` | Invalid URL | Check URL format and accessibility |
| `INVALID_NUMERIC_VALUE` | Invalid numeric value | Ensure positive numbers where required |

## 🔄 Dynamic Configuration Updates

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
1. ✅ Validate the new configuration
2. 🧹 Dispose of existing resources
3. 🔄 Reinitialize with the new configuration
4. ⚡ Continue processing with updated settings

**💡 Use Cases for Dynamic Updates:**

- Adding new banned words without restarting
- Switching between different word lists for different contexts
- Adjusting filtering strictness based on user feedback
- Updating severity mappings based on moderation policies

## 🎯 Best Practices

### 1. Choose the Right Word List Source
   - Use `string` or `array` for small, static word lists
   - Use `file` for large, version-controlled word lists
   - Use `url` for centrally managed, dynamic word lists
   - Use `default` for general-purpose filtering

### 2. Configure Caching Appropriately
   - Enable caching for URL and file sources
   - Set appropriate TTL values based on how often word lists change
   - Monitor cache memory usage in production

### 3. Optimize Performance
   - Use batch processing for multiple texts
   - Set appropriate concurrency limits
   - Configure timeouts based on your use case

### 4. Handle Errors Gracefully
   - Always wrap initialization in try-catch blocks
   - Implement fallback mechanisms for URL-based sources
   - Monitor for configuration validation errors

### 5. Monitor and Adjust
   - Use the status API to monitor system health
   - Adjust configuration based on performance metrics
   - Regularly review and update word lists

### 6. Use Parameterized Words for Sophisticated Filtering
   - Categorize words by type and severity
   - Implement different actions based on severity levels
   - Use context-aware filtering for better user experience

---

**Need help?** Check out our [GitHub repository](https://github.com/your-org/muzzle) or open an issue for support.
