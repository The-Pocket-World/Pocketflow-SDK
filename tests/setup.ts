// Define global jest mocks
beforeAll(() => {
  // Mock console methods for clean test output
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  // Silence console output during tests
  jest.spyOn(console, "log").mockImplementation(jest.fn());
  jest.spyOn(console, "error").mockImplementation(jest.fn());
  jest.spyOn(console, "warn").mockImplementation(jest.fn());
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
