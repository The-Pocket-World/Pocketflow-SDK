# PocketFlow SDK Tests

This directory contains tests for the PocketFlow SDK.

## Structure

- `unit/`: Unit tests for individual components
  - `handlers/`: Tests for handler functions
  - `socket/`: Tests for socket-related functionality
- `integration/`: Integration tests that test multiple components together
- `mocks/`: Mock implementations used in tests

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Writing Tests

When writing new tests, follow these guidelines:

1. Create unit tests for new functionality in the appropriate directory
2. Use the provided mocks in `mocks/` directory when possible
3. Keep tests isolated and deterministic
4. For socket tests, use the `MockSocket` class to simulate socket communication

## Mocking

The tests use Jest's mocking capabilities to mock external dependencies:

- Socket.io client is mocked using `socket.mock.ts`
- Console logging is mocked in `setup.ts`
- Node's readline is mocked for feedback handler tests

## Coverage

Test coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.
