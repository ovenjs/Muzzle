---
layout: page
title: Express.js Comment Moderation
permalink: /examples/express-comment-moderation/
---

# Express.js Comment Moderation Example

This example demonstrates how to integrate Muzzle with an Express.js application to moderate user comments in real-time.

## 🎯 Problem Statement

We want to build a simple blog API that automatically filters inappropriate content from user comments before they are saved to the database.

## 📋 Prerequisites

- Node.js installed on your system
- Basic knowledge of Express.js
- Familiarity with TypeScript
- A code editor of your choice

## 🚀 Implementation

### 1. Project Setup

First, let's set up a new Express.js project:

```bash
# Create a new directory for our project
mkdir express-muzzle-example
cd express-muzzle-example

# Initialize a new Node.js project
npm init -y

# Install dependencies
npm install express @ovendjs/muzzle cors
npm install -D typescript @types/express @types/cors ts-node nodemon
```

### 2. TypeScript Configuration

Create a `tsconfig.json` file:

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "outDir": "./dist",
        "rootDir": "./src"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
}
```

### 3. Create the Express Server

Create a `src` directory and add an `index.ts` file:

```typescript
import express from 'express';
import cors from 'cors';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Muzzle
const config: MuzzleConfig = {
    textFiltering: {
        bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity,swear,curse,hate,violence,stupid,idiot'
        },
        caseSensitive: false,
        wholeWord: true,
        preprocessText: true,
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

// Initialize Muzzle
const muzzle = new Muzzle({ config });

// In-memory storage for comments (in a real app, you'd use a database)
const comments: Array<{
    id: number;
    author: string;
    content: string;
    timestamp: Date;
    approved: boolean;
}> = [];

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

// Middleware to filter comment content
const filterContent = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }
        
        const result = await muzzle.filterText(content);
        
        if (result.matched) {
            // Content contains inappropriate language
            const matchedWords = result.matches?.map(m => m.word).join(', ');
            const maxSeverity = Math.max(...(result.matches?.map(m => m.parameters?.severity || 1) || [1]));
            
            // For this example, we'll reject content with severity 5 or higher
            if (maxSeverity >= 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Inappropriate content detected',
                    message: 'Your comment contains language that violates our community guidelines.',
                    matchedWords,
                    severity: maxSeverity,
                    suggestion: 'Please remove inappropriate language and try again.'
                });
            } else {
                // For lower severity, we'll flag the comment for review but still allow it
                req.body.flagged = true;
                req.body.flaggedWords = matchedWords;
                req.body.severity = maxSeverity;
                next();
            }
        } else {
            // Content is clean
            req.body.flagged = false;
            next();
        }
    } catch (error) {
        console.error('🚨 Error filtering content:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to process your comment. Please try again later.'
        });
    }
};

// Routes

// Get all comments
app.get('/api/comments', (req, res) => {
    res.json({
        success: true,
        data: comments
    });
});

// Create a new comment
app.post('/api/comments', filterContent, (req, res) => {
    try {
        const { author, content, flagged, flaggedWords, severity } = req.body;
        
        if (!author || !content) {
            return res.status(400).json({
                success: false,
                error: 'Author and content are required'
            });
        }
        
        const newComment = {
            id: comments.length + 1,
            author,
            content,
            timestamp: new Date(),
            approved: !flagged // Auto-approve if not flagged
        };
        
        comments.push(newComment);
        
        console.log(`📝 New comment ${flagged ? '(FLAGGED)' : '(APPROVED)'} by ${author}`);
        if (flagged) {
            console.log(`   Flagged words: ${flaggedWords}`);
            console.log(`   Severity: ${severity}/10`);
        }
        
        res.status(201).json({
            success: true,
            data: {
                ...newComment,
                flagged,
                flaggedWords: flaggedWords || [],
                severity: severity || 0
            },
            message: flagged 
                ? 'Your comment has been posted but is under review.' 
                : 'Your comment has been posted successfully.'
        });
    } catch (error) {
        console.error('🚨 Error creating comment:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to create comment. Please try again later.'
        });
    }
});

// Get a specific comment
app.get('/api/comments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const comment = comments.find(c => c.id === id);
    
    if (!comment) {
        return res.status(404).json({
            success: false,
            error: 'Comment not found'
        });
    }
    
    res.json({
        success: true,
        data: comment
    });
});

// Approve a flagged comment
app.post('/api/comments/:id/approve', (req, res) => {
    const id = parseInt(req.params.id);
    const comment = comments.find(c => c.id === id);
    
    if (!comment) {
        return res.status(404).json({
            success: false,
            error: 'Comment not found'
        });
    }
    
    comment.approved = true;
    
    console.log(`✅ Comment ${id} approved`);
    
    res.json({
        success: true,
        data: comment,
        message: 'Comment has been approved.'
    });
});

// Delete a comment
app.delete('/api/comments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = comments.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Comment not found'
        });
    }
    
    const deletedComment = comments.splice(index, 1)[0];
    
    console.log(`🗑️ Comment ${id} deleted`);
    
    res.json({
        success: true,
        data: deletedComment,
        message: 'Comment has been deleted.'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        muzzle: {
            initialized: true
        }
    });
});

// Start the server
initializeApp().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📝 Try posting a comment to http://localhost:${port}/api/comments`);
    });
});
```

### 4. Update package.json Scripts

Add the following scripts to your `package.json`:

```json
{
    "scripts": {
        "start": "node dist/index.js",
        "dev": "nodemon src/index.ts",
        "build": "tsc"
    }
}
```

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

## 🧪 Testing the Implementation

You can test the API using curl or any API client like Postman:

### 1. Create a Clean Comment

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "author": "John Doe",
    "content": "This is a great article! I really enjoyed reading it."
  }'
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "author": "John Doe",
        "content": "This is a great article! I really enjoyed reading it.",
        "timestamp": "2023-07-15T12:34:56.789Z",
        "approved": true,
        "flagged": false,
        "flaggedWords": [],
        "severity": 0
    },
    "message": "Your comment has been posted successfully."
}
```

### 2. Create a Comment with Mild Profanity

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "author": "Jane Smith",
    "content": "This is a badword example, but the article is good."
  }'
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "id": 2,
        "author": "Jane Smith",
        "content": "This is a badword example, but the article is good.",
        "timestamp": "2023-07-15T12:35:12.345Z",
        "approved": false,
        "flagged": true,
        "flaggedWords": [
            "badword"
        ],
        "severity": 3
    },
    "message": "Your comment has been posted but is under review."
}
```

### 3. Try to Create a Comment with Severe Profanity

```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "author": "Offensive User",
    "content": "This is hate speech and violence."
  }'
```

**Expected Response:**
```json
{
    "success": false,
    "error": "Inappropriate content detected",
    "message": "Your comment contains language that violates our community guidelines.",
    "matchedWords": [
        "hate",
        "violence"
    ],
    "severity": 8,
    "suggestion": "Please remove inappropriate language and try again."
}
```

### 4. Get All Comments

```bash
curl http://localhost:3000/api/comments
```

### 5. Approve a Flagged Comment

```bash
curl -X POST http://localhost:3000/api/comments/2/approve
```

## 💡 Explanation

### How It Works

1. **Initialization**: When the server starts, we initialize Muzzle with our configuration, which includes a list of banned words and filtering options.

2. **Middleware**: We created a `filterContent` middleware that intercepts POST requests to create comments. This middleware:
   - Extracts the content from the request body
   - Uses Muzzle to filter the content
   - Checks if inappropriate content was found
   - Determines the severity of the content
   - Rejects high-severity content (severity 5+)
   - Flags low-severity content for review but allows it
   - Passes clean content through to the next middleware

3. **Severity-Based Actions**: We implemented a tiered approach to content moderation:
   - **Low severity (1-4)**: Content is flagged for review but immediately posted
   - **High severity (5-10)**: Content is rejected with a user-friendly error message

4. **Database Storage**: In a real application, you would store the comments in a database along with their moderation status (approved, flagged, rejected).

### Key Features Demonstrated

1. **Real-time Content Filtering**: Comments are filtered as they are submitted, providing immediate feedback.

2. **Severity-Based Moderation**: Different actions are taken based on the severity of the inappropriate content.

3. **Transparent Feedback**: Users receive clear feedback about why their content was flagged or rejected.

4. **Administrative Controls**: Endpoints are provided for moderators to approve or delete flagged comments.

## 🔧 Variations

### 1. Using a URL-Based Word List

Instead of a static string, you could use a URL-based word list that's regularly updated:

```typescript
const config: MuzzleConfig = {
    textFiltering: {
        bannedWordsSource: {
            type: 'url',
            url: 'https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt',
            refreshInterval: 86400000, // Refresh every 24 hours
            cache: true
        }
    }
};
```

### 2. Custom Severity Thresholds

You could make the severity threshold configurable:

```typescript
const rejectionThreshold = process.env.REJECTION_SEVERITY_THRESHOLD 
    ? parseInt(process.env.REJECTION_SEVERITY_THRESHOLD) 
    : 5;

// In the middleware
if (maxSeverity >= rejectionThreshold) {
    // Reject content
}
```

### 3. User-Specific Filtering

You could implement different filtering rules based on user roles or preferences:

```typescript
interface User {
    id: string;
    username: string;
    role: 'admin' | 'moderator' | 'user';
    strictFiltering?: boolean;
}

// In the middleware
const user = await getUserFromToken(req.headers.authorization);
const filteringOptions = user.strictFiltering 
    ? { wholeWord: false } // More strict
    : { wholeWord: true };  // Less strict

const result = await muzzle.filterText(content, filteringOptions);
```

### 4. Automated Reporting

You could implement automated reporting for repeated violations:

```typescript
// Track violations by user/IP
const violationTracker = new Map<string, { count: number; lastViolation: Date }>();

// In the middleware
if (result.matched) {
    const userIdentifier = req.ip; // Or user ID if authenticated
    const violations = violationTracker.get(userIdentifier) || { count: 0, lastViolation: new Date() };
    
    violations.count++;
    violations.lastViolation = new Date();
    
    violationTracker.set(userIdentifier, violations);
    
    // Temporarily ban users with multiple violations
    if (violations.count >= 5) {
        return res.status(403).json({
            success: false,
            error: 'Account temporarily suspended',
            message: 'Your account has been temporarily suspended due to multiple violations of our community guidelines.'
        });
    }
}
```

## 🚀 Next Steps

1. **Add Authentication**: Implement user authentication to track violations by user rather than IP address.

2. **Database Integration**: Replace the in-memory storage with a proper database like MongoDB or PostgreSQL.

3. **Admin Dashboard**: Create a dashboard for moderators to review flagged content and manage banned words.

4. **Notification System**: Implement notifications for moderators when content is flagged.

5. **Custom Word Lists**: Allow different communities or sections to have their own custom word lists.

6. **Performance Monitoring**: Add metrics and logging to monitor the performance of the filtering system.

This example provides a solid foundation for integrating content moderation into your Express.js applications using Muzzle. You can extend and customize it based on your specific requirements.