# Muzzle Text Filtering System

![Version](https://img.shields.io/npm/v/@ovendjs/muzzle)
![License](https://img.shields.io/npm/l/@ovendjs/muzzle)
![Types](https://img.shields.io/npm/types/@ovendjs/muzzle)
![Build Status](https://img.shields.io/github/actions/workflow/status/ovendjs/muzzle/ci.yml)

A comprehensive, extensible text filtering system for Node.js applications, designed to detect and filter inappropriate content with extensive customization options.

## Quick Start

### Installation

```bash
npm install @ovendjs/muzzle
```

### Basic Usage

```typescript
import { Muzzle } from '@ovendjs/muzzle';

// Initialize with default configuration
const muzzle = new Muzzle();

// Check text for inappropriate content
const result = await muzzle.filterText('This is some sample text to check');
console.log(result);
```

### Project Structure

```
/src                  → Source code
/tests                → Test files
/README.md            → Project documentation
/CODE_STANDARDS.md    → Code standards
/docs                 → Documentation
/changes              → Changelog entries
```

## Features

- **Multiple Banned Words Sources**: Support for various input methods
- **Parameterized Word Definitions**: Enhanced word definitions with metadata
- **Advanced Text Matching**: Custom word lists, regex, case sensitivity options
- **Flexible Configuration**: Extensible matching strategies
- **Performance Optimized**: Caching, asynchronous processing, batch operations

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/ovenjs/Muzzle.git
cd Muzzle
npm install
npm run build
npm test
```

## Documentation

For detailed documentation, examples, and API reference, visit our [Documentation](https://ovendjs.github.io/Muzzle/).

## License

MIT License - see [LICENSE](LICENSE) file for details.
