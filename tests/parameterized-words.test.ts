/**
 * Tests for parameterized word functionality
 */

import { WordParser } from '../src/modules/word-parser';
import { StringWordListProvider } from '../src/modules/providers/string-word-list-provider';
import { ArrayWordListProvider } from '../src/modules/providers/array-word-list-provider';
import { Muzzle } from '../src/core/muzzle';
import { MuzzleConfig, ParameterizedWord } from '../src/types';

describe('Parameterized Words', () => {
  describe('WordParser', () => {
    test('should parse simple parameterized words', () => {
      const input = 'badword[type=slur],ahh[type=profanity]';
      const result = WordParser.parseParameterizedWords(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('slur');
      expect(result[1]?.word).toBe('ahh');
      expect(result[1]?.parameters.type).toBe('profanity');
    });

    test('should parse words with multiple parameters', () => {
      const input = 'badword[type=slur][severity=high],ahh[type=profanity][severity=medium]';
      const result = WordParser.parseParameterizedWords(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('slur');
      expect(result[0]?.parameters.severity).toBe('high');
      expect(result[1]?.word).toBe('ahh');
      expect(result[1]?.parameters.type).toBe('profanity');
      expect(result[1]?.parameters.severity).toBe('medium');
    });

    test('should parse numeric parameters', () => {
      const input = 'badword[type=slur][severity=8]';
      const result = WordParser.parseParameterizedWords(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('slur');
      expect(result[0]?.parameters.severity).toBe(8);
    });

    test('should parse boolean parameters', () => {
      const input = 'badword[type=slur][blocked=true],ahh[type=profanity][blocked=false]';
      const result = WordParser.parseParameterizedWords(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('slur');
      expect(result[0]?.parameters.blocked).toBe(true);
      expect(result[1]?.word).toBe('ahh');
      expect(result[1]?.parameters.type).toBe('profanity');
      expect(result[1]?.parameters.blocked).toBe(false);
    });

    test('should handle non-parameterized words', () => {
      const input = 'badword,ahh,profanity';
      const result = WordParser.parseParameterizedWords(input);
      
      expect(result).toHaveLength(3);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('unknown');
      expect(result[1]?.word).toBe('ahh');
      expect(result[1]?.parameters.type).toBe('unknown');
      expect(result[2]?.word).toBe('profanity');
      expect(result[2]?.parameters.type).toBe('unknown');
    });

    test('should handle mixed parameterized and non-parameterized words', () => {
      const input = 'badword[type=slur],ahh,profanity[type=profanity]';
      const result = WordParser.parseParameterizedWords(input);
      
      expect(result).toHaveLength(3);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('slur');
      expect(result[1]?.word).toBe('ahh');
      expect(result[1]?.parameters.type).toBe('unknown');
      expect(result[2]?.word).toBe('profanity');
      expect(result[2]?.parameters.type).toBe('profanity');
    });

    test('should handle empty input', () => {
      const result = WordParser.parseParameterizedWords('');
      expect(result).toHaveLength(0);
    });

    test('should handle malformed input gracefully', () => {
      const input = 'badword[type=slur],ahh[type,profanity[type=profanity]';
      const result = WordParser.parseParameterizedWords(input);
      
      // Should skip malformed entries but process valid ones
      expect(result).toHaveLength(3);
      expect(result[0]?.word).toBe('badword');
      expect(result[0]?.parameters.type).toBe('slur');
      expect(result[1]?.word).toBe('ahh');
      expect(result[1]?.parameters.type).toBe('unknown');
      expect(result[2]?.word).toBe('profanity');
      expect(result[2]?.parameters.type).toBe('profanity');
    });

    test('should convert parameterized word to string', () => {
      const paramWord: ParameterizedWord = {
        word: 'badword',
        parameters: {
          type: 'slur',
          severity: 8,
          blocked: true
        }
      };
      
      const result = WordParser.parameterizedWordToString(paramWord);
      expect(result).toBe('badword[type="slur"][severity=8][blocked=true]');
    });

    test('should convert parameterized words to comma-separated string', () => {
      const paramWords: ParameterizedWord[] = [
        {
          word: 'badword',
          parameters: { type: 'slur' }
        },
        {
          word: 'ahh',
          parameters: { type: 'profanity' }
        }
      ];
      
      const result = WordParser.parameterizedWordsToString(paramWords);
      expect(result).toBe('badword[type="slur"],ahh[type="profanity"]');
    });

    test('should create parameterized word with default type', () => {
      const result = WordParser.createParameterizedWord('badword');
      expect(result.word).toBe('badword');
      expect(result.parameters.type).toBe('unknown');
    });

    test('should create parameterized word with custom type', () => {
      const result = WordParser.createParameterizedWord('badword', 'slur');
      expect(result.word).toBe('badword');
      expect(result.parameters.type).toBe('slur');
    });

    test('should create parameterized word with additional parameters', () => {
      const result = WordParser.createParameterizedWord('badword', 'slur', { severity: 8 });
      expect(result.word).toBe('badword');
      expect(result.parameters.type).toBe('slur');
      expect(result.parameters.severity).toBe(8);
    });
  });

  describe('StringWordListProvider with Parameterized Words', () => {
    let provider: StringWordListProvider;

    beforeEach(() => {
      provider = new StringWordListProvider({
        type: 'string',
        string: 'badword[type=slur],ahh[type=profanity]'
      });
    });

    test('should initialize with parameterized words', async () => {
      await provider.initialize({
        type: 'string',
        string: 'badword[type=slur],ahh[type=profanity]'
      });

      expect(provider.isReady()).toBe(true);
      
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'ahh']);
      
      const parameterizedWords = await provider.getParameterizedWords();
      expect(parameterizedWords).toHaveLength(2);
      expect(parameterizedWords[0]?.word).toBe('badword');
      expect(parameterizedWords[0]?.parameters.type).toBe('slur');
      expect(parameterizedWords[1]?.word).toBe('ahh');
      expect(parameterizedWords[1]?.parameters.type).toBe('profanity');
    });

    test('should handle mixed parameterized and non-parameterized words', async () => {
      await provider.initialize({
        type: 'string',
        string: 'badword[type=slur],ahh,profanity[type=profanity]'
      });

      const parameterizedWords = await provider.getParameterizedWords();
      expect(parameterizedWords).toHaveLength(3);
      expect(parameterizedWords[0]?.word).toBe('badword');
      expect(parameterizedWords[0]?.parameters.type).toBe('slur');
      expect(parameterizedWords[1]?.word).toBe('ahh');
      expect(parameterizedWords[1]?.parameters.type).toBe('unknown');
      expect(parameterizedWords[2]?.word).toBe('profanity');
      expect(parameterizedWords[2]?.parameters.type).toBe('profanity');
    });
  });

  describe('ArrayWordListProvider with Parameterized Words', () => {
    let provider: ArrayWordListProvider;

    test('should initialize with parameterized word strings', async () => {
      provider = new ArrayWordListProvider({
        type: 'array',
        array: ['badword[type=slur]', 'ahh[type=profanity]']
      });

      await provider.initialize({
        type: 'array',
        array: ['badword[type=slur]', 'ahh[type=profanity]']
      });

      expect(provider.isReady()).toBe(true);
      
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'ahh']);
      
      const parameterizedWords = await provider.getParameterizedWords();
      expect(parameterizedWords).toHaveLength(2);
      expect(parameterizedWords[0]?.word).toBe('badword');
      expect(parameterizedWords[0]?.parameters.type).toBe('slur');
      expect(parameterizedWords[1]?.word).toBe('ahh');
      expect(parameterizedWords[1]?.parameters.type).toBe('profanity');
    });

    test('should initialize with parameterized word objects', async () => {
      const paramWords: ParameterizedWord[] = [
        {
          word: 'badword',
          parameters: { type: 'slur' }
        },
        {
          word: 'ahh',
          parameters: { type: 'profanity' }
        }
      ];

      provider = new ArrayWordListProvider({
        type: 'array',
        array: paramWords as any
      });

      await provider.initialize({
        type: 'array',
        array: paramWords as any
      });

      const parameterizedWords = await provider.getParameterizedWords();
      expect(parameterizedWords).toHaveLength(2);
      expect(parameterizedWords[0]?.word).toBe('badword');
      expect(parameterizedWords[0]?.parameters.type).toBe('slur');
      expect(parameterizedWords[1]?.word).toBe('ahh');
      expect(parameterizedWords[1]?.parameters.type).toBe('profanity');
    });

    test('should handle mixed parameterized and non-parameterized words', async () => {
      provider = new ArrayWordListProvider({
        type: 'array',
        array: ['badword[type=slur]', 'ahh', 'profanity[type=profanity]']
      });

      await provider.initialize({
        type: 'array',
        array: ['badword[type=slur]', 'ahh', 'profanity[type=profanity]']
      });

      const parameterizedWords = await provider.getParameterizedWords();
      expect(parameterizedWords).toHaveLength(3);
      expect(parameterizedWords[0]?.word).toBe('badword');
      expect(parameterizedWords[0]?.parameters.type).toBe('slur');
      expect(parameterizedWords[1]?.word).toBe('ahh');
      expect(parameterizedWords[1]?.parameters.type).toBe('unknown');
      expect(parameterizedWords[2]?.word).toBe('profanity');
      expect(parameterizedWords[2]?.parameters.type).toBe('profanity');
    });
  });

  describe('Muzzle with Parameterized Words', () => {
    let muzzle: Muzzle;

    beforeEach(() => {
      muzzle = new Muzzle();
    });

    afterEach(() => {
      muzzle.dispose();
    });

    test('should filter text with parameterized words and include parameters in results', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword[type=slur][severity=8],ahh[type=profanity][severity=3]'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains a badword and ahh');
      
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(2);
      
      // Check first match (badword)
      expect(result.matches[0]?.word).toBe('badword');
      expect(result.matches[0]?.parameters).toBeDefined();
      expect(result.matches[0]?.parameters?.type).toBe('slur');
      expect(result.matches[0]?.parameters?.severity).toBe(8);
      expect(result.matches[0]?.severity).toBe(8); // Check calculated severity
      
      // Check second match (ahh)
      expect(result.matches[1]?.word).toBe('ahh');
      expect(result.matches[1]?.parameters).toBeDefined();
      expect(result.matches[1]?.parameters?.type).toBe('profanity');
      expect(result.matches[1]?.parameters?.severity).toBe(3);
      expect(result.matches[1]?.severity).toBe(5); // Check calculated severity (profanity defaults to 5)
    });

    test('should handle mixed parameterized and non-parameterized words', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword[type=slur],ahh,profanity[type=profanity]'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains badword, ahh, and profanity');
      
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(3);
      
      // Check parameterized word (badword)
      expect(result.matches[0]?.word).toBe('badword');
      expect(result.matches[0]?.parameters?.type).toBe('slur');
      
      // Check non-parameterized word (ahh)
      expect(result.matches[1]?.word).toBe('ahh');
      expect(result.matches[1]?.parameters?.type).toBe('unknown');
      
      // Check parameterized word (profanity)
      expect(result.matches[2]?.word).toBe('profanity');
      expect(result.matches[2]?.parameters?.type).toBe('profanity');
    });

    test('should calculate severity based on word type', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'word1[type=slur],word2[type=profanity],word3[type=hate]'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains word1, word2, and word3');
      
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(3);
      
      // Check severity based on type
      expect(result.matches[0]?.severity).toBe(8); // slur
      expect(result.matches[1]?.severity).toBe(5); // profanity
      expect(result.matches[2]?.severity).toBe(9); // hate
    });

    test('should maintain backward compatibility with non-parameterized words', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity,swear'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains badword and profanity');
      
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(2);
      
      // Check that parameters are present with default type
      expect(result.matches[0]?.word).toBe('badword');
      expect(result.matches[0]?.parameters).toBeDefined();
      expect(result.matches[0]?.parameters?.type).toBe('unknown');
      
      expect(result.matches[1]?.word).toBe('profanity');
      expect(result.matches[1]?.parameters).toBeDefined();
      expect(result.matches[1]?.parameters?.type).toBe('unknown');
    });
  });
});