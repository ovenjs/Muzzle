/**
 * Integration tests for Muzzle with replacement functionality
 *
 * This test suite covers the integration between the Muzzle class and
 * the replacement system to ensure end-to-end functionality works correctly.
 */

import { Muzzle } from '../../src/core/muzzle';
import { ReplacementConfig } from '../../src/types';

describe('Muzzle Integration with Replacement', () => {
  let muzzle: Muzzle;

  beforeEach(async () => {
    muzzle = new Muzzle({
      config: {
        textFiltering: {
          bannedWordsSource: {
            type: 'array',
            array: ['bad', 'horrible', 'terrible'],
          },
        },
      },
    });
    await muzzle.initialize();
  });

  afterEach(() => {
    muzzle.dispose();
  });

  describe('filterText with replacement', () => {
    it('should apply asterisk replacement when configured', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterText('This is bad text', {
        caseSensitive: false,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBe('***');
    });

    it('should apply custom string replacement when configured', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[CENSORED]',
      };

      const result = await muzzle.filterText('This is bad text', {
        caseSensitive: false,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBe('[CENSORED]');
    });

    it('should apply removal replacement when configured', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const result = await muzzle.filterText('This is bad text', {
        caseSensitive: false,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBe('');
    });

    it('should not apply replacement when disabled', async () => {
      const config: ReplacementConfig = {
        enabled: false,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterText('This is bad text', {
        caseSensitive: false,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBeUndefined();
    });

    it('should handle multiple matches with replacement', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterText('This is bad and horrible text', {
        caseSensitive: false,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBe('***');
      expect(result.matches[1]?.word).toBe('horrible');
      expect(result.matches[1]?.replacement).toBe('********');
    });

    it('should preserve case in replacement when configured', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        preserveCase: true,
      };

      const result = await muzzle.filterText('This is BAD text', {
        caseSensitive: false,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('BAD');
      expect(result.matches[0]?.replacement).toBe('***');
    });
  });

  describe('getFilteredText', () => {
    it('should return text with replacements applied', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const filteredText = await muzzle.getFilteredText('This is bad text', {
        caseSensitive: false,
      });

      expect(filteredText).toBe('This is *** text');
    });

    it('should return original text when replacement is disabled', async () => {
      const config: ReplacementConfig = {
        enabled: false,
        strategy: 'asterisks',
      };

      const filteredText = await muzzle.getFilteredText('This is bad text', {
        caseSensitive: false,
      });

      expect(filteredText).toBe('This is bad text');
    });

    it('should handle custom string replacement', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[REMOVED]',
      };

      const filteredText = await muzzle.getFilteredText('This is bad text', {
        caseSensitive: false,
      });

      expect(filteredText).toBe('This is [REMOVED] text');
    });

    it('should handle removal replacement', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const filteredText = await muzzle.getFilteredText('This is bad text', {
        caseSensitive: false,
      });

      expect(filteredText).toBe('This is  text');
    });
  });

  describe('filterContent with replacement', () => {
    it('should include replacement information in filter result', async () => {
      const result = await muzzle.filterContent('This is bad text', {
        text: {
          caseSensitive: false,
        },
        replacement: {
          enabled: true,
          strategy: 'asterisks',
        },
      });

      expect(result.passed).toBe(false);
      expect(result.text?.matched).toBe(true);
      expect(result.text?.matches).toHaveLength(1);
      expect(result.text?.matches[0]?.word).toBe('bad');
      expect(result.text?.matches[0]?.replacement).toBe('***');
    });

    it('should work without replacement when not configured', async () => {
      const result = await muzzle.filterContent('This is bad text');

      expect(result.passed).toBe(false);
      expect(result.text?.matched).toBe(true);
      expect(result.text?.matches).toHaveLength(1);
      expect(result.text?.matches[0]?.word).toBe('bad');
      expect(result.text?.matches[0]?.replacement).toBeUndefined();
    });
  });

  describe('configuration', () => {
    it('should use global replacement configuration', async () => {
      muzzle = new Muzzle({
        config: {
          textFiltering: {
            bannedWordsSource: {
              type: 'array',
              array: ['bad'],
            },
          },
          replacement: {
            enabled: true,
            strategy: 'asterisks',
          },
        },
      });
      await muzzle.initialize();

      const result = await muzzle.filterText('This is bad text');

      expect(result.matched).toBe(true);
      expect(result.matches[0]?.replacement).toBe('***');

      muzzle.dispose();
    });

    it('should override global configuration with per-request options', async () => {
      muzzle = new Muzzle({
        config: {
          textFiltering: {
            bannedWordsSource: {
              type: 'array',
              array: ['bad'],
            },
          },
          replacement: {
            enabled: true,
            strategy: 'asterisks',
          },
        },
      });
      await muzzle.initialize();

      const result = await muzzle.filterText('This is bad text', {
        caseSensitive: false,
        replacement: {
          enabled: true,
          strategy: 'custom',
          customString: '[HIDDEN]',
        },
      });

      expect(result.matched).toBe(true);
      expect(result.matches[0]?.replacement).toBe('[HIDDEN]');

      muzzle.dispose();
    });
  });
});