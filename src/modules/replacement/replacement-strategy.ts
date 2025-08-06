/**
 * Replacement strategy interface for the Muzzle text filtering system
 *
 * This file defines the contract for text replacement strategies that can be used
 * to replace matched content in text. Different implementations can provide
 * various replacement behaviors like asterisk replacement, custom strings,
 * or complete removal of matched content.
 */

import { TextMatch, ReplacementConfig } from '../../types';

/**
 * Interface for text replacement strategies
 * 
 * Defines the contract that all replacement strategy implementations must follow.
 * Each strategy takes a match and configuration and returns the replacement text.
 */
export interface ReplacementStrategy {
  /**
   * Generate replacement text for a matched word
   * 
   * @param match - The text match that needs to be replaced
   * @param config - Replacement configuration options
   * @returns The replacement text to use
   */
  generateReplacement(match: TextMatch, config: ReplacementConfig): string;
  
  /**
   * Check if this strategy can handle the given configuration
   * 
   * @param config - Replacement configuration to check
   * @returns True if this strategy can handle the configuration
   */
  canHandle(config: ReplacementConfig): boolean;
}

/**
 * Result of a text replacement operation
 * 
 * Contains information about the replacement operation including
 * the original text, modified text, and details about replacements made.
 */
export interface ReplacementResult {
  /** The original text before replacement */
  originalText: string;
  /** The text after replacement has been applied */
  modifiedText: string;
  /** Array of matches that were replaced */
  replacedMatches: TextMatch[];
  /** Number of replacements made */
  replacementCount: number;
  /** Whether any replacements were made */
  replacementsMade: boolean;
}

/**
 * Base abstract class for replacement strategies
 * 
 * Provides common functionality and validation for all replacement strategies.
 */
export abstract class BaseReplacementStrategy implements ReplacementStrategy {
  /**
   * Generate replacement text for a matched word
   * 
   * @param match - The text match that needs to be replaced
   * @param config - Replacement configuration options
   * @returns The replacement text to use
   */
  abstract generateReplacement(match: TextMatch, config: ReplacementConfig): string;
  
  /**
   * Check if this strategy can handle the given configuration
   * 
   * @param config - Replacement configuration to check
   * @returns True if this strategy can handle the configuration
   */
  abstract canHandle(config: ReplacementConfig): boolean;
  
  /**
   * Validate replacement configuration
   * 
   * @param config - Configuration to validate
   * @returns True if configuration is valid for this strategy
   * @protected
   */
  protected validateConfig(config: ReplacementConfig): boolean {
    return config && typeof config === 'object';
  }
  
  /**
   * Get the matched word from a text match
   * 
   * @param match - The text match
   * @returns The matched word
   * @protected
   */
  protected getMatchedWord(match: TextMatch): string {
    return match.word;
  }
  
  /**
   * Check if replacement should preserve case
   * 
   * @param config - Replacement configuration
   * @returns True if case should be preserved
   * @protected
   */
  protected shouldPreserveCase(config: ReplacementConfig): boolean {
    return config.preserveCase !== false;
  }
}