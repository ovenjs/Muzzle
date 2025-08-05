/**
 * Tests for word list providers
 */

import { StringWordListProvider } from '../src/modules/providers/string-word-list-provider';
import { ArrayWordListProvider } from '../src/modules/providers/array-word-list-provider';
import { FileWordListProvider } from '../src/modules/providers/file-word-list-provider';
import { DynamicWordListProvider } from '../src/modules/providers/dynamic-word-list-provider';
import { DefaultWordListProvider } from '../src/modules/providers/default-word-list-provider';
import { BannedWordsSource } from '../src/types';

// Mock fetch for URL-based providers
global.fetch = jest.fn();
// Mock fs for file-based providers
const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn()
};

jest.mock('fs', () => mockFs);

describe('Word List Providers', () => {
  describe('StringWordListProvider', () => {
    let provider: StringWordListProvider;

    beforeEach(() => {
      provider = new StringWordListProvider({
        type: 'string',
        string: 'badword,profanity,swear'
      });
    });

    test('should initialize with comma-separated string', async () => {
      await provider.initialize({
        type: 'string',
        string: 'badword,profanity,swear'
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should handle empty string', async () => {
      await provider.initialize({
        type: 'string',
        string: ''
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual([]);
    });

    test('should handle string with extra spaces', async () => {
      await provider.initialize({
        type: 'string',
        string: ' badword , profanity , swear '
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should throw error when string is missing', async () => {
      await expect(provider.initialize({
        type: 'string'
      } as any)).rejects.toThrow('String word list provider requires a string value');
    });

    test('should dispose properly', () => {
      provider.dispose();
      expect(provider.isReady()).toBe(false);
    });
  });

  describe('ArrayWordListProvider', () => {
    let provider: ArrayWordListProvider;

    beforeEach(() => {
      provider = new ArrayWordListProvider({
        type: 'array',
        array: ['badword', 'profanity', 'swear']
      });
    });

    test('should initialize with array', async () => {
      await provider.initialize({
        type: 'array',
        array: ['badword', 'profanity', 'swear']
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should handle empty array', async () => {
      await provider.initialize({
        type: 'array',
        array: []
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual([]);
    });

    test('should throw error when array is missing', async () => {
      await expect(provider.initialize({
        type: 'array'
      } as any)).rejects.toThrow('Array word list provider requires an array value');
    });

    test('should dispose properly', () => {
      provider.dispose();
      expect(provider.isReady()).toBe(false);
    });
  });

  describe('FileWordListProvider', () => {
    let provider: FileWordListProvider;

    beforeEach(() => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('badword\nprofanity\nswear');
      provider = new FileWordListProvider({
        type: 'file',
        filePath: '/path/to/words.txt'
      });
    });

    test('should initialize with file path', async () => {
      await provider.initialize({
        type: 'file',
        filePath: '/path/to/words.txt'
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/words.txt');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/words.txt', 'utf8');
    });

    test('should handle text format', async () => {
      mockFs.readFileSync.mockReturnValue('badword profanity swear');
      
      await provider.initialize({
        type: 'file',
        filePath: '/path/to/words.txt',
        format: 'text'
      });

      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should handle CSV format', async () => {
      mockFs.readFileSync.mockReturnValue('badword\nprofanity\nswear');
      
      await provider.initialize({
        type: 'file',
        filePath: '/path/to/words.txt',
        format: 'csv'
      });

      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should handle JSON format', async () => {
      mockFs.readFileSync.mockReturnValue('["badword", "profanity", "swear"]');
      
      await provider.initialize({
        type: 'file',
        filePath: '/path/to/words.txt',
        format: 'json'
      });

      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should throw error when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await expect(provider.initialize({
        type: 'file',
        filePath: '/path/to/nonexistent.txt'
      })).rejects.toThrow('Word list file not found');
    });

    test('should throw error when file path is missing', async () => {
      await expect(provider.initialize({
        type: 'file'
      } as any)).rejects.toThrow('File word list provider requires a file path');
    });

    test('should throw error for invalid JSON', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      await expect(provider.initialize({
        type: 'file',
        filePath: '/path/to/invalid.json',
        format: 'json'
      })).rejects.toThrow('Invalid JSON format');
    });

    test('should dispose properly', () => {
      provider.dispose();
      expect(provider.isReady()).toBe(false);
    });
  });

  describe('DynamicWordListProvider', () => {
    let provider: DynamicWordListProvider;

    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
      provider = new DynamicWordListProvider({
        type: 'url',
        url: 'https://example.com/words.txt'
      });
    });

    test('should initialize with URL', async () => {
      const mockWords = 'badword\nprofanity\nswear';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockWords)
      });

      await provider.initialize({
        type: 'url',
        url: 'https://example.com/words.txt'
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
      expect(fetch).toHaveBeenCalledWith('https://example.com/words.txt', {
        headers: { 'Accept': 'text/plain' },
        signal: expect.any(AbortSignal)
      });
    });

    test('should handle text format', async () => {
      const mockWords = 'badword profanity swear';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockWords)
      });

      await provider.initialize({
        type: 'url',
        url: 'https://example.com/words.txt',
        format: 'text'
      });

      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should handle CSV format', async () => {
      const mockWords = 'badword,profanity,swear';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockWords)
      });

      await provider.initialize({
        type: 'url',
        url: 'https://example.com/words.csv',
        format: 'csv'
      });

      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should handle JSON format', async () => {
      const mockWords = '["badword", "profanity", "swear"]';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockWords)
      });

      await provider.initialize({
        type: 'url',
        url: 'https://example.com/words.json',
        format: 'json'
      });

      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
    });

    test('should throw error when URL is missing', async () => {
      await expect(provider.initialize({
        type: 'url'
      } as any)).rejects.toThrow('Dynamic word list provider requires a URL');
    });

    test('should handle fetch errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.initialize({
        type: 'url',
        url: 'https://example.com/words.txt'
      })).rejects.toThrow('Failed to fetch word list from https://example.com/words.txt');
    });

    test('should handle HTTP errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(provider.initialize({
        type: 'url',
        url: 'https://example.com/words.txt'
      })).rejects.toThrow('HTTP error 404');
    });

    test('should throw error for invalid JSON', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('invalid json')
      });

      await expect(provider.initialize({
        type: 'url',
        url: 'https://example.com/words.json',
        format: 'json'
      })).rejects.toThrow('Invalid JSON format');
    });

    test('should dispose properly', () => {
      provider.dispose();
      expect(provider.isReady()).toBe(false);
    });
  });

  describe('DefaultWordListProvider', () => {
    let provider: DefaultWordListProvider;

    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
      provider = new DefaultWordListProvider({
        type: 'default'
      });
    });

    test('should initialize with default URL', async () => {
      const mockWords = 'badword\nprofanity\nswear';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockWords)
      });

      await provider.initialize({
        type: 'default'
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['badword', 'profanity', 'swear']);
      expect(fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt', {
        headers: { 'Accept': 'text/plain' },
        signal: expect.any(AbortSignal)
      });
    });

    test('should use custom URL if provided', async () => {
      const mockWords = 'custom\nwords\nlist';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockWords)
      });

      await provider.initialize({
        type: 'default',
        url: 'https://example.com/custom-words.txt'
      });

      expect(provider.isReady()).toBe(true);
      const words = await provider.getWords();
      expect(words).toEqual(['custom', 'words', 'list']);
      expect(fetch).toHaveBeenCalledWith('https://example.com/custom-words.txt', {
        headers: { 'Accept': 'text/plain' },
        signal: expect.any(AbortSignal)
      });
    });

    test('should handle fetch errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(provider.initialize({
        type: 'default'
      })).rejects.toThrow('Failed to fetch default word list');
    });

    test('should dispose properly', () => {
      provider.dispose();
      expect(provider.isReady()).toBe(false);
    });
  });
});