/**
 * Parser for parameterized word definitions
 *
 * This module provides parsing functionality for parameterized word definitions,
 * allowing words to be defined with additional metadata and parameters. It supports
 * parsing from string representations, converting back to strings, and creating
 * parameterized words from simple word strings.
 *
 * @module word-parser
 * @description Parser for handling parameterized word definitions with metadata and parameters
 */

import { ParameterizedWord, WordParameters } from '../types';

/**
 * Parser for handling parameterized word definitions
 *
 * The WordParser class provides static methods for parsing parameterized word definitions
 * from string representations, converting parameterized words back to strings, and creating
 * parameterized words from simple word strings. It supports a flexible syntax for defining
 * word parameters using bracket notation.
 *
 * @example
 * ```typescript
 * // Parse parameterized words from string
 * const words = WordParser.parseParameterizedWords('badword[type=slur][severity=high],anotherword[type=profanity]');
 *
 * // Convert parameterized word back to string
 * const str = WordParser.parameterizedWordToString(words[0]);
 *
 * // Create parameterized word from simple string
 * const paramWord = WordParser.createParameterizedWord('badword', 'slur', { severity: 5 });
 * ```
 */
export class WordParser {
  /**
   * Parse a string with parameterized word definitions
   *
   * This method parses a comma-separated string of parameterized word definitions
   * into an array of ParameterizedWord objects. Each word definition can include
   * multiple parameters specified using bracket notation.
   *
   * Examples:
   * - "badword[type=slur],ahh[type=profanity]"
   * - "word1[type=slur][severity=high],word2[type=profanity]"
   *
   * @param input String containing parameterized word definitions
   * @returns Array of parsed parameterized words
   *
   * @example
   * ```typescript
   * const words = WordParser.parseParameterizedWords('badword[type=slur][severity=high],anotherword[type=profanity]');
   * console.log(words);
   * // [
   * //   { word: 'badword', parameters: { type: 'slur', severity: 'high' } },
   * //   { word: 'anotherword', parameters: { type: 'profanity' } }
   * // ]
   * ```
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
   * This method parses a single word definition string that may include
   * parameters specified using bracket notation. It extracts the base word
   * and all associated parameters.
   *
   * Examples:
   * - "badword[type=slur]"
   * - "word1[type=slur][severity=high]"
   *
   * @param definition Single word definition string
   * @returns Parsed parameterized word or null if invalid
   * @private
   *
   * @example
   * ```typescript
   * const word = WordParser['parseSingleWordDefinition']('badword[type=slur][severity=high]');
   * console.log(word);
   * // { word: 'badword', parameters: { type: 'slur', severity: 'high' } }
   * ```
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
   * This method parses a string containing parameters in bracket notation
   * and converts them into a parameters object. It supports various data types
   * including strings, numbers, and boolean values.
   *
   * Examples:
   * - "[type=slur]"
   * - "[type=slur][severity=high]"
   *
   * @param parametersString String containing parameters
   * @returns Parsed parameters object
   * @private
   *
   * @example
   * ```typescript
   * const params = WordParser['parseParameters']('[type=slur][severity=5][enabled=true]');
   * console.log(params);
   * // { type: 'slur', severity: 5, enabled: true }
   * ```
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
   * This method converts a parameterized word object back to its string representation
   * using bracket notation for parameters. It handles different parameter data types
   * and formats them appropriately.
   *
   * @param parameterizedWord The parameterized word to convert
   * @returns String representation of the parameterized word
   *
   * @example
   * ```typescript
   * const paramWord = {
   *   word: 'badword',
   *   parameters: {
   *     type: 'slur',
   *     severity: 5,
   *     enabled: true
   *   }
   * };
   * const str = WordParser.parameterizedWordToString(paramWord);
   * console.log(str); // "badword[type=\"slur\"][severity=5][enabled=true]"
   * ```
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
   * This method converts an array of parameterized word objects into a single
   * comma-separated string representation, suitable for storage or transmission.
   *
   * @param words Array of parameterized words
   * @returns Comma-separated string representation
   *
   * @example
   * ```typescript
   * const words = [
   *   { word: 'badword1', parameters: { type: 'slur' } },
   *   { word: 'badword2', parameters: { type: 'profanity', severity: 3 } }
   * ];
   * const str = WordParser.parameterizedWordsToString(words);
   * console.log(str); // "badword1[type=\"slur\"],badword2[type=\"profanity\"][severity=3]"
   * ```
   */
  static parameterizedWordsToString(words: ParameterizedWord[]): string {
    return words.map(word => this.parameterizedWordToString(word)).join(',');
  }

  /**
   * Create a parameterized word from a simple word string
   *
   * This method creates a parameterized word object from a simple word string,
   * adding the specified type and any additional parameters. It's useful for
   * programmatically creating parameterized words when you don't have a string
   * representation to parse.
   *
   * @param word The word string
   * @param type The type parameter (default: 'unknown')
   * @param additionalParams Additional parameters to include
   * @returns Parameterized word object
   *
   * @example
   * ```typescript
   * const paramWord = WordParser.createParameterizedWord('badword', 'slur', { severity: 5 });
   * console.log(paramWord);
   * // { word: 'badword', parameters: { type: 'slur', severity: 5 } }
   *
   * // Create with default type
   * const paramWord2 = WordParser.createParameterizedWord('anotherword');
   * console.log(paramWord2);
   * // { word: 'anotherword', parameters: { type: 'unknown' } }
   * ```
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
