---
layout: page
title: Getting Started
permalink: /getting-started/
---

# 🚀 Getting Started with Muzzle

Welcome to Muzzle! This guide will help you get up and running with Muzzle in your Node.js application in just a few minutes.

## 📦 Installation

First, install Muzzle using npm:

```bash
npm install @ovendjs/muzzle
```

Or using yarn:

```bash
yarn add @ovendjs/muzzle
```

Or using pnpm:

```bash
pnpm add @ovendjs/muzzle
```

## 🎯 Basic Usage

### 1. Simple Text Filtering

The simplest way to use Muzzle is with the default configuration:

```typescript
import { Muzzle } from '@ovendjs/muzzle';

// Initialize Muzzle with default settings
const muzzle = new Muzzle();

// Initialize the filter (required before filtering)
await muzzle.initialize();

// Filter some text
const result = await muzzle.filterText('This text contains some bad words');

if (result.matched) {
  console.log('🚫 Found inappropriate content:');
  result.matches?.forEach(match => {
    console.log(`- "${match.word}" at position ${match.position}`);
    console.log(`  Context: "${match.context}"`);
  });
} else {
  console.log('✅ Content is clean');
}
```

> **💡 Tip**: Always call `initialize()` before filtering text. This loads the word lists and prepares the filter for use.

### 2. Using Custom Banned Words

You can provide your own list of banned words using various input methods:

#### 📝 String Input

Perfect for simple, static word lists:

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate,violence'
    }
  }
};

const muzzle = new Muzzle({ config });
await muzzle.initialize();

const result = await muzzle.filterText('This contains a badword');
console.log('Matched:', result.matched); // true
```

#### 📋 Array Input

Great for programmatically defined word lists:

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

const muzzle = new Muzzle({ config });
await muzzle.initialize();
```

#### 📁 File Input

Ideal for local word lists that might change:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'file',
      path: './banned-words.txt' // Path to your word list file
    }
  }
};

const muzzle = new Muzzle({ config });
await muzzle.initialize();
```

> **📄 File Format**: The file should contain one word per line for text format, or a JSON array for JSON format.

#### 🌐 URL Input

Perfect for remote word lists that are regularly updated:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000, // Refresh every 24 hours
      cache: true // Enable caching for better performance
    }
  }
};

const muzzle = new Muzzle({ config });
await muzzle.initialize();
```

> **💡 Tip**: Use caching with URL sources to improve performance and reduce network requests.

### 3. Advanced Configuration

Muzzle provides various configuration options to customize the filtering behavior:

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear'
    },
    caseSensitive: false,        // Case insensitive matching
    wholeWord: true,            // Match whole words only
    exactPhrase: false,         // Don't require exact phrase matching
    maxTextLength: 1000000,     // Maximum text length to process
    preprocessText: true,       // Preprocess text before filtering
    parameterHandling: {
      includeParametersInResults: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'profanity': 3,
          'hate': 8,
          'violence': 7
        }
      }
    }
  }
};

const muzzle = new Muzzle({ config });
await muzzle.initialize();
```

#### Configuration Options Explained

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bannedWordsSource` | `object` | - | The source of banned words (required) |
| `caseSensitive` | `boolean` | `false` | Whether to perform case-sensitive matching |
| `wholeWord` | `boolean` | `false` | Whether to match whole words only |
| `exactPhrase` | `boolean` | `false` | Whether to require exact phrase matching |
| `maxTextLength` | `number` | `1000000` | Maximum text length to process (characters) |
| `preprocessText` | `boolean` | `true` | Whether to preprocess text before filtering |
| `parameterHandling` | `object` | - | Configuration for parameterized words |

### 4. Batch Processing

For filtering multiple texts efficiently, use batch processing:

```typescript
const texts = [
  'This is clean text',
  'This contains badword',
  'Another text with profanity',
  'This is also clean'
];

const results = await muzzle.filterBatch(texts.map(text => ({ text })));

results.forEach((result, index) => {
  console.log(`Text ${index + 1}: ${result.passed ? '✅ Passed' : '❌ Failed'}`);
  
  if (!result.passed && result.text?.matched) {
    console.log(`  Matches: ${result.text.matches?.map(m => m.word).join(', ')}`);
  }
});

// Calculate statistics
const passedCount = results.filter(r => r.passed).length;
const failedCount = results.filter(r => !r.passed).length;

console.log(`\n📊 Batch Statistics:`);
console.log(`Total: ${texts.length}`);
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);
```

> **💡 Tip**: Batch processing is more efficient than filtering texts one by one, especially for large numbers of texts.

### 5. Error Handling

Muzzle provides robust error handling. Always wrap your calls in try-catch blocks:

```typescript
try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
  const result = await muzzle.filterText('Some text to filter');
  
  if (result.matched) {
    console.log('🚫 Inappropriate content detected');
    // Handle inappropriate content
  } else {
    console.log('✅ Content is clean');
    // Process clean content
  }
} catch (error) {
  console.error('❌ Text filtering failed:', error);
  
  // Handle specific error types
  if (error.code === 'WORD_LIST_LOAD_FAILED') {
    console.error('Failed to load word list');
  } else if (error.code === 'INVALID_CONFIG') {
    console.error('Invalid configuration');
  } else {
    console.error('Unknown error occurred');
  }
  
  // Implement fallback behavior or show user-friendly error message
}
```

#### Common Error Types

| Error Code | Description | Solution |
|------------|-------------|----------|
| `WORD_LIST_LOAD_FAILED` | Failed to load word list | Check file path or URL |
| `INVALID_CONFIG` | Invalid configuration | Verify configuration object |
| `INITIALIZATION_FAILED` | Failed to initialize | Check logs for details |
| `FILTERING_FAILED` | Text filtering failed | Check input text and try again |

## 🔧 Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const app = express();
app.use(express.json());

// Configure Muzzle for Express
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      cache: true
    }
  }
};

const muzzle = new Muzzle({ config });

// Initialize Muzzle on startup
async function initializeApp() {
  try {
    await muzzle.initialize();
    console.log('✅ Muzzle initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Muzzle:', error);
    process.exit(1);
  }
}

// Middleware to filter request body
app.use(async (req, res, next) => {
  try {
    if (req.body.text) {
      const result = await muzzle.filterText(req.body.text);
      if (result.matched) {
        return res.status(400).json({
          success: false,
          error: 'Inappropriate content detected',
          matches: result.matches?.map(match => ({
            word: match.word,
            context: match.context,
            position: match.position
          })),
          suggestion: 'Please remove inappropriate language and try again'
        });
      }
    }
    next();
  } catch (error) {
    console.error('🚨 Error filtering text:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/comment', (req, res) => {
  // Process the comment (already filtered)
  res.json({ success: true, message: 'Comment posted successfully' });
});

// Start the server
initializeApp().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
});
```

### React Form Validation

```typescript
import { useState, useEffect } from 'react';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

// Configure Muzzle for React
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate,violence'
    }
  }
};

const muzzle = new Muzzle({ config });

function CommentForm() {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Muzzle on component mount
  useEffect(() => {
    async function initialize() {
      try {
        await muzzle.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Muzzle:', err);
        setError('Failed to initialize content filter');
      }
    }
    
    initialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isInitialized) {
      setError('Content filter not ready. Please try again.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await muzzle.filterText(comment);
      
      if (result.matched) {
        const matchedWords = result.matches?.map(m => m.word).join(', ');
        setError(`Please remove inappropriate language from your comment: ${matchedWords}`);
      } else {
        // Submit the comment
        setError('');
        console.log('✅ Comment submitted:', comment);
        // Here you would typically send the comment to your server
        alert('Comment submitted successfully!');
        setComment('');
      }
    } catch (err) {
      console.error('Failed to validate comment:', err);
      setError('Failed to validate comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Enter your comment..."
        className="comment-textarea"
        disabled={!isInitialized || isSubmitting}
      />
      {error && <div className="error-message">{error}</div>}
      <button
        type="submit"
        className="submit-button"
        disabled={!isInitialized || isSubmitting || !comment.trim()}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Comment'}
      </button>
      {!isInitialized && (
        <div className="initializing-message">
          Initializing content filter...
        </div>
      )}
    </form>
  );
}

export default CommentForm;
```

> **💡 Tip**: For more complete integration examples, check out our [Examples](/examples/) directory.

## 🎯 Best Practices

### 1. Initialize Once
Create and initialize Muzzle once when your application starts, not for every request. This improves performance and reduces resource usage.

```typescript
// ✅ Good: Initialize once at startup
const muzzle = new Muzzle({ config });
await muzzle.initialize();

// ❌ Bad: Initialize for every request
app.post('/comment', async (req, res) => {
  const muzzle = new Muzzle({ config }); // Don't do this!
  await muzzle.initialize();
  // ...
});
```

### 2. Choose the Right Word List Source
Select the appropriate word list source for your use case:

- **String**: Small, static word lists
- **Array**: Programmatically defined word lists
- **File**: Local word lists that might change
- **URL**: Remote word lists that are regularly updated

### 3. Configure Caching
Enable caching for URL-based word lists to improve performance and reduce network requests:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/word-list.txt',
      cache: true, // Enable caching
      refreshInterval: 86400000 // Refresh every 24 hours
    }
  }
};
```

### 4. Handle Errors Gracefully
Always implement proper error handling to ensure your application remains stable:

```typescript
try {
  const result = await muzzle.filterText(text);
  // Process result
} catch (error) {
  // Log error for debugging
  console.error('Text filtering error:', error);
  
  // Show user-friendly message
  return res.status(500).json({
    error: 'Content filtering service unavailable'
  });
}
```

### 5. Monitor Performance
Use the status API to monitor the health and performance of your filtering system:

```typescript
const status = await muzzle.getStatus();
console.log('📊 System Status:');
console.log('- Initialized:', status.initialized);
console.log('- Word List Size:', status.wordListSize);
console.log('- Last Updated:', new Date(status.lastUpdated || 0).toLocaleString());
console.log('- Memory Usage:', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
```

## 🚀 Next Steps

- 📖 Explore the [API Reference](/api-reference/) for detailed documentation of all methods and options
- ⚙️ Check out the [Configuration Guide](/configuration/) for advanced configuration options
- 💡 Browse the [Examples](/examples/) for complete integration patterns
- 🧪 Learn about [Parameterized Words](/configuration/#parameterized-words) for sophisticated filtering

---

**Need help?** Check out our [GitHub repository](https://github.com/your-org/muzzle) or open an issue for support.