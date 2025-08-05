---
layout: page
title: Getting Started
permalink: /getting-started/
---

# Getting Started with Muzzle

This guide will help you get up and running with Muzzle in your Node.js application.

## Installation

First, install Muzzle using npm:

```bash
npm install @ovendjs/muzzle
```

Or using yarn:

```bash
yarn add @ovendjs/muzzle
```

## Basic Usage

### 1. Simple Text Filtering

The simplest way to use Muzzle is with the default configuration:

```typescript
import { Muzzle } from '@ovendjs/muzzle';

// Initialize Muzzle with default settings
const muzzle = new Muzzle();

// Filter some text
const result = await muzzle.filterText('This text contains some bad words');

if (result.matched) {
  console.log('Found inappropriate content:');
  result.matches.forEach(match => {
    console.log(`- "${match.word}" at position ${match.position.start}-${match.position.end}`);
    console.log(`  Context: ${match.context}`);
  });
} else {
  console.log('Content is clean');
}
```

### 2. Using Custom Banned Words

You can provide your own list of banned words using various input methods:

#### String Input

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse'
    }
  }
};

const muzzle = new Muzzle({ config });
const result = await muzzle.filterText('This contains a badword');
```

#### Array Input

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: ['badword', 'profanity', 'swear', 'curse']
    }
  }
};

const muzzle = new Muzzle({ config });
```

#### File Input

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'file',
      filePath: '/path/to/your/banned-words.txt',
      format: 'text' // or 'json', 'csv'
    }
  }
};

const muzzle = new Muzzle({ config });
```

#### URL Input

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/banned-words.txt',
      format: 'text',
      refreshInterval: 86400000 // Refresh every 24 hours
    }
  }
};

const muzzle = new Muzzle({ config });
```

### 3. Advanced Configuration

Muzzle provides various configuration options to customize the filtering behavior:

```typescript
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear'
    },
    caseSensitive: false,        // Case insensitive matching
    wholeWord: true,            // Match whole words only
    exactPhrase: false,         // Don't require exact phrase matching
    useRegex: false,            // Don't use regex patterns
    maxTextLength: 1000000,     // Maximum text length to process
    preprocessText: true        // Preprocess text before filtering
  }
};

const muzzle = new Muzzle({ config });
```

### 4. Batch Processing

For filtering multiple texts efficiently, use batch processing:

```typescript
const results = await muzzle.filterBatch([
  { text: 'This is clean text' },
  { text: 'This contains badword' },
  { text: 'Another text with profanity' }
]);

results.forEach((result, index) => {
  console.log(`Text ${index + 1}: ${result.passed ? 'Passed' : 'Failed'}`);
});
```

### 5. Error Handling

Muzzle provides robust error handling. Always wrap your calls in try-catch blocks:

```typescript
try {
  const muzzle = new Muzzle({ config });
  await muzzle.initialize();
  const result = await muzzle.filterText('Some text to filter');
  // Process result...
} catch (error) {
  console.error('Text filtering failed:', error);
  // Handle error appropriately
}
```

## Integration Examples

### Express.js Middleware

```typescript
import express from 'express';
import { Muzzle } from '@ovendjs/muzzle';

const app = express();
app.use(express.json());

const muzzle = new Muzzle();

// Middleware to filter request body
app.use(async (req, res, next) => {
  try {
    if (req.body.text) {
      const result = await muzzle.filterText(req.body.text);
      if (result.matched) {
        return res.status(400).json({
          error: 'Inappropriate content detected',
          matches: result.matches
        });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

app.post('/comment', (req, res) => {
  // Process the comment (already filtered)
  res.json({ success: true });
});
```

### React Form Validation

```typescript
import { useState } from 'react';
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle();

function CommentForm() {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await muzzle.filterText(comment);
      if (result.matched) {
        setError('Please remove inappropriate language from your comment');
      } else {
        // Submit the comment
        setError('');
        console.log('Comment submitted:', comment);
      }
    } catch (err) {
      setError('Failed to validate comment');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Enter your comment..."
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Best Practices

1. **Initialize Once**: Create and initialize Muzzle once when your application starts, not for every request.

2. **Use Appropriate Word Lists**: Choose the right banned words source for your use case. For most applications, the default GitHub profanity words list is a good starting point.

3. **Configure Caching**: Enable caching for URL-based word lists to improve performance and reduce network requests.

4. **Handle Errors Gracefully**: Always implement proper error handling to ensure your application remains stable.

5. **Monitor Performance**: Use the status API to monitor the health and performance of your filtering system.

```typescript
const status = await muzzle.getStatus();
console.log('System status:', status);
```

## Next Steps

- Explore the [API Reference](api-reference.md) for detailed documentation of all methods and options
- Check out the [Configuration Guide](configuration.md) for advanced configuration options
- Browse the [Examples](examples.md) for more integration patterns