// Jest test setup file
// This file runs before each test suite

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Filter out common warnings that aren't test-related
  if (args[0] && typeof args[0] === 'string') {
    if (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: ReactDOMTestUtils') ||
        args[0].includes('Warning: useLayoutEffect')) {
      return;
    }
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Filter out common warnings that aren't test-related
  if (args[0] && typeof args[0] === 'string') {
    if (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: ReactDOMTestUtils') ||
        args[0].includes('Warning: useLayoutEffect')) {
      return;
    }
  }
  originalConsoleWarn(...args);
};

// Set up global test timeouts
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  // Reset all mocks
  jest.clearAllMocks();

  // Reset modules if needed
  jest.resetModules();
});

// Global test utilities
global.testUtils = {
  // Add any common test utilities here
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  createMockResponse: (data = {}, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  })
};
