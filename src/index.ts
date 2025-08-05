/**
 * Main entry point for the @ovendjs/muzzle content filtering system
 */

// Export core functionality
export * from './core';

// Export types
export * from './types';

// Import Muzzle class for re-export
import { Muzzle } from './core/muzzle';

// Re-export main Muzzle class for convenience
export { Muzzle };

// Export configuration utilities
export { ConfigValidator, ConfigLoader, DEFAULT_CONFIG } from './core/config';

/**
 * Create a new Muzzle instance with the given options
 *
 * @param options - Configuration options for the Muzzle instance
 * @returns A new Muzzle instance
 */
export function createMuzzle(options?: import('./types').MuzzleOptions) {
  return new Muzzle(options);
}

/**
 * Default export of the Muzzle class
 */
export default Muzzle;
