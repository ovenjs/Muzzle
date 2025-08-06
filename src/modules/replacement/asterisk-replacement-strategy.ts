/**
 * Asterisk replacement strategy for the Muzzle text filtering system
 *
 * This file implements a replacement strategy that replaces matched words
 * with asterisks, with configurable options for the number of asterisks
 * and character preservation.
 */

import { TextMatch, ReplacementConfig } from '../../types';
import { BaseReplacementStrategy } from './replacement-strategy';

/**
 * Asterisk replacement strategy implementation
 * 
 * Replaces matched words with asterisks, with options for:
 * - Custom asterisk character
 * - Full word replacement or fixed count
 * - Case preservation
 * - Boundary preservation
 */
export class AsteriskReplacementStrategy extends BaseReplacementStrategy {
  /**
   * Generate replacement text using asterisks
   * 
   * @param match - The text match that needs to be replaced
   * @param config - Replacement configuration options
   * @returns String of asterisks to replace the matched word
   */
  generateReplacement(match: TextMatch, config: ReplacementConfig): string {
    if (!this.validateConfig(config)) {
      return this.getMatchedWord(match);
    }
    
    const asteriskChar = config.asteriskChar || '*';
    const word = this.getMatchedWord(match);
    
    // Determine the number of asterisks to use
    let asteriskCount: number;
    if (config.asteriskCount === 'full' || !config.asteriskCount) {
      asteriskCount = word.length;
    } else {
      asteriskCount = Math.max(1, config.asteriskCount);
    }
    
    // Generate asterisk string
    let replacement = asteriskChar.repeat(asteriskCount);
    
    // Preserve case if configured
    if (this.shouldPreserveCase(config)) {
      if (word === word.toUpperCase()) {
        replacement = replacement.toUpperCase();
      } else if (word === word.toLowerCase()) {
        replacement = replacement.toLowerCase();
      } else if (word[0] && word[0] === word[0].toUpperCase()) {
        replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
      }
    }
    
    return replacement;
  }
  
  /**
   * Check if this strategy can handle the given configuration
   * 
   * @param config - Replacement configuration to check
   * @returns True if strategy is set to 'asterisks'
   */
  canHandle(config: ReplacementConfig): boolean {
    return config.strategy === 'asterisks';
  }
  
  /**
   * Validate replacement configuration for asterisk strategy
   * 
   * @param config - Configuration to validate
   * @returns True if configuration is valid
   * @protected
   */
  protected override validateConfig(config: ReplacementConfig): boolean {
    return super.validateConfig(config) && config.strategy === 'asterisks';
  }
}