---
layout: page
title: Text Replacement Examples
permalink: /examples/text-replacement/
---

# Text Replacement Examples

This guide demonstrates how to use the text replacement feature in Muzzle to filter and replace inappropriate content in various ways.

## 🎯 Problem Statement

We want to build applications that can automatically detect and replace inappropriate content in user-generated text. Muzzle's text replacement feature allows you to configure how matched content should be handled - whether it should be replaced with asterisks, custom strings, or completely removed.

## 📋 Prerequisites

- Node.js installed on your system
- Basic knowledge of TypeScript
- Familiarity with Muzzle text filtering concepts
- A code editor of your choice

## 🚀 Implementation

### 1. Basic Replacement Configuration

#### Asterisk Replacement

Replace matched words with asterisks while preserving the original word length:

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'array',
        array: ['bad', 'horrible', 'terrible'],
      },
    },
    replacement: {
      enabled: true,
      strategy: 'asterisks',
      preserveCase: true,
    },
  },
});

await muzzle.initialize();

const result = await muzzle.filterText('This is really bad text');
console.log(result.matches[0]?.replacement); // '***'

const filteredText = await muzzle.getFilteredText('This is really bad text');
console.log(filteredText); // 'This is really *** text'
```

#### Custom String Replacement

Replace matched words with a custom string:

```typescript
const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'array',
        array: ['bad', 'horrible', 'terrible'],
      },
    },
    replacement: {
      enabled: true,
      strategy: 'custom',
      customString: '[REDACTED]',
      preserveCase: false,
    },
  },
});

await muzzle.initialize();

const result = await muzzle.filterText('This is bad text');
console.log(result.matches[0]?.replacement); // '[REDACTED]'

const filteredText = await muzzle.getFilteredText('This is bad text');
console.log(filteredText); // 'This is [REDACTED] text'
```

#### Removal Replacement

Completely remove matched words from text:

```typescript
const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'array',
        array: ['bad', 'horrible', 'terrible'],
      },
    },
    replacement: {
      enabled: true,
      strategy: 'remove',
    },
  },
});

await muzzle.initialize();

const result = await muzzle.filterText('This is bad text');
console.log(result.matches[0]?.replacement); // ''

const filteredText = await muzzle.getFilteredText('This is bad text');
console.log(filteredText); // 'This is  text'
```

### 2. Advanced Configuration

#### Custom Asterisk Characters

Use a custom character instead of asterisks:

```typescript
const muzzle = new Muzzle({
  config: {
    replacement: {
      enabled: true,
      strategy: 'asterisks',
      asteriskChar: '#',
    },
  },
});

const filteredText = await muzzle.getFilteredText('This is bad text');
console.log(filteredText); // 'This is ### text'
```

#### Fixed Asterisk Count

Replace all words with a fixed number of characters:

```typescript
const muzzle = new Muzzle({
  config: {
    replacement: {
      enabled: true,
      strategy: 'asterisks',
      asteriskCount: 4, // Always use 4 characters
    },
  },
});

const filteredText = await muzzle.getFilteredText('This is bad and horrible text');
console.log(filteredText); // 'This is #### and ###### text'
```

#### Per-Request Replacement Options

Override global replacement configuration for specific requests:

```typescript
// Global configuration uses asterisks
const muzzle = new Muzzle({
  config: {
    replacement: {
      enabled: true,
      strategy: 'asterisks',
    },
  },
});

// This specific request uses custom replacement
const result = await muzzle.filterText('This is bad text', {
  replacement: {
    enabled: true,
    strategy: 'custom',
    customString: '[CENSORED]',
  },
});

console.log(result.matches[0]?.replacement); // '[CENSORED]'
```

### 3. Real-world Implementation Examples

#### Discord Bot Moderation

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'url',
        url: 'https://example.com/banned-words.txt',
        refreshInterval: 3600000, // Refresh every hour
      },
    },
    replacement: {
      enabled: true,
      strategy: 'asterisks',
      preserveCase: true,
      preserveBoundaries: true,
    },
  },
});

async function moderateMessage(content: string) {
  const result = await muzzle.filterText(content);
  
  if (result.matched) {
    // Log the violation
    console.log(`Violation detected: ${result.matches.map(m => m.word).join(', ')}`);
    
    // Get the filtered content for display
    const filteredContent = await muzzle.getFilteredText(content);
    return filteredContent;
  }
  
  return content;
}

// Usage in a Discord bot
client.on('message', async (message) => {
  if (message.author.bot) return;
  
  const filteredContent = await moderateMessage(message.content);
  if (filteredContent !== message.content) {
    await message.edit(filteredContent);
    await message.react('🚫'); // React to indicate moderation
  }
});
```

#### Comment Moderation for a Blog

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'file',
        filePath: './banned-words.txt',
        cache: true,
        ttl: 86400000, // 24 hours
      },
    },
    replacement: {
      enabled: true,
      strategy: 'custom',
      customString: '[MODERATED]',
      preserveCase: false,
    },
  },
});

interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
}

async function moderateComment(comment: Comment): Promise<{ approved: boolean; moderatedContent?: string }> {
  const result = await muzzle.filterText(comment.content);
  
  if (!result.matched) {
    return { approved: true };
  }
  
  const moderatedContent = await muzzle.getFilteredText(comment.content);
  
  return {
    approved: false,
    moderatedContent,
  };
}

// Usage in a blog comment system
app.post('/api/comments', async (req, res) => {
  const comment = req.body;
  const moderation = await moderateComment(comment);
  
  if (moderation.approved) {
    // Save the comment
    await saveComment(comment);
    res.json({ success: true });
  } else {
    // Save the moderated version and flag for review
    await saveModeratedComment({
      ...comment,
      content: moderation.moderatedContent!,
      status: 'pending_review',
    });
    res.json({
      success: true,
      moderated: true,
      content: moderation.moderatedContent
    });
  }
});
```

#### User Content Filtering in a Social App

```typescript
import { Muzzle } from '@ovendjs/muzzle';

const muzzle = new Muzzle({
  config: {
    textFiltering: {
      bannedWordsSource: {
        type: 'array',
        array: ['spam', 'scam', 'fake'],
      },
    },
    replacement: {
      enabled: true,
      strategy: 'remove',
    },
  },
});

interface UserContent {
  id: string;
  text: string;
  type: 'post' | 'bio' | 'comment';
  userId: string;
}

async function filterUserContent(content: UserContent): Promise<{ filtered: boolean; filteredContent: string }> {
  const result = await muzzle.filterText(content.text);
  
  if (!result.matched) {
    return { filtered: false, filteredContent: content.text };
  }
  
  const filteredContent = await muzzle.getFilteredText(content.text);
  
  // Log the filtering for moderation review
  await logContentFiltering({
    contentId: content.id,
    userId: content.userId,
    originalContent: content.text,
    filteredContent,
    matches: result.matches,
    severity: result.severity,
  });
  
  return { filtered: true, filteredContent };
}

// Usage in a social media application
app.post('/api/content', async (req, res) => {
  const content = req.body;
  const filtering = await filterUserContent(content);
  
  if (filtering.filtered) {
    // Content was modified, save the filtered version
    await saveContent({
      ...content,
      text: filtering.filteredContent,
      filtered: true,
    });
    res.json({
      success: true,
      filtered: true,
      content: filtering.filteredContent
    });
  } else {
    // Content is clean, save as-is
    await saveContent(content);
    res.json({ success: true, filtered: false });
  }
});
```

## ⚙️ Configuration Reference

### ReplacementConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Whether to enable text replacement |
| `strategy` | `'asterisks' \| 'custom' \| 'remove' \| 'none'` | `'asterisks'` | Replacement strategy to use |
| `customString` | `string` | `'[REDACTED]'` | Custom replacement string (for 'custom' strategy) |
| `asteriskChar` | `string` | `'*'` | Character to use for asterisk replacement |
| `asteriskCount` | `'full' \| number` | `'full'` | Number of characters to replace with |
| `preserveBoundaries` | `boolean` | `true` | Whether to preserve word boundaries |
| `preserveCase` | `boolean` | `true` | Whether to preserve original word case |
| `wholeWordOnly` | `boolean` | `true` | Whether to replace only whole words |

### Best Practices

1. **Choose the right strategy**:
   - Use `asterisks` for general-purpose content filtering
   - Use `custom` for branded or specific replacement text
   - Use `remove` for strict content moderation

2. **Consider performance**:
   - Enable caching for word list sources when possible
   - Use appropriate refresh intervals for dynamic sources
   - Consider the impact of case preservation on performance

3. **Handle edge cases**:
   - Test with various text formats and edge cases
   - Consider how to handle overlapping matches
   - Plan for content that needs human review

4. **Logging and monitoring**:
   - Log replacement operations for moderation review
   - Monitor false positives/negatives
   - Track performance metrics

## 🔧 Variations

### 1. Context-Aware Replacement

You could implement different replacement strategies based on content context:

```typescript
const getReplacementConfig = (context: 'general' | 'children' | 'professional'): ReplacementConfig => {
  switch (context) {
    case 'children':
      return {
        enabled: true,
        strategy: 'asterisks',
        asteriskChar: '*',
        preserveCase: true,
        wholeWordOnly: true
      };
    case 'professional':
      return {
        enabled: true,
        strategy: 'custom',
        customString: '[PROFESSIONAL]',
        preserveCase: false
      };
    default:
      return {
        enabled: true,
        strategy: 'asterisks',
        preserveCase: true
      };
  }
};

// Usage based on context
const result1 = await muzzle.filterText(text, { replacement: getReplacementConfig('children') });
const result2 = await muzzle.filterText(text, { replacement: getReplacementConfig('professional') });
```

### 2. Severity-Based Replacement

Apply different replacement strategies based on the severity of violations:

```typescript
async function filterWithSeverityBasedReplacement(text: string) {
  const result = await muzzle.filterText(text);
  
  if (!result.matched) {
    return { filtered: false, filteredText: text };
  }
  
  // Get the maximum severity from all matches
  const maxSeverity = Math.max(...(result.matches?.map(m => m.parameters?.severity || 1) || [1]));
  
  // Determine replacement strategy based on severity
  let replacementConfig: ReplacementConfig;
  
  if (maxSeverity >= 8) {
    // High severity - completely remove
    replacementConfig = { enabled: true, strategy: 'remove' };
  } else if (maxSeverity >= 5) {
    // Medium severity - custom replacement
    replacementConfig = {
      enabled: true,
      strategy: 'custom',
      customString: '[FLAGGED]',
      preserveCase: false
    };
  } else {
    // Low severity - asterisks
    replacementConfig = {
      enabled: true,
      strategy: 'asterisks',
      preserveCase: true
    };
  }
  
  const filteredText = await muzzle.getFilteredText(text, { replacement: replacementConfig });
  
  return {
    filtered: true,
    filteredText,
    severity: maxSeverity,
    matches: result.matches
  };
}
```

### 3. Progressive Replacement

Implement a progressive approach that first tries milder replacement strategies before resorting to removal:

```typescript
interface ProgressiveFilterOptions {
  initialStrategy?: 'asterisks' | 'custom';
  customString?: string;
  escalateThreshold?: number;
  finalStrategy?: 'remove' | 'custom';
}

async function progressiveFilter(
  text: string,
  options: ProgressiveFilterOptions = {}
): Promise<{ filtered: boolean; filteredText: string; actions: string[] }> {
  const actions: string[] = [];
  let filteredText = text;
  let result = await muzzle.filterText(text);
  
  if (!result.matched) {
    return { filtered: false, filteredText, actions };
  }
  
  // Default options
  const {
    initialStrategy = 'asterisks',
    customString = '[MODERATED]',
    escalateThreshold = 3,
    finalStrategy = 'remove'
  } = options;
  
  // Count violations
  const violationCount = result.matches?.length || 0;
  
  // Apply initial replacement strategy
  let replacementConfig: ReplacementConfig;
  
  if (violationCount >= escalateThreshold) {
    // Escalate to final strategy
    replacementConfig = {
      enabled: true,
      strategy: finalStrategy,
      customString: finalStrategy === 'custom' ? customString : undefined
    };
    actions.push(`Escalated to ${finalStrategy} strategy (${violationCount} violations)`);
  } else {
    // Use initial strategy
    replacementConfig = {
      enabled: true,
      strategy: initialStrategy,
      customString: initialStrategy === 'custom' ? customString : undefined,
      preserveCase: true
    };
    actions.push(`Applied ${initialStrategy} strategy (${violationCount} violations)`);
  }
  
  filteredText = await muzzle.getFilteredText(text, { replacement: replacementConfig });
  
  return {
    filtered: true,
    filteredText,
    actions
  };
}

// Usage
const progressiveResult = await progressiveFilter('text with multiple violations', {
  initialStrategy: 'asterisks',
  escalateThreshold: 2,
  finalStrategy: 'remove'
});

console.log(progressiveResult.actions); // ['Escalated to remove strategy (3 violations)']
console.log(progressiveResult.filteredText); // 'text with  '
```

## 🚀 Next Steps

1. **Integration with Existing Systems**:
   - Integrate text replacement into your existing content moderation workflows
   - Add hooks for post-processing and additional validation

2. **Machine Learning Integration**:
   - Combine with ML models for more sophisticated content analysis
   - Implement adaptive replacement strategies based on context

3. **Performance Optimization**:
   - Implement caching for replacement results
   - Optimize for batch processing of multiple texts

4. **User Experience Enhancements**:
   - Add explanations for why content was replaced
   - Implement appeal mechanisms for users to challenge replacements

5. **Advanced Configuration**:
   - Support for regular expressions in replacement patterns
   - Configuration profiles for different use cases
   - A/B testing for different replacement strategies

6. **Analytics and Reporting**:
   - Track replacement statistics and trends
   - Monitor user feedback on replacement quality
   - Generate reports on content filtering effectiveness

This example provides a comprehensive implementation of text replacement using Muzzle. You can extend and customize it based on your specific requirements and use cases.