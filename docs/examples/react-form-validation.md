---
layout: page
title: React Form Validation
permalink: /examples/react-form-validation/
---

# React Form Validation

## 🎯 Problem Statement

You're building a React application with a form that requires text input, and you want to provide real-time validation to prevent users from submitting inappropriate content. You need to:

- Validate user input as they type
- Provide immediate feedback when inappropriate content is detected
- Show detailed information about what was found
- Maintain a good user experience without blocking the UI
- Handle loading states and errors gracefully

## 📋 Prerequisites

- Node.js and npm/yarn installed
- Basic knowledge of React and TypeScript
- Familiarity with React Hooks
- Muzzle library installed (`npm install @ovendjs/muzzle`)

## 💻 Implementation

### Complete Example

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Muzzle, MuzzleConfig, TextMatchResult } from '@ovendjs/muzzle';

interface CommentFormProps {
  onSubmit: (comment: string) => void;
  maxCharacters?: number;
  placeholder?: string;
}

interface ValidationState {
  isValidating: boolean;
  errors: string[];
  lastValidated: string;
  matches: Array<{
    word: string;
    context: string;
    severity?: number;
  }>;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  onSubmit, 
  maxCharacters = 500,
  placeholder = "Share your thoughts..."
}) => {
  const [comment, setComment] = useState('');
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    errors: [],
    lastValidated: '',
    matches: []
  });
  const [muzzle, setMuzzle] = useState<Muzzle | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Muzzle on component mount
  useEffect(() => {
    const initializeMuzzle = async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity,swear,curse,hate,violence,inappropriate'
          },
          caseSensitive: false,
          wholeWord: true
        }
      };

      try {
        const muzzleInstance = new Muzzle({ config });
        await muzzleInstance.initialize();
        setMuzzle(muzzleInstance);
        setIsInitialized(true);
        console.log('✅ Muzzle initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Muzzle:', error);
        setValidationState(prev => ({
          ...prev,
          errors: ['Failed to initialize content validation. Please refresh the page.']
        }));
      }
    };

    initializeMuzzle();
  }, []);

  // Validation function with debouncing
  const validateComment = useCallback(async (text: string): Promise<TextMatchResult | null> => {
    if (!muzzle || !text.trim() || !isInitialized) return null;

    try {
      const result = await muzzle.filterText(text);
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return null;
    }
  }, [muzzle, isInitialized]);

  // Debounced validation
  useEffect(() => {
    if (!comment.trim() || !isInitialized) {
      setValidationState(prev => ({
        ...prev,
        errors: [],
        matches: []
      }));
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      const result = await validateComment(comment);
      
      if (result) {
        const errors = result.matched 
          ? result.matches.map(match => `Inappropriate word: "${match.word}"`)
          : [];
        
        setValidationState({
          isValidating: false,
          errors,
          lastValidated: comment,
          matches: result.matches.map(match => ({
            word: match.word,
            context: match.context,
            severity: match.severity
          }))
        });
      } else {
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          errors: [],
          matches: []
        }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [comment, validateComment, isInitialized]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // Enforce character limit
    if (newText.length <= maxCharacters) {
      setComment(newText);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    if (!comment.trim()) {
      setValidationState(prev => ({
        ...prev,
        errors: ['Please enter a comment']
      }));
      return;
    }

    // Validate one more time before submission
    const result = await validateComment(comment);
    
    if (result && result.matched) {
      const errors = result.matches.map(match => `Inappropriate word: "${match.word}"`);
      setValidationState(prev => ({
        ...prev,
        errors,
        matches: result.matches.map(match => ({
          word: match.word,
          context: match.context,
          severity: match.severity
        }))
      }));
      return;
    }

    // Check if we have any initialization errors
    if (!isInitialized) {
      setValidationState(prev => ({
        ...prev,
        errors: ['Content validation is not ready. Please wait a moment and try again.']
      }));
      return;
    }

    onSubmit(comment);
    setComment('');
    setValidationState({
      isValidating: false,
      errors: [],
      lastValidated: '',
      matches: []
    });
    setSubmitAttempted(false);
  };

  const isFormValid = comment.trim().length > 0 && 
                    validationState.errors.length === 0 && 
                    isInitialized;

  return (
    <div className="comment-form">
      <style jsx>{`
        .comment-form {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .form-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
        }
        
        .textarea-container {
          position: relative;
          margin-bottom: 16px;
        }
        
        .comment-textarea {
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 2px solid #e1e4e8;
          border-radius: 8px;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .comment-textarea:focus {
          outline: none;
          border-color: #0366d6;
          box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
        }
        
        .comment-textarea.has-errors {
          border-color: #d73a49;
        }
        
        .character-count {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 12px;
          color: #586069;
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .character-count.warning {
          color: #fb8500;
        }
        
        .character-count.error {
          color: #d73a49;
        }
        
        .validation-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #586069;
        }
        
        .validation-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e1e4e8;
          border-top: 2px solid #0366d6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-messages {
          margin-bottom: 16px;
        }
        
        .error-message {
          background: #ffebe9;
          border: 1px solid #d73a49;
          color: #d73a49;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        
        .matches-details {
          background: #fff5b1;
          border: 1px solid #f9c513;
          color: #735c0f;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .matches-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .match-item {
          margin-bottom: 6px;
          padding: 4px 0;
          border-bottom: 1px solid rgba(115, 92, 15, 0.1);
        }
        
        .match-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .match-word {
          font-weight: 600;
          color: #d73a49;
        }
        
        .match-context {
          font-style: italic;
          color: #586069;
        }
        
        .match-severity {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }
        
        .severity-low {
          background: #d4edda;
          color: #155724;
        }
        
        .severity-medium {
          background: #fff3cd;
          color: #856404;
        }
        
        .severity-high {
          background: #f8d7da;
          color: #721c24;
        }
        
        .submit-button {
          background: #0366d6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .submit-button:hover:not(:disabled) {
          background: #0256cc;
        }
        
        .submit-button:disabled {
          background: #94d3a2;
          cursor: not-allowed;
        }
        
        .init-error {
          background: #ffebe9;
          border: 1px solid #d73a49;
          color: #d73a49;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }
      `}</style>
      
      <h3 className="form-title">Leave a Comment</h3>
      
      {!isInitialized && (
        <div className="init-error">
          ⚠️ Content validation is initializing. Please wait...
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="textarea-container">
          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder={placeholder}
            rows={4}
            className={`comment-textarea ${
              (validationState.errors.length > 0 || submitAttempted) && !comment.trim() ? 'has-errors' : ''
            }`}
            disabled={!isInitialized}
          />
          <div className={`character-count ${
            comment.length > maxCharacters * 0.9 ? 'warning' : ''
          } ${
            comment.length >= maxCharacters ? 'error' : ''
          }`}>
            {comment.length}/{maxCharacters}
          </div>
        </div>
        
        {validationState.isValidating && (
          <div className="validation-status">
            <div className="validation-spinner"></div>
            Validating...
          </div>
        )}
        
        {validationState.errors.length > 0 && (
          <div className="error-messages">
            {validationState.errors.map((error, index) => (
              <div key={index} className="error-message">
                <svg className="error-icon" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                </svg>
                {error}
              </div>
            ))}
          </div>
        )}
        
        {validationState.matches.length > 0 && (
          <div className="matches-details">
            <div className="matches-title">Found inappropriate content:</div>
            {validationState.matches.map((match, index) => (
              <div key={index} className="match-item">
                <span className="match-word">{match.word}</span>
                {match.severity && (
                  <span className={`match-severity ${
                    match.severity <= 3 ? 'severity-low' :
                    match.severity <= 6 ? 'severity-medium' : 'severity-high'
                  }`}>
                    Severity: {match.severity}/10
                  </span>
                )}
                <div className="match-context">Context: "{match.context}"</div>
              </div>
            ))}
          </div>
        )}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={!isFormValid || validationState.isValidating}
        >
          {validationState.isValidating ? 'Validating...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
};

export default CommentForm;
```

## 🔍 Explanation

### 1. Component Structure

The component is structured with several key parts:

```typescript
interface CommentFormProps {
  onSubmit: (comment: string) => void;
  maxCharacters?: number;
  placeholder?: string;
}

interface ValidationState {
  isValidating: boolean;
  errors: string[];
  lastValidated: string;
  matches: Array<{
    word: string;
    context: string;
    severity?: number;
  }>;
}
```

- `CommentFormProps`: Defines the component's input properties
- `ValidationState`: Manages the validation state including errors, matches, and loading state

### 2. Initialization

Muzzle is initialized once when the component mounts:

```typescript
useEffect(() => {
  const initializeMuzzle = async () => {
    const config: MuzzleConfig = {
      textFiltering: {
        bannedWordsSource: {
          type: 'string',
          string: 'badword,profanity,swear,curse,hate,violence,inappropriate'
        },
        caseSensitive: false,
        wholeWord: true
      }
    };

    try {
      const muzzleInstance = new Muzzle({ config });
      await muzzleInstance.initialize();
      setMuzzle(muzzleInstance);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Muzzle:', error);
      setValidationState(prev => ({
        ...prev,
        errors: ['Failed to initialize content validation. Please refresh the page.']
      }));
    }
  };

  initializeMuzzle();
}, []);
```

This ensures Muzzle is ready before any validation occurs.

### 3. Debounced Validation

The validation is debounced to avoid excessive API calls:

```typescript
useEffect(() => {
  if (!comment.trim() || !isInitialized) {
    setValidationState(prev => ({
      ...prev,
      errors: [],
      matches: []
    }));
    return;
  }

  const debounceTimer = setTimeout(async () => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    const result = await validateComment(comment);
    
    if (result) {
      const errors = result.matched 
        ? result.matches.map(match => `Inappropriate word: "${match.word}"`)
        : [];
      
      setValidationState({
        isValidating: false,
        errors,
        lastValidated: comment,
        matches: result.matches.map(match => ({
          word: match.word,
          context: match.context,
          severity: match.severity
        }))
      });
    }
  }, 500); // 500ms debounce

  return () => clearTimeout(debounceTimer);
}, [comment, validateComment, isInitialized]);
```

Key features:
- 500ms debounce delay
- Only validates when there's text to check
- Shows loading state during validation
- Updates state with detailed match information

### 4. Form Submission

The form submission includes final validation:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitAttempted(true);
  
  if (!comment.trim()) {
    setValidationState(prev => ({
      ...prev,
      errors: ['Please enter a comment']
    }));
    return;
  }

  // Validate one more time before submission
  const result = await validateComment(comment);
  
  if (result && result.matched) {
    const errors = result.matches.map(match => `Inappropriate word: "${match.word}"`);
    setValidationState(prev => ({
      ...prev,
      errors,
      matches: result.matches.map(match => ({
        word: match.word,
        context: match.context,
