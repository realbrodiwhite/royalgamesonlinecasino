// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.resetAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
