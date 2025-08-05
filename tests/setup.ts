/**
 * Test setup for Muzzle tests
 */

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up global test utilities
global.beforeEach(() => {
  // Reset any global state before each test
  jest.clearAllMocks();
});

global.afterEach(() => {
  // Clean up after each test
});