---
layout: page
title: Examples
permalink: /examples/
---

# Examples

This page provides practical examples of using Muzzle in various scenarios and applications.

## Web Application Examples

### Express.js Comment Moderation

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
    console.log('Muzzle initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Muzzle:', error);
    process.exit(1);
  }
}

// Comment submission endpoint
app.post('/api/comments', async (req, res) => {
  try {
    const { text, author } = req.body;
    
    if (!text || !author) {
      return res.status(400).json({ error: 'Text and author are required' });
    }

    // Filter the comment text
    const result = await muzzle.filterText(text);
    
    if (result.matched) {
      // Return detailed feedback about what was found
      return res.status(400).json({
        success: false,
        error: 'Inappropriate content detected',
        matches: result.matches.map(match => ({
          word: match.word,
          context: match.context
        })),
        suggestion: 'Please remove inappropriate language and try again'
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
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error processing comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Batch comment processing endpoint
app.post('/api/comments/batch', async (req, res) => {
  try {
    const { comments } = req.body;
    
    if (!Array.isArray(comments) || comments.length === 0) {
      return res.status(400).json({ error: 'Comments array is required' });
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
        cleanComments.push(comment);
      } else {
        inappropriateComments.push({
          ...comment,
          matches: result.text?.matches || []
        });
      }
    });

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
  } catch (error) {
    console.error('Error processing batch comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const status = await muzzle.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

initializeApp().then(() => {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
```

### React Form with Real-time Validation

```typescript
import React, { useState, useEffect } from 'react';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

interface CommentFormProps {
  onSubmit: (comment: string) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [muzzle, setMuzzle] = useState<Muzzle | null>(null);

  // Initialize Muzzle on component mount
  useEffect(() => {
    const initializeMuzzle = async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity,swear,curse,hate,violence'
          },
          caseSensitive: false,
          wholeWord: true
        }
      };

      const muzzleInstance = new Muzzle({ config });
      try {
        await muzzleInstance.initialize();
        setMuzzle(muzzleInstance);
      } catch (error) {
        console.error('Failed to initialize Muzzle:', error);
      }
    };

    initializeMuzzle();
  }, []);

  const validateComment = async (text: string): Promise<string[]> => {
    if (!muzzle || !text.trim()) return [];

    try {
      const result = await muzzle.filterText(text);
      return result.matched 
        ? result.matches.map(match => `Inappropriate word: "${match.word}"`)
        : [];
    } catch (error) {
      console.error('Validation error:', error);
      return ['Validation failed. Please try again.'];
    }
  };

  const handleCommentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setComment(newText);

    if (newText.trim()) {
      setIsValidating(true);
      const validationErrors = await validateComment(newText);
      setErrors(validationErrors);
      setIsValidating(false);
    } else {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setErrors(['Please enter a comment']);
      return;
    }

    const validationErrors = await validateComment(comment);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(comment);
    setComment('');
    setErrors([]);
  };

  return (
    <div className="comment-form">
      <h3>Leave a Comment</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          placeholder="Share your thoughts..."
          rows={4}
          className={errors.length > 0 ? 'has-errors' : ''}
        />
        
        {isValidating && (
          <div className="validation-status">
            Validating...
          </div>
        )}
        
        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isValidating || errors.length > 0}
        >
          Post Comment
        </button>
      </form>
    </div>
  );
};

export default CommentForm;
```

## Chat Application Example

### Socket.IO Chat Moderation

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configure Muzzle for chat moderation
const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'url',
      url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
      refreshInterval: 86400000,
      cache: true
    },
    caseSensitive: false,
    wholeWord: true
  }
};

const muzzle = new Muzzle({ config });

// Store user sessions
const userSessions = new Map<string, {
  username: string;
  warnings: number;
  isMuted: boolean;
}>();

// Initialize Muzzle
async function initializeApp() {
  try {
    await muzzle.initialize();
    console.log('Muzzle initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Muzzle:', error);
    process.exit(1);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins chat
  socket.on('join', (username: string) => {
    userSessions.set(socket.id, {
      username,
      warnings: 0,
      isMuted: false
    });

    socket.broadcast.emit('user-joined', {
      username,
      message: `${username} joined the chat`
    });

    socket.emit('join-success', {
      message: `Welcome to the chat, ${username}!`
    });
  });

  // Handle chat messages
  socket.on('chat-message', async (data: { message: string }) => {
    const session = userSessions.get(socket.id);
    
    if (!session) {
      socket.emit('error', { message: 'Please join the chat first' });
      return;
    }

    if (session.isMuted) {
      socket.emit('error', { message: 'You are muted and cannot send messages' });
      return;
    }

    try {
      // Filter the message
      const result = await muzzle.filterText(data.message);
      
      if (result.matched) {
        // Increment warning count
        session.warnings += 1;
        
        // Notify user about inappropriate content
        socket.emit('message-rejected', {
          reason: 'inappropriate-content',
          matches: result.matches.map(match => match.word),
          warnings: session.warnings,
          message: 'Your message contains inappropriate language'
        });

        // Mute user after 3 warnings
        if (session.warnings >= 3) {
          session.isMuted = true;
          socket.emit('user-muted', {
            message: 'You have been muted for repeated violations'
          });
          
          // Notify other users
          socket.broadcast.emit('user-muted-broadcast', {
            username: session.username
          });
        }

        return;
      }

      // Message is clean, broadcast it
      const chatMessage = {
        id: Date.now(),
        username: session.username,
        message: data.message,
        timestamp: new Date()
      };

      io.emit('chat-message', chatMessage);
    } catch (error) {
      console.error('Error filtering message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const session = userSessions.get(socket.id);
    if (session) {
      socket.broadcast.emit('user-left', {
        username: session.username,
        message: `${session.username} left the chat`
      });
      userSessions.delete(socket.id);
    }
  });
});

// Admin endpoint to refresh word lists
app.post('/api/admin/refresh-wordlist', async (req, res) => {
  try {
    await muzzle.refresh();
    res.json({ success: true, message: 'Word list refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing word list:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh word list' });
  }
});

// Admin endpoint to get system status
app.get('/api/admin/status', async (req, res) => {
  try {
    const status = await muzzle.getStatus();
    const activeUsers = Array.from(userSessions.values()).filter(session => !session.isMuted);
    const mutedUsers = Array.from(userSessions.values()).filter(session => session.isMuted);

    res.json({
      success: true,
      status,
      stats: {
        totalUsers: userSessions.size,
        activeUsers: activeUsers.length,
        mutedUsers: mutedUsers.length
      }
    });
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

initializeApp().then(() => {
  const port = process.env.PORT || 3001;
  server.listen(port, () => {
    console.log(`Chat server running on port ${port}`);
  });
});
```

## Content Management System Example

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  status: 'draft' | 'pending-review' | 'published' | 'rejected';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

class ContentModerationService {
  private muzzle: Muzzle;
  private strictMuzzle: Muzzle;

  constructor() {
    // Standard configuration for general content
    const standardConfig: MuzzleConfig = {
      textFiltering: {
        bannedWordsSource: {
          type: 'url',
          url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
          refreshInterval: 86400000,
          cache: true
        },
        caseSensitive: false,
        wholeWord: true
      }
    };

    // Strict configuration for titles and sensitive content
    const strictConfig: MuzzleConfig = {
      textFiltering: {
        bannedWordsSource: {
          type: 'array',
          array: [
            // Common profanity
            'badword', 'profanity', 'swear', 'curse',
            // Hate speech terms
            'hate', 'racist', 'discrimination', 'slur',
            // Violence terms
            'violence', 'kill', 'murder', 'attack',
            // Spam terms
            'spam', 'scam', 'clickbait', 'fake'
          ]
        },
        caseSensitive: false,
        wholeWord: true,
        exactPhrase: false
      }
    };

    this.muzzle = new Muzzle({ config: standardConfig });
    this.strictMuzzle = new Muzzle({ config: strictConfig });
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.muzzle.initialize(),
      this.strictMuzzle.initialize()
    ]);
  }

  async moderateArticle(article: Article): Promise<{
    approved: boolean;
    issues: string[];
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Check title with strict filtering
    const titleResult = await this.strictMuzzle.filterText(article.title);
    if (titleResult.matched) {
      severity = 'high';
      issues.push('Title contains inappropriate language');
      titleResult.matches.forEach(match => {
        suggestions.push(`Remove "${match.word}" from the title`);
      });
    }

    // Check content with standard filtering
    const contentResult = await this.muzzle.filterText(article.content);
    if (contentResult.matched) {
      if (severity === 'low') severity = 'medium';
      issues.push('Content contains inappropriate language');
      
      // Group matches by word for better suggestions
      const wordCounts = new Map<string, number>();
      contentResult.matches.forEach(match => {
        wordCounts.set(match.word, (wordCounts.get(match.word) || 0) + 1);
      });

      wordCounts.forEach((count, word) => {
        suggestions.push(`Replace or remove "${word}" (appears ${count} time${count > 1 ? 's' : ''})`);
      });
    }

    // Check for excessive capitalization (potential shouting)
    if (this.hasExcessiveCapitalization(article.title)) {
      issues.push('Title uses excessive capitalization');
      suggestions.push('Use normal capitalization in the title');
    }

    // Check for excessive punctuation
    if (this.hasExcessivePunctuation(article.content)) {
      issues.push('Content uses excessive punctuation');
      suggestions.push('Use punctuation moderately');
    }

    // Check for potential spam patterns
    if (this.detectSpamPatterns(article.content)) {
      severity = 'high';
      issues.push('Content appears to be spam');
      suggestions.push('Remove spam-like content and links');
    }

    return {
      approved: issues.length === 0,
      issues,
      severity,
      suggestions
    };
  }

  async moderateBatch(articles: Article[]): Promise<{
    results: Array<{
      articleId: string;
      moderation: Awaited<ReturnType<typeof this.moderateArticle>>;
    }>;
    summary: {
      total: number;
      approved: number;
      rejected: number;
      needsReview: number;
    };
  }> {
    const moderationPromises = articles.map(async (article) => ({
      articleId: article.id,
      moderation: await this.moderateArticle(article)
    }));

    const results = await Promise.all(moderationPromises);

    const summary = {
      total: articles.length,
      approved: results.filter(r => r.moderation.approved).length,
      rejected: results.filter(r => !r.moderation.approved && r.moderation.severity === 'high').length,
      needsReview: results.filter(r => !r.moderation.approved && r.moderation.severity !== 'high').length
    };

    return { results, summary };
  }

  private hasExcessiveCapitalization(text: string): boolean {
    const capitalLetters = text.replace(/[^A-Z]/g, '').length;
    const totalLetters = text.replace(/[^a-zA-Z]/g, '').length;
    return totalLetters > 10 && (capitalLetters / totalLetters) > 0.5;
  }

  private hasExcessivePunctuation(text: string): boolean {
    const punctuationCount = (text.match(/[!?.]/g) || []).length;
    return punctuationCount > 10;
  }

  private detectSpamPatterns(text: string): boolean {
    // Check for excessive links
    const linkCount = (text.match(/https?:\/\/\S+/g) || []).length;
    if (linkCount > 3) return true;

    // Check for repetitive phrases
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // If any word appears more than 5 times in a short text, it might be spam
    for (const [word, count] of wordCounts) {
      if (count > 5 && word.length > 3) return true;
    }

    // Check for common spam keywords
    const spamKeywords = ['click here', 'free money', 'limited time', 'act now', 'guaranteed'];
    const lowerText = text.toLowerCase();
    return spamKeywords.some(keyword => lowerText.includes(keyword));
  }
}

// Usage example
async function contentModerationExample() {
  const service = new ContentModerationService();
  await service.initialize();

  const articles: Article[] = [
    {
      id: '1',
      title: 'Great Article About Technology',
      content: 'This is a well-written article about recent technological advancements.',
      author: 'John Doe',
      status: 'pending-review',
      tags: ['technology', 'innovation'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'AMAZING OFFER!!! CLICK NOW!!!',
      content: 'FREE MONEY!!! CLICK HERE FOR AMAZING OFFER!!! LIMITED TIME!!! GUARANTEED!!!',
      author: 'Spam Bot',
      status: 'pending-review',
      tags: ['spam'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const { results, summary } = await service.moderateBatch(articles);

  console.log('Moderation Summary:', summary);
  results.forEach(result => {
    console.log(`Article ${result.articleId}:`, result.moderation);
  });
}
```

## Parameterized Words Examples

### Basic Parameterized Words Usage

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword[type=slur][severity=8],profanity[type=profanity][severity=5],hate[type=hate][severity=9]'
    },
    parameterHandling: {
      includeParametersInResults: true,
      severityMapping: {
        defaultSeverity: 1,
        byType: {
          'slur': 8,
          'profanity': 5,
          'hate': 9
        }
      }
    }
  }
};

const muzzle = new Muzzle({ config });

async function checkText() {
  const result = await muzzle.filterText('This contains a badword and hate speech');
  
  if (result.matched) {
    result.matches.forEach(match => {
      console.log(`Found word: ${match.word}`);
      console.log(`Type: ${match.parameters?.type}`);
      console.log(`Severity: ${match.severity}`);
      console.log(`Context: ${match.context}`);
      console.log('---');
    });
  }
}

checkText();
```

### Advanced Parameterized Words with Custom Parameters

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

const config: MuzzleConfig = {
  textFiltering: {
    bannedWordsSource: {
      type: 'array',
      array: [
        'slur[type=slur][severity=10][blocked=true][category=hate-speech]',
        'violence[type=violence][severity=7][blocked=true][category=threat]',
        'spam[type=spam][severity=3][blocked=false][category=unwanted]',
        {
          word: 'scam',
          parameters: {
            type: 'scam',
            severity: 6,
            blocked: true,
            category: 'fraud',
            requiresReview: true
          }
        }
      ]
    },
    parameterHandling: {
      defaultParameters: {
        type: 'unknown',
        category: 'general'
      },
      includeParametersInResults: true,
      autoConvertNonParameterized: true,
      parameterValidation: {
        required: ['type'],
        allowedTypes: {
          'type': 'string',
          'severity': 'number',
          'blocked': 'boolean',
          'category': 'string',
          'requiresReview': 'boolean'
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

const muzzle = new Muzzle({ config });

async function moderateContent() {
  const texts = [
    'This is clean content',
    'This contains a slur and violence',
    'This might be a scam attempt'
  ];

  for (const text of texts) {
    const result = await muzzle.filterText(text);
    
    console.log(`Text: "${text}"`);
    console.log(`Passed: ${!result.matched}`);
    
    if (result.matched) {
      result.matches.forEach(match => {
        console.log(`  - Word: ${match.word}`);
        console.log(`    Type: ${match.parameters?.type}`);
        console.log(`    Category: ${match.parameters?.category}`);
        console.log(`    Severity: ${match.severity}`);
        console.log(`    Blocked: ${match.parameters?.blocked}`);
        console.log(`    Needs Review: ${match.parameters?.requiresReview || false}`);
      });
    }
    console.log('---');
  }
}

moderateContent();
```

### Content Moderation with Parameterized Severity Levels

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

interface ModerationResult {
  approved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  matches: Array<{
    word: string;
    type: string;
    severity: number;
    action: 'block' | 'flag' | 'review';
  }>;
}

class AdvancedContentModerator {
  private muzzle: Muzzle;

  constructor() {
    const config: MuzzleConfig = {
      textFiltering: {
        bannedWordsSource: {
          type: 'string',
          string: `
            hate[type=hate][severity=9][action=block],
            slur[type=slur][severity=10][action=block],
            violence[type=violence][severity=8][action=block],
            profanity[type=profanity][severity=5][action=flag],
            spam[type=spam][severity=3][action=flag],
            scam[type=scam][severity=7][action=review]
          `
        },
        parameterHandling: {
          includeParametersInResults: true,
          severityMapping: {
            defaultSeverity: 1,
            byType: {
              'hate': 9,
              'slur': 10,
              'violence': 8,
              'profanity': 5,
              'spam': 3,
              'scam': 7
            }
          }
        }
      }
    };

    this.muzzle = new Muzzle({ config });
  }

  async initialize(): Promise<void> {
    await this.muzzle.initialize();
  }

  async moderateContent(text: string): Promise<ModerationResult> {
    const result = await this.muzzle.filterText(text);
    
    if (!result.matched) {
      return {
        approved: true,
        severity: 'low',
        matches: []
      };
    }

    const matches = result.matches.map(match => ({
      word: match.word,
      type: match.parameters?.type || 'unknown',
      severity: match.severity || 1,
      action: match.parameters?.action || 'flag'
    }));

    const maxSeverity = Math.max(...matches.map(m => m.severity));
    let severity: 'low' | 'medium' | 'high' | 'critical';
    
    if (maxSeverity >= 9) severity = 'critical';
    else if (maxSeverity >= 7) severity = 'high';
    else if (maxSeverity >= 4) severity = 'medium';
    else severity = 'low';

    const hasBlockAction = matches.some(m => m.action === 'block');
    
    return {
      approved: !hasBlockAction,
      severity,
      matches
    };
  }
}

// Usage example
async function advancedModerationExample() {
  const moderator = new AdvancedContentModerator();
  await moderator.initialize();

  const contents = [
    'This is a perfectly fine message',
    'This contains some profanity but should be okay',
    'This contains hate speech and should be blocked',
    'This might be a scam attempt and needs review'
  ];

  for (const content of contents) {
    const result = await moderator.moderateContent(content);
    
    console.log(`Content: "${content}"`);
    console.log(`Approved: ${result.approved}`);
    console.log(`Severity: ${result.severity}`);
    
    if (result.matches.length > 0) {
      console.log('Matches:');
      result.matches.forEach(match => {
        console.log(`  - ${match.word} (${match.type}, severity ${match.severity}, action: ${match.action})`);
      });
    }
    console.log('---');
  }
}

advancedModerationExample();
```

### Dynamic Parameter Handling Based on Context

```typescript
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

class ContextAwareModerator {
  private strictMuzzle: Muzzle;
  private relaxedMuzzle: Muzzle;

  constructor() {
    // Strict configuration for public content
    const strictConfig: MuzzleConfig = {
      textFiltering: {
        bannedWordsSource: {
          type: 'string',
          string: 'badword,profanity,hate,violence,slur'
        },
        parameterHandling: {
          defaultParameters: {
            context: 'public',
            strictness: 'high'
          },
          includeParametersInResults: true,
          severityMapping: {
            defaultSeverity: 5,
            byType: {
              'profanity': 7,
              'hate': 10,
              'violence': 9,
              'slur': 10
            }
          }
        }
      }
    };

    // Relaxed configuration for private content
    const relaxedConfig: MuzzleConfig = {
      textFiltering: {
        bannedWordsSource: {
          type: 'string',
          string: 'hate,violence,slur'
        },
        parameterHandling: {
          defaultParameters: {
            context: 'private',
            strictness: 'low'
          },
          includeParametersInResults: true,
          severityMapping: {
            defaultSeverity: 3,
            byType: {
              'hate': 8,
              'violence': 7,
              'slur': 9
            }
          }
        }
      }
    };

    this.strictMuzzle = new Muzzle({ config: strictConfig });
    this.relaxedMuzzle = new Muzzle({ config: relaxedConfig });
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.strictMuzzle.initialize(),
      this.relaxedMuzzle.initialize()
    ]);
  }

  async moderateContent(text: string, context: 'public' | 'private'): Promise<any> {
    const muzzle = context === 'public' ? this.strictMuzzle : this.relaxedMuzzle;
    return await muzzle.filterText(text);
  }
}

// Usage example
async function contextAwareExample() {
  const moderator = new ContextAwareModerator();
  await moderator.initialize();

  const testContent = 'This contains some profanity and hate speech';

  console.log('Testing in public context:');
  const publicResult = await moderator.moderateContent(testContent, 'public');
  console.log(`Matches found: ${publicResult.matched}`);
  if (publicResult.matched) {
    publicResult.matches.forEach(match => {
      console.log(`  - ${match.word} (context: ${match.parameters?.context}, strictness: ${match.parameters?.strictness})`);
    });
  }

  console.log('\nTesting in private context:');
  const privateResult = await moderator.moderateContent(testContent, 'private');
  console.log(`Matches found: ${privateResult.matched}`);
  if (privateResult.matched) {
    privateResult.matches.forEach(match => {
      console.log(`  - ${match.word} (context: ${match.parameters?.context}, strictness: ${match.parameters?.strictness})`);
    });
  }
}

contextAwareExample();
```

These examples demonstrate how Muzzle can be integrated into various types of applications to provide effective content moderation and filtering capabilities. Each example shows different aspects of the library and how to handle different scenarios you might encounter in real-world applications.