/**
 * Parser for parameterized word definitions
 */

import { ParameterizedWord, WordParameters } from '../types';

/**
 * Parser for handling parameterized word definitions
 */
export class WordParser {
  /**
   * Parse a string with parameterized word definitions
   *
   * Examples:
   * - "badword[type=slur],ahh[type=profanity]"
   * - "word1[type=slur][severity=high],word2[type=profanity]"
   *
   * @param input String containing parameterized word definitions
   * @returns Array of parsed parameterized words
   */
  static parseParameterizedWords(input: string): ParameterizedWord[] {
    if (!input || typeof input !== 'string') {
      return [];
    }

    const words: ParameterizedWord[] = [];

    // Split by comma to get individual word definitions
    const wordDefinitions = input.split(',').filter(def => def.trim().length > 0);

    for (const definition of wordDefinitions) {
      const trimmedDef = definition.trim();

      try {
        const parameterizedWord = this.parseSingleWordDefinition(trimmedDef);
        if (parameterizedWord) {
          words.push(parameterizedWord);
        }
      } catch (error) {
        console.warn(
          `Failed to parse word definition: "${trimmedDef}". Error: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        // Skip invalid definitions but continue processing others
      }
    }

    return words;
  }

  /**
   * Parse a single word definition with parameters
   *
   * Examples:
   * - "badword[type=slur]"
   * - "word1[type=slur][severity=high]"
   *
   * @param definition Single word definition string
   * @returns Parsed parameterized word or null if invalid
   */
  private static parseSingleWordDefinition(definition: string): ParameterizedWord | null {
    if (!definition || definition.length === 0) {
      return null;
    }

    // Extract the base word (everything before the first '[')
    const firstBracketIndex = definition.indexOf('[');
    let word: string;
    let parametersString = '';

    if (firstBracketIndex === -1) {
      // No parameters, treat as simple word with default type
      word = definition;
      return {
        word,
        parameters: {
          type: 'unknown', // Default type for non-parameterized words
        },
      };
    } else {
      // Extract word and parameters
      word = definition.substring(0, firstBracketIndex).trim();
      parametersString = definition.substring(firstBracketIndex);
    }

    if (!word) {
      return null;
    }

    // Parse parameters
    const parameters = this.parseParameters(parametersString);

    // Ensure 'type' parameter is present (required)
    if (!parameters.type) {
      parameters.type = 'unknown'; // Default type if not specified
    }

    return {
      word,
      parameters,
    };
  }

  /**
   * Parse parameters from a parameter string
   *
   * Examples:
   * - "[type=slur]"
   * - "[type=slur][severity=high]"
   *
   * @param parametersString String containing parameters
   * @returns Parsed parameters object
   */
  private static parseParameters(parametersString: string): WordParameters {
    const parameters: WordParameters = {
      type: 'unknown', // Default value
    };

    // Regular expression to match parameter blocks [key=value]
    const paramRegex = /\[([^\]]+)\]/g;
    let match;

    while ((match = paramRegex.exec(parametersString)) !== null) {
      const paramContent = match[1];

      if (!paramContent) {
        continue; // Skip empty parameter content
      }

      // Split by '=' to get key-value pairs
      const equalIndex = paramContent.indexOf('=');
      if (equalIndex === -1) {
        // No value, treat as boolean flag
        parameters[paramContent] = true;
      } else {
        const key = paramContent.substring(0, equalIndex).trim();
        const value = paramContent.substring(equalIndex + 1).trim();

        if (!key) {
          continue; // Skip parameters with empty keys
        }

        // Parse value if it's a boolean, number, or string
        if (value.toLowerCase() === 'true') {
          parameters[key] = true;
        } else if (value.toLowerCase() === 'false') {
          parameters[key] = false;
        } else if (/^\d+$/.test(value)) {
          parameters[key] = parseInt(value, 10);
        } else if (/^\d+\.\d+$/.test(value)) {
          parameters[key] = parseFloat(value);
        } else {
          // Remove quotes if present
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            parameters[key] = value.substring(1, value.length - 1);
          } else {
            parameters[key] = value;
          }
        }
      }
    }

    return parameters;
  }

  /**
   * Convert a parameterized word back to its string representation
   *
   * @param parameterizedWord The parameterized word to convert
   * @returns String representation of the parameterized word
   */
  static parameterizedWordToString(parameterizedWord: ParameterizedWord): string {
    let result = parameterizedWord.word;

    // Add all parameters except the word itself
    const params = parameterizedWord.parameters;
    const paramStrings: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (key === 'word') continue; // Skip the word property

      if (typeof value === 'string') {
        paramStrings.push(`${key}="${value}"`);
      } else if (typeof value === 'boolean') {
        paramStrings.push(`${key}=${value}`);
      } else if (typeof value === 'number') {
        paramStrings.push(`${key}=${value}`);
      }
    }

    if (paramStrings.length > 0) {
      result += '[' + paramStrings.join('][') + ']';
    }

    return result;
  }

  /**
   * Convert an array of parameterized words to a comma-separated string
   *
   * @param words Array of parameterized words
   * @returns Comma-separated string representation
   */
  static parameterizedWordsToString(words: ParameterizedWord[]): string {
    return words.map(word => this.parameterizedWordToString(word)).join(',');
  }

  /**
   * Create a parameterized word from a simple word string
   *
   * @param word The word string
   * @param type The type parameter (default: 'unknown')
   * @param additionalParams Additional parameters to include
   * @returns Parameterized word object
   */
  static createParameterizedWord(
    word: string,
    type: string = 'unknown',
    additionalParams: Record<string, any> = {}
  ): ParameterizedWord {
    return {
      word,
      parameters: {
        type,
        ...additionalParams,
      },
    };
  }
}
