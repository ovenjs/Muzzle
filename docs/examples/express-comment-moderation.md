---
layout: page
title: Express.js Comment Moderation
permalink: /examples/express-comment-moderation/
---

# Express.js Comment Moderation

## 🎯 Problem Statement

You're building a web application with a comment system and need to moderate user-generated content to prevent inappropriate language from being displayed. You want to:

- Filter comments in real-time as they're submitted
- Provide clear feedback to users when their comments contain inappropriate content
- Handle batch processing of multiple comments efficiently
- Monitor system health and performance

## 📋 Prerequisites

- Node.js installed on your system
- Basic knowledge of Express.js
- Familiarity with TypeScript
- Muzzle library installed (`npm install @ovendjs/muzzle`)

## 💻 Implementation

### Complete Example

```typescript
import express from 'express';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const app = express();
app.use(express.json());

// Configure Muzzle for comment moderation
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000, // Refresh every 24 hours
      cache: true
    },
    caseSensitive: false,
    wholeWord: true
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

// Comment submission endpoint
app.post('/api/comments', async (req, res) => {
  try {
    const { text, author } = req.body;
    
    if (!text || !author) {
      return res.status(400).json({ 
        error: 'Text and author are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate input length
    if (text.length > 1000) {
      return res.status(400).json({
        error: 'Comment text must be less than 1000 characters',
        code: 'TEXT_TOO_LONG'
      });
    }

    // Filter the comment text
    const result = await muzzle.filterText(text);
    
    if (result.matched) {
      // Return detailed feedback about what was found
      return res.status(400).json({
        success: false,
        error: 'Inappropriate content detected',
        code: 'INAPPROPRIATE_CONTENT',
        matches: result.matches.map(match => ({
          word: match.word,
          context: match.context,
          position: match.position
        })),
        suggestion: 'Please remove inappropriate language and try again',
        severity: result.severity || 'medium'
      });
    }

    // Save the clean comment to database
    // const savedComment = await saveCommentToDatabase({ text, author });
    
    res.json({
      success: true,
      message: 'Comment posted successfully',
      comment: {
        text,
        author,
        timestamp: new Date(),
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('🚨 Error processing comment:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Batch comment processing endpoint
app.post('/api/comments/batch', async (req, res) => {
  try {
    const { comments } = req.body;
    
    if (!Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ 
        error: 'Comments array is required',
        code: 'INVALID_INPUT'
      });
    }

    // Limit batch size to prevent abuse
    if (comments.length > 100) {
      return res.status(400).json({
        error: 'Batch size cannot exceed 100 comments',
        code: 'BATCH_TOO_LARGE'
      });
    }

    // Process comments in batch
    const results = await muzzle.filterBatch(
      comments.map(comment => ({ text: comment.text }))
    );

    // Separate clean and inappropriate comments
    const cleanComments = [];
    const inappropriateComments = [];

    comments.forEach((comment, index) => {
      const result = results[index];
      if (result.passed) {
        cleanComments.push({
          ...comment,
          status: 'approved',
          processedAt: new Date()
        });
      } else {
        inappropriateComments.push({
          ...comment,
          status: 'rejected',
          matches: result.text?.matches || [],
          severity: result.severity,
          processedAt: new Date()
        });
      }
    });

    res.json({
      success: true,
      summary: {
        total: comments.length,
        clean: cleanComments.length,
        inappropriate: inappropriateComments.length,
        processingTime: results.reduce((acc, result) => acc + (result.metadata?.processingTime || 0), 0)
      },
      cleanComments,
      inappropriateComments
    });
  } catch (error) {
    console.error('🚨 Error processing batch comments:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// System status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const status = await muzzle.getStatus();
    res.json({
      success: true,
      status: {
        ...status,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('🚨 Error getting status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'UNHANDLED_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

initializeApp().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`📈 System status: http://localhost:${port}/api/status`);
  });
});
```

## 🔍 Explanation

### 1. Configuration Setup

We start by configuring Muzzle with a URL-based word list that refreshes every 24 hours:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000, // Refresh every 24 hours
      cache: true
    },
    caseSensitive: false,
    wholeWord: true
  }
};
```

This configuration:
- Uses a remote word list from GitHub
- Enables caching for better performance
- Sets case-insensitive matching
- Enables whole-word matching to avoid false positives

### 2. Comment Submission Endpoint

The `/api/comments` endpoint handles single comment submissions:

```typescript
app.post('/api/comments', async (req, res) => {
  // Input validation
  if (!text || !author) {
    return res.status(400).json({ 
      error: 'Text and author are required',
      code: 'MISSING_FIELDS'
    });
  }

  // Text filtering
  const result = await muzzle.filterText(text);
  
  if (result.matched) {
    // Return detailed feedback
    return res.status(400).json({
      success: false,
      error: 'Inappropriate content detected',
      matches: result.matches.map(match => ({
        word: match.word,
        context: match.context,
        position: match.position
      }))
    });
  }

  // Save clean comment
  res.json({
    success: true,
    message: 'Comment posted successfully',
    comment: {
      text,
      author,
      timestamp: new Date(),
      status: 'approved'
    }
  });
});
```

Key features:
- Comprehensive input validation
- Detailed error responses with error codes
- Rich feedback about inappropriate content
- Structured success responses

### 3. Batch Processing Endpoint

The `/api/comments/batch` endpoint efficiently processes multiple comments:

```typescript
app.post('/api/comments/batch', async (req, res) => {
  // Batch size validation
  if (comments.length > 100) {
    return res.status(400).json({
      error: 'Batch size cannot exceed 100 comments',
      code: 'BATCH_TOO_LARGE'
    });
  }

  // Process comments in batch
  const results = await muzzle.filterBatch(
    comments.map(comment => ({ text: comment.text }))
  );

  // Separate clean and inappropriate comments
  const cleanComments = [];
  const inappropriateComments = [];

  comments.forEach((comment, index) => {
    const result = results[index];
    if (result.passed) {
      cleanComments.push({ ...comment, status: 'approved' });
    } else {
      inappropriateComments.push({
        ...comment,
        status: 'rejected',
        matches: result.text?.matches || []
      });
    }
  });

  // Return detailed results
  res.json({
    success: true,
    summary: {
      total: comments.length,
      clean: cleanComments.length,
      inappropriate: inappropriateComments.length
    },
    cleanComments,
    inappropriateComments
  });
});
```

Key features:
- Batch size limits to prevent abuse
- Efficient processing using Muzzle's batch API
- Detailed categorization of results
- Processing metrics and statistics

### 4. System Monitoring

The `/api/status` endpoint provides system health information:

```typescript
app.get('/api/status', async (req, res) => {
  const status = await muzzle.getStatus();
  res.json({
    success: true,
    status: {
      ...status,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    }
  });
});
```

This provides:
- Muzzle system status
- Application uptime
- Memory usage statistics
- Timestamp for monitoring

## 🔄 Variations

### 1. Custom Word List

To use a custom word list instead of the default one:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword,profanity,swear,curse,hate,violence,inappropriate'
    }
  }
};
```

### 2. Strict Mode

For stricter filtering, enable additional options:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://example.com/strict-word-list.txt'
    },
    caseSensitive: false,
    wholeWord: true,
    exactPhrase: true
  }
};
```

### 3. Parameterized Words

For more sophisticated filtering with severity levels:

```typescript
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword[type=profanity][severity=5],hate[type=hate][severity=9]'
    },
    parameterHandling: {
      includeParametersInResults: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'profanity': 5,
          'hate': 9
        }
      }
    }
  }
};
```

## 🚀 Best Practices

1. **Initialize Once**: Create and initialize Muzzle once when your application starts, not for every request.

2. **Handle Errors Gracefully**: Always implement proper error handling to ensure your application remains stable.

3. **Validate Input**: Validate all input parameters before processing to prevent abuse.

4. **Monitor Performance**: Use the status API to monitor the health and performance of your filtering system.

5. **Set Appropriate Limits**: Implement rate limiting and batch size limits to prevent abuse.

6. **Provide Clear Feedback**: Give users clear, actionable feedback when their content is filtered.

## 🧪 Testing the Implementation

1. Start the server:
   ```bash
   ts-node your-server-file.ts
   ```

2. Test with appropriate content:
   ```bash
   curl -X POST http://localhost:3000/api/comments \
     -H "Content-Type: application/json" \
     -d '{"text": "This is a clean comment", "author": "John"}'
   ```

3. Test with inappropriate content:
   ```bash
   curl -X POST http://localhost:3000/api/comments \
     -H "Content-Type: application/json" \
     -d '{"text": "This contains a badword", "author": "John"}'
   ```

4. Test batch processing:
   ```bash
   curl -X POST http://localhost:3000/api/comments/batch \
     -H "Content-Type: application/json" \
     -d '{"comments": [{"text": "Clean comment", "author": "John"}, {"text": "Bad comment", "author": "Jane"}]}'
   ```

5. Check system status:
   ```bash
   curl http://localhost:3000/api/status
   ```

This implementation provides a robust, production-ready comment moderation system that can be easily integrated into any Express.js application.