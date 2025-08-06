/**
 * Removal replacement strategy for the Muzzle text filtering system
 *
 * This file implements a replacement strategy that completely removes
 * matched words from the text, replacing them with empty string.
 */

import { TextMatch, ReplacementConfig } from '../../types';
import { BaseReplacementStrategy } from './replacement-strategy';

/**
 * Removal replacement strategy implementation
 * 
 * Completely removes matched words from text, with options for:
 * - Boundary preservation
 * - Whitespace handling
 */
export class RemovalReplacementStrategy extends BaseReplacementStrategy {
  /**
   * Generate replacement text by removing the matched word
   * 
   * @param match - The text match that needs to be replaced
   * @param config - Replacement configuration options
   * @returns Empty string to remove the matched word
   */
  generateReplacement(match: TextMatch, config: ReplacementConfig): string {
    if (!this.validateConfig(config)) {
      return this.getMatchedWord(match);
    }
    
    // Always return empty string for removal strategy
    return '';
  }
  
  /**
   * Check if this strategy can handle the given configuration
   * 
   * @param config - Replacement configuration to check
   * @returns True if strategy is set to 'remove'
   */
  canHandle(config: ReplacementConfig): boolean {
    return config.strategy === 'remove';
  }
  
  /**
   * Validate replacement configuration for removal strategy
   * 
   * @param config - Configuration to validate
   * @returns True if configuration is valid
   * @protected
   */
  protected override validateConfig(config: ReplacementConfig): boolean {
    return super.validateConfig(config) && config.strategy === 'remove';
  }
}