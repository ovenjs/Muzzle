/**
 * Tests for Muzzle class replacement functionality
 *
 * This test suite covers the integration of replacement functionality
 * with the main Muzzle class, ensuring end-to-end replacement works correctly.
 */

import { Muzzle } from '../../src/core/muzzle';
import { ReplacementConfig } from '../../src/types';

describe('Muzzle Replacement Integration', () => {
  let muzzle: Muzzle;

  beforeEach(async () => {
    muzzle = new Muzzle({
      config: {
        textFiltering: {
          bannedWordsSource: {
            type: 'array',
            array: ['bad', 'worse', 'terrible'],
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

      const result = await muzzle.filterText('This is bad and worse text', {
        replacement: config,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBe('***');
      expect(result.matches[1]?.word).toBe('worse');
      expect(result.matches[1]?.replacement).toBe('*****');
    });

    it('should apply custom string replacement when configured', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[CENSORED]',
      };

      const result = await muzzle.filterText('This is bad text', {
        replacement: config,
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
        replacement: config,
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
        replacement: config,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBeUndefined();
    });

    it('should handle text with no matches', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterText('This is clean text', {
        replacement: config,
      });

      expect(result.matched).toBe(false);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('getFilteredText', () => {
    it('should return modified text with asterisk replacement', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const filteredText = await muzzle.getFilteredText(
        'This is bad and worse text',
        { replacement: config }
      );

      expect(filteredText).toBe('This is *** and ***** text');
    });

    it('should return modified text with custom replacement', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[REDACTED]',
      };

      const filteredText = await muzzle.getFilteredText(
        'This is bad text',
        { replacement: config }
      );

      expect(filteredText).toBe('This is [REDACTED] text');
    });

    it('should return modified text with removal replacement', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const filteredText = await muzzle.getFilteredText(
        'This is bad text',
        { replacement: config }
      );

      expect(filteredText).toBe('This is  text');
    });

    it('should return original text when replacement disabled', async () => {
      const config: ReplacementConfig = {
        enabled: false,
        strategy: 'asterisks',
      };

      const filteredText = await muzzle.getFilteredText(
        'This is bad text',
        { replacement: config }
      );

      expect(filteredText).toBe('This is bad text');
    });

    it('should return original text when no matches', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const filteredText = await muzzle.getFilteredText(
        'This is clean text',
        { replacement: config }
      );

      expect(filteredText).toBe('This is clean text');
    });
  });

  describe('filterContent with replacement', () => {
    it('should include replacement information in filter result', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterContent('This is bad text', {
        replacement: config,
      });

      expect(result.passed).toBe(false);
      expect(result.text?.matched).toBe(true);
      expect(result.text?.matches).toHaveLength(1);
      expect(result.text?.matches[0]?.word).toBe('bad');
      expect(result.text?.matches[0]?.replacement).toBe('***');
    });

    it('should handle clean text correctly', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterContent('This is clean text', {
        replacement: config,
      });

      expect(result.passed).toBe(true);
      expect(result.text?.matched).toBe(false);
      expect(result.text?.matches).toHaveLength(0);
    });
  });

  describe('Global replacement configuration', () => {
    it('should use global replacement configuration', async () => {
      const muzzleWithConfig = new Muzzle({
        config: {
          textFiltering: {
            bannedWordsSource: {
              type: 'array',
              array: ['bad', 'worse'],
            },
          },
          replacement: {
            enabled: true,
            strategy: 'asterisks',
          },
        },
      });

      await muzzleWithConfig.initialize();

      try {
        const result = await muzzleWithConfig.filterText('This is bad text');
        expect(result.matched).toBe(true);
        expect(result.matches[0]?.replacement).toBe('***');
      } finally {
        muzzleWithConfig.dispose();
      }
    });

    it('should override global configuration with per-request config', async () => {
      const muzzleWithConfig = new Muzzle({
        config: {
          textFiltering: {
            bannedWordsSource: {
              type: 'array',
              array: ['bad', 'worse'],
            },
          },
          replacement: {
            enabled: true,
            strategy: 'asterisks',
          },
        },
      });

      await muzzleWithConfig.initialize();

      try {
        const result = await muzzleWithConfig.filterText('This is bad text', {
          replacement: {
            enabled: true,
            strategy: 'custom',
            customString: '[CENSORED]',
          },
        });

        expect(result.matched).toBe(true);
        expect(result.matches[0]?.replacement).toBe('[CENSORED]');
      } finally {
        muzzleWithConfig.dispose();
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple matches with same word', async () => {
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = await muzzle.filterText('bad bad bad', {
        replacement: config,
      });

      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(3);
      expect(result.matches[0]?.word).toBe('bad');
      expect(result.matches[0]?.replacement).toBe('***');
      expect(result.matches[1]?.word).toBe('bad');
      expect(result.matches[1]?.replacement).toBe('***');
      expect(result.matches[2]?.word).toBe('bad');
      expect(result.matches[2]?.replacement).toBe('***');
    });

    it('should handle overlapping matches', async () => {
      // Create muzzle with words that could overlap
      const muzzleWithOverlap = new Muzzle({
        config: {
          textFiltering: {
            bannedWordsSource: {
              type: 'array',
              array: ['bad', 'badword'],
            },
          },
        },
      });

      await muzzleWithOverlap.initialize();

      try {
        const config: ReplacementConfig = {
          enabled: true,
          strategy: 'asterisks',
        };

        const result = await muzzleWithOverlap.filterText('This is badword', {
          replacement: config,
        });

        expect(result.matched).toBe(true);
        expect(result.matches.length).toBeGreaterThan(0);
      } finally {
        muzzleWithOverlap.dispose();
      }
    });
  });
});