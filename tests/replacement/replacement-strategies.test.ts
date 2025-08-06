/**
 * Tests for replacement strategies
 *
 * This test suite covers the individual replacement strategies including
 * asterisk, custom, and removal strategies to ensure they work correctly
 * with various configurations.
 */

import { AsteriskReplacementStrategy } from '../../src/modules/replacement/asterisk-replacement-strategy';
import { CustomReplacementStrategy } from '../../src/modules/replacement/custom-replacement-strategy';
import { RemovalReplacementStrategy } from '../../src/modules/replacement/removal-replacement-strategy';
import { ReplacementConfig } from '../../src/types';
import { TextMatch } from '../../src/types';

describe('Replacement Strategies', () => {
  describe('AsteriskReplacementStrategy', () => {
    let strategy: AsteriskReplacementStrategy;

    beforeEach(() => {
      strategy = new AsteriskReplacementStrategy();
    });

    it('should handle basic asterisk replacement', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('***');
    });

    it('should preserve case when configured', () => {
      const match: TextMatch = {
        word: 'BAD',
        position: { start: 0, end: 3 },
        context: 'This is BAD',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        preserveCase: true,
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('***');
    });

    it('should use custom asterisk character', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        asteriskChar: '#',
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('###');
    });

    it('should use fixed asterisk count', () => {
      const match: TextMatch = {
        word: 'badword',
        position: { start: 0, end: 7 },
        context: 'This is badword',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        asteriskCount: 2,
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('**');
    });

    it('should handle full word replacement', () => {
      const match: TextMatch = {
        word: 'badword',
        position: { start: 0, end: 7 },
        context: 'This is badword',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
        asteriskCount: 'full',
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('*******');
    });

    it('should return original word for invalid configuration', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom', // Wrong strategy
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('bad');
    });

    it('should correctly identify supported configurations', () => {
      const validConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      const invalidConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
      };

      expect(strategy.canHandle(validConfig)).toBe(true);
      expect(strategy.canHandle(invalidConfig)).toBe(false);
    });
  });

  describe('CustomReplacementStrategy', () => {
    let strategy: CustomReplacementStrategy;

    beforeEach(() => {
      strategy = new CustomReplacementStrategy();
    });

    it('should handle basic custom string replacement', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[REDACTED]',
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('[REDACTED]');
    });

    it('should preserve case when configured', () => {
      const match: TextMatch = {
        word: 'BAD',
        position: { start: 0, end: 3 },
        context: 'This is BAD',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[REDACTED]',
        preserveCase: true,
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('[REDACTED]');
    });

    it('should return original word for missing custom string', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        // Missing customString
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('bad');
    });

    it('should correctly identify supported configurations', () => {
      const validConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        customString: '[REDACTED]',
      };

      const invalidConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'custom',
        // Missing customString
      };

      const wrongStrategyConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      expect(strategy.canHandle(validConfig)).toBe(true);
      expect(strategy.canHandle(invalidConfig)).toBe(false);
      expect(strategy.canHandle(wrongStrategyConfig)).toBe(false);
    });
  });

  describe('RemovalReplacementStrategy', () => {
    let strategy: RemovalReplacementStrategy;

    beforeEach(() => {
      strategy = new RemovalReplacementStrategy();
    });

    it('should handle basic removal replacement', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('');
    });

    it('should always return empty string for valid configuration', () => {
      const match: TextMatch = {
        word: 'anyword',
        position: { start: 0, end: 7 },
        context: 'This is anyword',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('');
    });

    it('should return original word for invalid configuration', () => {
      const match: TextMatch = {
        word: 'bad',
        position: { start: 0, end: 3 },
        context: 'This is bad',
        severity: 5,
        replacement: undefined,
      };

      const config: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks', // Wrong strategy
      };

      const result = strategy.generateReplacement(match, config);
      expect(result).toBe('bad');
    });

    it('should correctly identify supported configurations', () => {
      const validConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'remove',
      };

      const invalidConfig: ReplacementConfig = {
        enabled: true,
        strategy: 'asterisks',
      };

      expect(strategy.canHandle(validConfig)).toBe(true);
      expect(strategy.canHandle(invalidConfig)).toBe(false);
    });
  });
});