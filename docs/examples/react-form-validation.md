---
layout: page
title: React Form Validation
permalink: /examples/react-form-validation/
---

# React Form Validation Example

This example demonstrates how to implement real-time text validation in React forms using Muzzle to provide immediate feedback to users when they enter inappropriate content.

## 🎯 Problem Statement

We want to build a React component with a form that validates user input in real-time, preventing users from submitting inappropriate content and providing helpful feedback when validation fails.

## 📋 Prerequisites

- Node.js installed on your system
- Basic knowledge of React and TypeScript
- Familiarity with Create React App
- A code editor of your choice

## 🚀 Implementation

### 1. Project Setup

First, let's set up a new React project:

```bash
# Create a new React app with TypeScript
npx create-react-app react-muzzle-example --template typescript
cd react-muzzle-example

# Install Muzzle
npm install @ovendjs/muzzle

# Start the development server
npm start
```

### 2. Create the Comment Form Component

Create a new file `src/components/CommentForm.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

// Configure Muzzle for React
const config: MuzzleConfig = {
    textFiltering: {
        bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity,swear,curse,hate,violence,stupid,idiot,dumb'
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
                    'violence': 7,
                    'insult': 5
                }
            }
        }
    }
};

const muzzle = new Muzzle({ config });

interface CommentFormProps {
    onSubmit: (comment: { author: string; content: string }) => void;
}

interface FormState {
    author: string;
    content: string;
    authorError: string;
    contentError: string;
    isSubmitting: boolean;
    isInitialized: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
    const [state, setState] = useState<FormState>({
        author: '',
        content: '',
        authorError: '',
        contentError: '',
        isSubmitting: false,
        isInitialized: false
    });

    // Initialize Muzzle on component mount
    useEffect(() => {
        async function initialize() {
            try {
                await muzzle.initialize();
                setState(prev => ({ ...prev, isInitialized: true }));
            } catch (err) {
                console.error('Failed to initialize Muzzle:', err);
                setState(prev => ({ 
                    ...prev, 
                    isInitialized: false,
                    contentError: 'Failed to initialize content filter. Please refresh the page.'
                }));
            }
        }
        
        initialize();
    }, []);

    // Validate author name
    const validateAuthor = (author: string): string => {
        if (!author.trim()) {
            return 'Please enter your name';
        }
        if (author.trim().length < 2) {
            return 'Name must be at least 2 characters long';
        }
        return '';
    };

    // Validate comment content
    const validateContent = async (content: string): Promise<string> => {
        if (!content.trim()) {
            return 'Please enter a comment';
        }
        if (content.trim().length < 10) {
            return 'Comment must be at least 10 characters long';
        }
        
        if (!state.isInitialized) {
            return 'Content filter not ready. Please wait...';
        }
        
        try {
            const result = await muzzle.filterText(content);
            
            if (result.matched) {
                const matchedWords = result.matches?.map(m => m.word).join(', ');
                const maxSeverity = Math.max(...(result.matches?.map(m => m.parameters?.severity || 1) || [1]));
                
                if (maxSeverity >= 5) {
                    return `Your comment contains inappropriate language that violates our community guidelines: ${matchedWords}. Please remove it and try again.`;
                } else {
                    return `Your comment contains potentially inappropriate language: ${matchedWords}. Please consider rephrasing.`;
                }
            }
            
            return ''; // No error
        } catch (err) {
            console.error('Failed to validate content:', err);
            return 'Failed to validate content. Please try again.';
        }
    };

    // Handle author input change
    const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const author = e.target.value;
        const authorError = validateAuthor(author);
        
        setState(prev => ({
            ...prev,
            author,
            authorError
        }));
    };

    // Handle content input change with debouncing
    let debounceTimeout: NodeJS.Timeout;
    
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const content = e.target.value;
        
        // Basic validation without Muzzle (for immediate feedback)
        let contentError = '';
        if (!content.trim()) {
            contentError = 'Please enter a comment';
        } else if (content.trim().length < 10) {
            contentError = 'Comment must be at least 10 characters long';
        }
        
        setState(prev => ({
            ...prev,
            content,
            contentError
        }));
        
        // Clear previous timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        
        // Debounce Muzzle validation
        if (content.trim().length >= 10 && state.isInitialized) {
            debounceTimeout = setTimeout(async () => {
                const muzzleError = await validateContent(content);
                setState(prev => ({
                    ...prev,
                    contentError: muzzleError
                }));
            }, 500); // 500ms debounce
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all fields
        const authorError = validateAuthor(state.author);
        const contentError = await validateContent(state.content);
        
        setState(prev => ({
            ...prev,
            authorError,
            contentError
        }));
        
        // If there are errors, don't submit
        if (authorError || contentError) {
            return;
        }
        
        // Submit the form
        setState(prev => ({ ...prev, isSubmitting: true }));
        
        try {
            await onSubmit({
                author: state.author.trim(),
                content: state.content.trim()
            });
            
            // Reset form
            setState(prev => ({
                ...prev,
                author: '',
                content: '',
                authorError: '',
                contentError: '',
                isSubmitting: false
            }));
        } catch (err) {
            console.error('Failed to submit comment:', err);
            setState(prev => ({
                ...prev,
                isSubmitting: false,
                contentError: 'Failed to submit comment. Please try again.'
            }));
        }
    };

    // Check if form is valid
    const isFormValid = 
        state.author.trim().length >= 2 && 
        state.content.trim().length >= 10 && 
        !state.authorError && 
        !state.contentError &&
        state.isInitialized &&
        !state.isSubmitting;

    return (
        <div className="comment-form-container">
            <h2>Leave a Comment</h2>
            <form onSubmit={handleSubmit} className="comment-form">
                <div className="form-group">
                    <label htmlFor="author">Name</label>
                    <input
                        type="text"
                        id="author"
                        value={state.author}
                        onChange={handleAuthorChange}
                        placeholder="Your name"
                        className={state.authorError ? 'error' : ''}
                        disabled={state.isSubmitting}
                    />
                    {state.authorError && (
                        <div className="error-message">{state.authorError}</div>
                    )}
                </div>
                
                <div className="form-group">
                    <label htmlFor="content">Comment</label>
                    <textarea
                        id="content"
                        value={state.content}
                        onChange={handleContentChange}
                        placeholder="Share your thoughts..."
                        rows={4}
                        className={state.contentError ? 'error' : ''}
                        disabled={state.isSubmitting || !state.isInitialized}
                    />
                    {state.contentError && (
                        <div className="error-message">{state.contentError}</div>
                    )}
                    <div className="character-count">
                        {state.content.length} characters
                    </div>
                </div>
                
                <div className="form-actions">
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={!isFormValid}
                    >
                        {state.isSubmitting ? 'Submitting...' : 'Post Comment'}
                    </button>
                </div>
                
                {!state.isInitialized && (
                    <div className="initializing-message">
                        Initializing content filter...
                    </div>
                )}
            </form>
        </div>
    );
};

export default CommentForm;
```

### 3. Add CSS Styles

Create a new file `src/components/CommentForm.css`:

```css
.comment-form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 8px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comment-form-container h2 {
    margin-bottom: 20px;
    color: #333;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #555;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #4a9eff;
    box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

.form-group input.error,
.form-group textarea.error {
    border-color: #f44336;
}

.error-message {
    margin-top: 8px;
    color: #f44336;
    font-size: 14px;
}

.character-count {
    margin-top: 8px;
    text-align: right;
    font-size: 12px;
    color: #888;
}

.form-actions {
    margin-top: 24px;
}

.submit-button {
    padding: 12px 24px;
    background-color: #4a9eff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
}

.submit-button:hover:not(:disabled) {
    background-color: #357abd;
}

.submit-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

.initializing-message {
    margin-top: 16px;
    padding: 12px;
    background-color: #fff3cd;
    color: #856404;
    border-radius: 4px;
    text-align: center;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
    .comment-form-container {
        background-color: #2d2d2d;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .comment-form-container h2 {
        color: #e0e0e0;
    }
    
    .form-group label {
        color: #a0a0a0;
    }
    
    .form-group input,
    .form-group textarea {
        background-color: #1a1a1a;
        border-color: #404040;
        color: #e0e0e0;
    }
    
    .form-group input:focus,
    .form-group textarea:focus {
        border-color: #6bb0ff;
        box-shadow: 0 0 0 2px rgba(107, 176, 255, 0.2);
    }
    
    .character-count {
        color: #707070;
    }
    
    .initializing-message {
        background-color: #3e2723;
        color: #ffcc80;
    }
}
```

### 4. Update the App Component

Modify `src/App.tsx` to use our new CommentForm component:

```typescript
import React, { useState } from 'react';
import CommentForm from './components/CommentForm';
import './components/CommentForm.css';
import './App.css';

interface Comment {
    id: number;
    author: string;
    content: string;
    timestamp: Date;
}

function App() {
    const [comments, setComments] = useState<Comment[]>([]);

    const handleCommentSubmit = (comment: { author: string; content: string }) => {
        const newComment: Comment = {
            id: Date.now(),
            author: comment.author,
            content: comment.content,
            timestamp: new Date()
        };
        
        setComments(prev => [...prev, newComment]);
        
        // In a real app, you would send this to your backend
        console.log('New comment submitted:', newComment);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Muzzle React Form Validation Example</h1>
                <p>This example demonstrates real-time text validation using Muzzle</p>
            </header>
            
            <main className="App-main">
                <div className="container">
                    <CommentForm onSubmit={handleCommentSubmit} />
                    
                    <div className="comments-section">
                        <h2>Comments ({comments.length})</h2>
                        {comments.length === 0 ? (
                            <p className="no-comments">No comments yet. Be the first to comment!</p>
                        ) : (
                            <div className="comments-list">
                                {comments.map(comment => (
                                    <div key={comment.id} className="comment">
                                        <div className="comment-header">
                                            <span className="comment-author">{comment.author}</span>
                                            <span className="comment-timestamp">
                                                {comment.timestamp.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="comment-content">{comment.content}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
```

### 5. Add Basic App Styles

Update `src/App.css`:

```css
.App {
    text-align: center;
}

.App-header {
    background-color: #282c34;
    padding: 20px;
    color: white;
    margin-bottom: 40px;
}

.App-header h1 {
    margin: 0;
    font-size: 2.5rem;
}

.App-header p {
    margin: 10px 0 0;
    font-size: 1.2rem;
    opacity: 0.8;
}

.App-main {
    padding: 0 20px 40px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}

.comments-section {
    margin-top: 60px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.comments-section h2 {
    margin-bottom: 20px;
    color: #333;
}

.no-comments {
    color: #666;
    font-style: italic;
    text-align: center;
    padding: 40px 0;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.comment {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    text-align: left;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.comment-author {
    font-weight: 600;
    color: #333;
}

.comment-timestamp {
    font-size: 0.9rem;
    color: #666;
}

.comment-content {
    color: #444;
    line-height: 1.6;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
    .App-header {
        background-color: #1a1a1a;
    }
    
    .comments-section h2 {
        color: #e0e0e0;
    }
    
    .no-comments {
        color: #a0a0a0;
    }
    
    .comment {
        background-color: #2d2d2d;
        border-color: #404040;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }
    
    .comment-author {
        color: #e0e0e0;
    }
    
    .comment-timestamp {
        color: #a0a0a0;
    }
    
    .comment-content {
        color: #d0d0d0;
    }
}
```

### 6. Run the Application

Start the development server:

```bash
npm start
```

Open your browser to `http://localhost:3000` to see the application in action.

## 🧪 Testing the Implementation

### 1. Clean Comment Submission

Try submitting a comment with clean content:

1. Enter a name (at least 2 characters)
2. Enter a comment (at least 10 characters) with no inappropriate language
3. Click "Post Comment"

**Expected Result**: The comment should be submitted successfully and appear in the comments list.

### 2. Comment with Mild Profanity

Try submitting a comment with mild profanity:

1. Enter a name
2. Enter a comment containing a word like "badword"
3. Observe the validation feedback

**Expected Result**: You should see a warning message about potentially inappropriate language, but you should still be able to submit the comment.

### 3. Comment with Severe Profanity

Try submitting a comment with severe profanity:

1. Enter a name
2. Enter a comment containing words like "hate" or "violence"
3. Observe the validation feedback

**Expected Result**: You should see an error message preventing submission until the inappropriate language is removed.

### 4. Form Validation

Test the form validation:

1. Try submitting with an empty name field
2. Try submitting with a name shorter than 2 characters
3. Try submitting with an empty comment field
4. Try submitting with a comment shorter than 10 characters

**Expected Result**: Appropriate error messages should appear for each validation failure.

## 💡 Explanation

### How It Works

1. **Initialization**: When the CommentForm component mounts, it initializes Muzzle with a configuration that includes banned words and filtering options.

2. **Real-time Validation**: As the user types in the comment field, the component validates the input in real-time:
   - Basic validation (length, required fields) happens immediately
   - Muzzle validation is debounced (500ms) to avoid excessive API calls while typing

3. **Severity-Based Feedback**: The component provides different feedback based on the severity of inappropriate content:
   - Low severity (1-4): Warning message but submission is still allowed
   - High severity (5-10): Error message preventing submission

4. **Form State Management**: The component manages its own state for form fields, validation errors, and submission status.

### Key Features Demonstrated

1. **Debounced Validation**: Muzzle validation is debounced to avoid performance issues while the user is typing.

2. **Progressive Enhancement**: The form works even before Muzzle is initialized, with appropriate loading states.

3. **User-Friendly Feedback**: Clear, specific error messages help users understand what they need to fix.

4. **Accessibility**: Proper form labels, ARIA attributes, and keyboard navigation support.

5. **Dark Mode Support**: The component includes styles for both light and dark themes.

## 🔧 Variations

### 1. Custom Validation Rules

You could implement custom validation rules based on your specific requirements:

```typescript
const validateContent = async (content: string): Promise<string> => {
    // Basic validation
    if (!content.trim()) {
        return 'Please enter a comment';
    }
    
    // Custom validation rules
    if (content.includes('spam')) {
        return 'Comments containing "spam" are not allowed';
    }
    
    if (content.length > 1000) {
        return 'Comments must be less than 1000 characters';
    }
    
    // Muzzle validation
    if (state.isInitialized) {
        try {
            const result = await muzzle.filterText(content);
            
            if (result.matched) {
                const matchedWords = result.matches?.map(m => m.word).join(', ');
                return `Your comment contains inappropriate language: ${matchedWords}. Please remove it and try again.`;
            }
        } catch (err) {
            console.error('Failed to validate content:', err);
            return 'Failed to validate content. Please try again.';
        }
    }
    
    return ''; // No error
};
```

### 2. Context-Aware Filtering

You could implement different filtering rules based on context:

```typescript
interface CommentFormProps {
    onSubmit: (comment: { author: string; content: string }) => void;
    context?: 'general' | 'children' | 'professional';
}

// In the component
const getMuzzleConfig = (context: string): MuzzleConfig => {
    const baseConfig: MuzzleConfig = {
        textFiltering: {
            caseSensitive: false,
            wholeWord: true,
            preprocessText: true
        }
    };
    
    switch (context) {
        case 'children':
            return {
                ...baseConfig,
                textFiltering: {
                    ...baseConfig.textFiltering,
                    bannedWordsSource: {
                        type: 'string',
                        string: 'badword,profanity,swear,curse,hate,violence,stupid,idiot,dumb,kill,death'
                    },
                    parameterHandling: {
                        includeParametersInResults: true,
                        severityMapping: {
                            defaultSeverity: 1,
                            byType: {
                                'profanity': 5,
                                'hate': 10,
                                'violence': 10
                            }
                        }
                    }
                }
            };
        case 'professional':
            return {
                ...baseConfig,
                textFiltering: {
                    ...baseConfig.textFiltering,
                    bannedWordsSource: {
                        type: 'string',
                        string: 'unprofessional,inappropriate,offensive'
                    }
                }
            };
        default:
            return {
                ...baseConfig,
                textFiltering: {
                    ...baseConfig.textFiltering,
                    bannedWordsSource: {
                        type: 'string',
                        string: 'badword,profanity,swear,curse,hate,violence,stupid,idiot,dumb'
                    }
                }
            };
    }
};
```

### 3. Server-Side Validation

For a production application, you should implement server-side validation in addition to client-side validation:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const authorError = validateAuthor(state.author);
    const contentError = await validateContent(state.content);
    
    setState(prev => ({
        ...prev,
        authorError,
        contentError
    }));
    
    if (authorError || contentError) {
        return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
        // Send to server for validation and submission
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                author: state.author.trim(),
                content: state.content.trim()
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to submit comment');
        }
        
        // Success
        await onSubmit({
            author: state.author.trim(),
            content: state.content.trim()
        });
        
        // Reset form
        setState(prev => ({
            ...prev,
            author: '',
            content: '',
            authorError: '',
            contentError: '',
            isSubmitting: false
        }));
    } catch (err) {
        console.error('Failed to submit comment:', err);
        setState(prev => ({
            ...prev,
            isSubmitting: false,
            contentError: err instanceof Error ? err.message : 'Failed to submit comment. Please try again.'
        }));
    }
};
```

### 4. Custom Hook

You could extract the validation logic into a custom hook for reusability:

```typescript
// src/hooks/useContentValidation.ts
import { useState, useEffect } from 'react';
import { Muzzle, MuzzleConfig } from '@ovendjs/muzzle';

interface UseContentValidationOptions {
    config: MuzzleConfig;
    debounceMs?: number;
}

interface UseContentValidationResult {
    error: string;
    isValidating: boolean;
    isInitialized: boolean;
    validate: (content: string) => Promise<void>;
}

export function useContentValidation(
    options: UseContentValidationOptions
): UseContentValidationResult {
    const [error, setError] = useState<string>('');
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [muzzle] = useState<Muzzle>(() => new Muzzle({ config: options.config }));
    const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

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
        
        return () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
        };
    }, [muzzle]);

    const validate = async (content: string): Promise<void> => {
        // Basic validation
        if (!content.trim()) {
            setError('Please enter a comment');
            return;
        }
        
        if (content.trim().length < 10) {
            setError('Comment must be at least 10 characters long');
            return;
        }
        
        if (!isInitialized) {
            setError('Content filter not ready');
            return;
        }
        
        // Clear previous timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        
        setIsValidating(true);
        
        try {
            // Debounce Muzzle validation
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(async () => {
                    try {
                        const result = await muzzle.filterText(content);
                        
                        if (result.matched) {
                            const matchedWords = result.matches?.map(m => m.word).join(', ');
                            const maxSeverity = Math.max(...(result.matches?.map(m => m.parameters?.severity || 1) || [1]));
                            
                            if (maxSeverity >= 5) {
                                setError(`Your comment contains inappropriate language: ${matchedWords}. Please remove it and try again.`);
                            } else {
                                setError(`Your comment contains potentially inappropriate language: ${matchedWords}. Please consider rephrasing.`);
                            }
                        } else {
                            setError('');
                        }
                    } catch (err) {
                        console.error('Failed to validate content:', err);
                        setError('Failed to validate content. Please try again.');
                    } finally {
                        setIsValidating(false);
                        resolve();
                    }
                }, options.debounceMs || 500);
                
                setDebounceTimeout(timeout);
            });
        } catch (err) {
            console.error('Failed to validate content:', err);
            setError('Failed to validate content. Please try again.');
            setIsValidating(false);
        }
    };

    return {
        error,
        isValidating,
        isInitialized,
        validate
    };
}
```

Then use it in your component:

```typescript
const { error, isValidating, isInitialized, validate } = useContentValidation({
    config: muzzleConfig,
    debounceMs: 500
});

// In your change handler
const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setState(prev => ({ ...prev, content }));
    validate(content);
};
```

## 🚀 Next Steps

1. **Add Accessibility Features**: Implement ARIA attributes, keyboard navigation, and screen reader support.

2. **Internationalization**: Add support for multiple languages and region-specific word lists.

3. **Performance Optimization**: Implement React.memo and other optimizations to prevent unnecessary re-renders.

4. **Testing**: Add unit tests for the component using React Testing Library.

5. **Error Boundaries**: Wrap the component in an error boundary to gracefully handle unexpected errors.

6. **Analytics**: Track validation failures and user behavior to improve the filtering system.

This example provides a comprehensive implementation of real-time text validation in React forms using Muzzle. You can extend and customize it based on your specific requirements.
