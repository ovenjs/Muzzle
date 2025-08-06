/**
 * Tests for the replacement engine functionality
 *
 * This test suite covers the replacement engine and its various strategies,
 * ensuring that text replacement works correctly with different configurations.
 */

import { ReplacementEngine } from '../../src/modules/replacement/replacement-engine';
import { ReplacementConfig } from '../../src/types';
import { TextMatch } from '../../src/types';
import { ReplacementResult } from '../../src/modules/replacement/replacement-strategy';

describe('ReplacementEngine', () => {
  let replacementEngine: ReplacementEngine;

  beforeEach(() => {
    replacementEngine = new ReplacementEngine();
  });

  describe('applyReplacements', () => {
    it('should not apply replacements when not enabled', () => {
      const originalText = 'This is a bad word';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 10, end: 13 },
          context: 'This is a bad word',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: false,
        strategy: 'asterisks',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe(originalText);
      expect(result.replacementCount).toBe(0);
      expect(result.replacementsMade).toBe(false);
      expect(result.replacedMatches).toEqual([]);
    });

    it('should not apply replacements when no matches provided', () => {
      const originalText = 'This is clean text';
      const matches: TextMatch[] = [];
      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe(originalText);
      expect(result.replacementCount).toBe(0);
      expect(result.replacementsMade).toBe(false);
      expect(result.replacedMatches).toEqual([]);
    });

    it('should apply asterisk replacement correctly', () => {
      const originalText = 'This is a bad word';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 10, end: 13 },
          context: 'This is a bad word',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe('This is a *** word');
      expect(result.replacementCount).toBe(1);
      expect(result.replacementsMade).toBe(true);
      expect(result.replacedMatches).toHaveLength(1);
      expect(result.replacedMatches[0]?.replacement).toBe('***');
    });

    it('should apply custom string replacement correctly', () => {
      const originalText = 'This is a bad word';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 10, end: 13 },
          context: 'This is a bad word',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[REDACTED]',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe('This is a [REDACTED] word');
      expect(result.replacementCount).toBe(1);
      expect(result.replacementsMade).toBe(true);
      expect(result.replacedMatches).toHaveLength(1);
      expect(result.replacedMatches[0]?.replacement).toBe('[REDACTED]');
    });

    it('should apply removal replacement correctly', () => {
      const originalText = 'This is a bad word';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 10, end: 13 },
          context: 'This is a bad word',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe('This is a  word');
      expect(result.replacementCount).toBe(1);
      expect(result.replacementsMade).toBe(true);
      expect(result.replacedMatches).toHaveLength(1);
      expect(result.replacedMatches[0]?.replacement).toBe('');
    });

    it('should handle multiple matches correctly', () => {
      const originalText = 'This is bad and worse text';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 8, end: 11 },
          context: 'This is bad and worse text',
          severity: 5,
          replacement: undefined,
          },
          {
          word: 'worse',
          position: { start: 16, end: 21 },
          context: 'This is bad and worse text',
          severity: 7,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe('This is *** and ****** text');
      expect(result.replacementCount).toBe(2);
      expect(result.replacementsMade).toBe(true);
      expect(result.replacedMatches).toHaveLength(2);
    });

    it('should preserve case when configured', () => {
      const originalText = 'This is BAD WORD';
      const matches: TextMatch[] = [
        {
          word: 'BAD',
          position: { start: 8, end: 11 },
          context: 'This is BAD WORD',
          severity: 5,
          replacement: undefined,
          },
          {
          word: 'WORD',
          position: { start: 12, end: 16 },
          context: 'This is BAD WORD',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        preserveCase: true,
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.originalText).toBe(originalText);
      expect(result.modifiedText).toBe('This is *** ****');
      expect(result.replacementCount).toBe(2);
      expect(result.replacementsMade).toBe(true);
    });

    it('should handle overlapping matches', () => {
      const originalText = 'This is really bad text';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 13, end: 16 },
          context: 'This is really bad text',
          severity: 5,
          replacement: undefined,
          },
          {
          word: 'really',
          position: { start: 8, end: 14 },
          context: 'This is really bad text',
          severity: 3,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      // Should process in order and handle overlaps
      expect(result.replacementCount).toBe(2);
      expect(result.replacementsMade).toBe(true);
    });

    it('should use custom asterisk character', () => {
      const originalText = 'This is a bad word';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 10, end: 13 },
          context: 'This is a bad word',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        asteriskChar: '#',
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.modifiedText).toBe('This is a ### word');
      expect(result.replacedMatches[0]?.replacement).toBe('###');
    });

    it('should use fixed asterisk count', () => {
      const originalText = 'This is a bad word';
      const matches: TextMatch[] = [
        {
          word: 'bad',
          position: { start: 10, end: 13 },
          context: 'This is a bad word',
          severity: 5,
          replacement: undefined,
        },
      ];

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        asteriskCount: 2,
      };

      const result = replacementEngine.applyReplacements(originalText, matches, config);

      expect(result.modifiedText).toBe('This is a ** word');
      expect(result.replacedMatches[0]?.replacement).toBe('**');
    });
  });

  describe('getStrategies', () => {
    it('should return all available strategies', () => {
      const strategies = replacementEngine.getStrategies();
      
      expect(strategies).toHaveLength(3);
      expect(strategies.every(s => typeof s.canHandle === 'function')).toBe(true);
      expect(strategies.every(s => typeof s.generateReplacement === 'function')).toBe(true);
    });
  });
});