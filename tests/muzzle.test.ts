/**
 * Tests for the Muzzle text filtering system
 */

import { Muzzle } from '../src/core/muzzle';
import { MuzzleConfig, BannedWordsSource } from '../src/types';

// Mock fetch for URL-based word list providers
global.fetch = jest.fn();

describe('Muzzle', () => {
  let muzzle: Muzzle;

  beforeEach(() => {
    // Mock the default fetch for all tests
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('badword\nprofanity\nswear\ncurse\ndamn')
    });
    
    muzzle = new Muzzle();
    jest.clearAllMocks();
  });

  afterEach(() => {
    muzzle.dispose();
  });

  describe('Basic Text Filtering', () => {
    test('should initialize with default configuration', async () => {
      await muzzle.initialize();
      const status = await muzzle.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.textFilter.ready).toBe(true);
    });

    test('should filter clean text without matches', async () => {
      const result = await muzzle.filterText('This is a clean text');
      expect(result.matched).toBe(false);
      expect(result.matches).toHaveLength(0);
      expect(result.severity).toBe(0);
    });

    test('should filter text with default profanity words', async () => {
      const result = await muzzle.filterText('This contains a bad word');
      // Note: This depends on the default GitHub profanity words list
      expect(result).toHaveProperty('matched');
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('severity');
    });
  });

  describe('String-based Banned Words Source', () => {
    test('should filter text using comma-separated string', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity,swear'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains a badword');
      
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('badword');
    });

    test('should handle empty string', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: ''
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains a badword');
      
      expect(result.matched).toBe(false);
    });

    test('should handle string with extra spaces', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: ' badword , profanity , swear '
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains a badword');
      
      expect(result.matched).toBe(true);
      expect(result.matches[0]?.word).toBe('badword');
    });
  });

  describe('Array-based Banned Words Source', () => {
    test('should filter text using array of words', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'array',
            array: ['badword', 'profanity', 'swear']
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains profanity');
      
      expect(result.matched).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]?.word).toBe('profanity');
    });

    test('should handle empty array', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'array',
            array: []
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains a badword');
      
      expect(result.matched).toBe(false);
    });
  });

  describe('URL-based Banned Words Source', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    test('should fetch and filter text using URL source', async () => {
      const mockWords = 'badword\nprofanity\nswear';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(mockWords)
      });

      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'url',
            url: 'https://example.com/words.txt',
            cache: false
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const result = await muzzle.filterText('This contains profanity');
      
      expect(result.matched).toBe(true);
      expect(result.matches[0]?.word).toBe('profanity');
      expect(fetch).toHaveBeenCalledWith('https://example.com/words.txt', {
        headers: { 'Accept': 'text/plain' },
        signal: expect.any(AbortSignal)
      });
    });

    test('should handle URL fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'url',
            url: 'https://example.com/words.txt',
            cache: false
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      
      // The error should be thrown during initialization
      await expect(muzzle.filterText('This contains profanity')).rejects.toThrow('Failed to fetch word list from https://example.com/words.txt: Network error');
    });

    test('should handle HTTP errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'url',
            url: 'https://example.com/words.txt',
            cache: false
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      
      // The error should be thrown during initialization
      await expect(muzzle.filterText('This contains profanity')).rejects.toThrow('Failed to fetch word list from https://example.com/words.txt: HTTP error 404: Not Found');
    });
  });

  describe('Default Banned Words Source', () => {
    beforeEach(() => {
      (fetch as jest.Mock).mockClear();
    });

    test('should use default GitHub profanity words list', async () => {
      const mockWords = 'badword\nprofanity\nswear\ncurse\ndamn';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(mockWords)
      });

      muzzle = new Muzzle();
      const result = await muzzle.filterText('This contains damn');
      
      expect(result.matched).toBe(true);
      expect(result.matches[0]?.word).toBe('damn');
      expect(fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/coffee-and-fun/google-profanity-words/main/data/en.txt', {
        headers: { 'Accept': 'text/plain' },
        signal: expect.any(AbortSignal)
      });
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple texts in batch', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword,profanity'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      const results = await muzzle.filterBatch([
        { text: 'This is clean' },
        { text: 'This has badword' },
        { text: 'This has profanity' }
      ]);
      
      expect(results).toHaveLength(3);
      expect(results[0]?.passed).toBe(true);  // No banned words
      expect(results[1]?.passed).toBe(false); // Contains badword
      expect(results[2]?.passed).toBe(false); // Contains profanity
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration and reinitialize', async () => {
      const initialConfig: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword'
          }
        }
      };
      
      muzzle = new Muzzle({ config: initialConfig });
      await muzzle.initialize();
      
      const newConfig: Partial<MuzzleConfig> = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'profanity'
          }
        }
      };
      
      await muzzle.updateConfig(newConfig);
      
      const result1 = await muzzle.filterText('This has badword');
      const result2 = await muzzle.filterText('This has profanity');
      
      expect(result1.matched).toBe(false);
      expect(result2.matched).toBe(true);
    });
  });

  describe('Status and Monitoring', () => {
    test('should provide system status', async () => {
      const config: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string',
            string: 'badword'
          }
        }
      };
      
      muzzle = new Muzzle({ config });
      await muzzle.initialize();
      
      const status = await muzzle.getStatus();
      
      expect(status.initialized).toBe(true);
      expect(status.textFilter.ready).toBe(true);
      expect(status.textFilter.wordListSource.wordCount).toBe(1);
      expect(status.textFilter.wordListSource.sourceType).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid configuration gracefully', () => {
      const invalidConfig: MuzzleConfig = {
        textFiltering: {
          bannedWordsSource: {
            type: 'string' as any,
            // Missing required string property
          }
        }
      };
      
      expect(() => {
        new Muzzle({ config: invalidConfig });
      }).toThrow('Invalid configuration');
    });

    test('should handle text filtering errors gracefully', async () => {
      const result = await muzzle.filterText('');
      expect(result.matched).toBe(false);
      expect(result).toHaveProperty('matches');
      expect(result).toHaveProperty('severity');
    });
  });
});