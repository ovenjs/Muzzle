---
layout: home
title: Muzzle Text Filtering System
---

# Muzzle Text Filtering System

Muzzle is a comprehensive, flexible, and powerful text filtering library for Node.js applications. It provides an easy-to-use interface for filtering inappropriate content with support for multiple banned words sources and advanced matching strategies.

## Features

- **Multiple Banned Words Sources**: Support for comma-separated strings, arrays, local files, URLs, and a default GitHub profanity words list
- **Flexible Configuration**: Highly customizable filtering options including case sensitivity, whole word matching, and regex support
- **Performance Optimized**: Efficient caching mechanisms and batch processing capabilities
- **TypeScript Support**: Full TypeScript support with strict type checking
- **Comprehensive Testing**: Extensive test coverage with Jest
- **Easy Integration**: Simple API that integrates seamlessly with any Node.js application

## Quick Start

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

## Why Choose Muzzle?

Muzzle stands out from other text filtering solutions due to its:

1. **Flexibility**: Support for multiple banned words sources means you can easily switch between different input methods without code changes
2. **Performance**: Built-in caching and efficient algorithms ensure fast filtering even with large word lists
3. **Reliability**: Comprehensive error handling and fallback mechanisms ensure your application remains stable
4. **Extensibility**: Plugin-based architecture allows for custom providers and matching strategies
5. **Standards Compliance**: Follows industry best practices for content filtering and moderation

## Use Cases

Muzzle is perfect for:

- **Social Media Platforms**: Filter user-generated content in real-time
- **Chat Applications**: Moderate chat messages to maintain community standards
- **Comment Systems**: Ensure comments remain appropriate and respectful
- **Content Management Systems**: Automatically flag or moderate submitted content
- **E-commerce Platforms**: Filter product reviews and user feedback
- **Educational Platforms**: Maintain appropriate language in learning environments

## Getting Started

Check out our [Getting Started](getting-started.md) guide to learn how to integrate Muzzle into your application, or explore the [API Reference](api-reference.md) for detailed documentation of all available methods and options.

## Contributing

We welcome contributions from the community! Please see our contributing guidelines in the main repository for information on how to get involved.

## License

Muzzle is licensed under the MIT License. See the [LICENSE](../LICENSE) file for more information.