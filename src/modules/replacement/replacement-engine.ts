/**
 * Text replacement engine for the Muzzle text filtering system
 *
 * This file provides the core functionality for applying text replacement
 * strategies to filtered content. It manages different replacement strategies
 * and applies them to text based on configuration.
 */

import { TextMatch, ReplacementConfig, TextMatchResult } from '../../types';
import { ReplacementStrategy, ReplacementResult } from './replacement-strategy';
import { AsteriskReplacementStrategy } from './asterisk-replacement-strategy';
import { CustomReplacementStrategy } from './custom-replacement-strategy';
import { RemovalReplacementStrategy } from './removal-replacement-strategy';

/**
 * Text replacement engine implementation
 * 
 * Manages and applies text replacement strategies to filtered content.
 * Supports multiple strategies and handles the replacement process efficiently.
 */
export class ReplacementEngine {
  private strategies: ReplacementStrategy[];
  
  /**
   * Create a new replacement engine instance
   */
  constructor() {
    this.strategies = [
      new AsteriskReplacementStrategy(),
      new CustomReplacementStrategy(),
      new RemovalReplacementStrategy(),
    ];
  }
  
  /**
   * Apply replacement strategies to text based on matches
   * 
   * @param originalText - The original text to process
   * @param matches - Array of text matches found in the text
   * @param config - Replacement configuration options
   * @returns Replacement result with modified text and replacement details
   */
  applyReplacements(
    originalText: string, 
    matches: TextMatch[], 
    config: ReplacementConfig
  ): ReplacementResult {
    // If replacement is not enabled or no matches, return original
    if (!config?.enabled || !matches || matches.length === 0) {
      return {
        originalText,
        modifiedText: originalText,
        replacedMatches: [],
        replacementCount: 0,
        replacementsMade: false,
      };
    }
    
    // Sort matches by position to process them in order
    const sortedMatches = [...matches].sort((a, b) => 
      a.position.start - b.position.start
    );
    
    let modifiedText = originalText;
    let replacedMatches: TextMatch[] = [];
    let replacementCount = 0;
    
    // Process each match and apply replacement
    for (const match of sortedMatches) {
      const strategy = this.getStrategy(config);
      
      if (strategy && strategy.canHandle(config)) {
        // Generate replacement text
        const replacementText = strategy.generateReplacement(match, config);
        
        // Apply replacement to the text
        modifiedText = this.replaceInText(
          modifiedText, 
          match.position.start, 
          match.position.end, 
          replacementText
        );
        
        // Update match with replacement info
        const updatedMatch = {
          ...match,
          replacement: replacementText,
        };
        
        replacedMatches.push(updatedMatch);
        replacementCount++;
      }
    }
    
    return {
      originalText,
      modifiedText,
      replacedMatches,
      replacementCount,
      replacementsMade: replacementCount > 0,
    };
  }
  
  /**
   * Get the appropriate replacement strategy for the configuration
   * 
   * @param config - Replacement configuration
   * @returns The appropriate strategy or undefined if none found
   */
  private getStrategy(config: ReplacementConfig): ReplacementStrategy | undefined {
    return this.strategies.find(strategy => strategy.canHandle(config));
  }
  
  /**
   * Replace text at the specified position
   * 
   * @param text - The text to modify
   * @param start - Start position of the text to replace
   * @param end - End position of the text to replace
   * @param replacement - The replacement text
   * @returns Modified text with replacement applied
   */
  private replaceInText(
    text: string, 
    start: number, 
    end: number, 
    replacement: string
  ): string {
    return text.substring(0, start) + replacement + text.substring(end);
  }
  
  /**
   * Add a custom replacement strategy
   * 
   * @param strategy - The strategy to add
   */
  addStrategy(strategy: ReplacementStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * Remove a replacement strategy
   * 
   * @param strategy - The strategy to remove
   */
  removeStrategy(strategy: ReplacementStrategy): void {
    const index = this.strategies.indexOf(strategy);
    if (index > -1) {
      this.strategies.splice(index, 1);
    }
  }
  
  /**
   * Get all available strategies
   * 
   * @returns Array of all available strategies
   */
  getStrategies(): ReplacementStrategy[] {
    return [...this.strategies];
  }
}