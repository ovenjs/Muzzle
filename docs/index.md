---
layout: home
title: Muzzle Text Filtering System
---

Muzzle is a comprehensive, flexible, and powerful text filtering library for Node.js applications. It provides an easy-to-use interface for filtering inappropriate content with support for multiple banned words sources, parameterized word definitions, and advanced matching strategies.

## 🚀 Quick Start

```bash
npm install @ovendjs/muzzle
```

```typescript
import { Muzzle } from '@ovendjs/muzzle';

// Initialize with default configuration
const muzzle = new Muzzle();

// Filter text
const result = await muzzle.filterText('This is some text to filter');
console.log(result.matched); // boolean
console.log(result.matches); // array of matches
```

## 🎯 Why Choose Muzzle?

Muzzle stands out from other text filtering solutions due to its:

1. **🔀 Flexibility**: Support for multiple banned words sources means you can easily switch between different input methods without code changes
2. **⚡ Performance**: Built-in caching and efficient algorithms ensure fast filtering even with large word lists
3. **🛡️ Reliability**: Comprehensive error handling and fallback mechanisms ensure your application remains stable
4. **🔧 Extensibility**: Plugin-based architecture allows for custom providers and matching strategies
5. **📋 Standards Compliance**: Follows industry best practices for content filtering and moderation
6. **🏷️ Parameterized Words**: Unique feature allowing words to have associated parameters (severity, type, etc.) for sophisticated filtering logic

## 🏗️ Architecture Overview

Muzzle is built with a modular architecture that separates concerns and allows for easy extension:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │    │   Web Servers   │    │   Mobile Apps   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Muzzle      │
                    │     Core        │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Word List       │    │ Text Filtering  │    │ Parameter       │
│ Providers       │    │ Strategies      │    │ Handling        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📝 Use Cases

Muzzle is perfect for:

- **📱 Social Media Platforms**: Filter user-generated content in real-time
- **💬 Chat Applications**: Moderate chat messages to maintain community standards
- **💭 Comment Systems**: Ensure comments remain appropriate and respectful
- **📰 Content Management Systems**: Automatically flag or moderate submitted content
- **🛒 E-commerce Platforms**: Filter product reviews and user feedback
- **🎓 Educational Platforms**: Maintain appropriate language in learning environments
- **🎮 Gaming Platforms**: Moderate in-game chat and user interactions

## 🧩 Parameterized Words

One of Muzzle's most powerful features is support for parameterized words, which allows you to:

- Assign severity levels to different types of inappropriate content
- Categorize words by type (profanity, hate speech, violence, etc.)
- Create custom filtering rules based on word parameters
- Implement sophisticated content moderation logic

```typescript
// Example of parameterized words
const config = {
  textFiltering: {
    bannedWordsSource: {
      type: 'string',
      string: 'badword[type=profanity][severity=5],hate[type=hate][severity=9]'
    }
  }
};
```

## 📚 Documentation

- **[Getting Started](getting-started.md)** - Learn the basics and get up and running quickly
- **[API Reference](api-reference.md)** - Detailed documentation of all classes, methods, and interfaces
- **[Configuration Guide](configuration.md)** - Advanced configuration options and best practices
- **[Examples](examples/)** - Practical examples for various use cases and integrations

## 🤝 Contributing

We welcome contributions from the community! Please see our contributing guidelines in the main repository for information on how to get involved.