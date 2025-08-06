/**
 * Custom string replacement strategy for the Muzzle text filtering system
 *
 * This file implements a replacement strategy that replaces matched words
 * with a custom string specified in the configuration.
 */

import { TextMatch, ReplacementConfig } from '../../types';
import { BaseReplacementStrategy } from './replacement-strategy';

/**
 * Custom string replacement strategy implementation
 * 
 * Replaces matched words with a custom string, with options for:
 * - Custom replacement string
 * - Case preservation
 * - Boundary preservation
 */
export class CustomReplacementStrategy extends BaseReplacementStrategy {
  /**
   * Generate replacement text using custom string
   * 
   * @param match - The text match that needs to be replaced
   * @param config - Replacement configuration options
   * @returns Custom string to replace the matched word
   */
  generateReplacement(match: TextMatch, config: ReplacementConfig): string {
    if (!this.validateConfig(config) || !config.customString) {
      return this.getMatchedWord(match);
    }
    
    const customString = config.customString;
    const word = this.getMatchedWord(match);
    
    let replacement = customString;
    
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
   * @returns True if strategy is set to 'custom' and custom string is provided
   */
  canHandle(config: ReplacementConfig): boolean {
    return config.strategy === 'custom' && !!config.customString;
  }
  
  /**
   * Validate replacement configuration for custom strategy
   * 
   * @param config - Configuration to validate
   * @returns True if configuration is valid
   * @protected
   */
  protected override validateConfig(config: ReplacementConfig): boolean {
    return super.validateConfig(config) && 
           config.strategy === 'custom' && 
           typeof config.customString === 'string' && 
           config.customString.length > 0;
  }
}