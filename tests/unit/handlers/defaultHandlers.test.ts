import {
  defaultSocketConnectionHandler,
  defaultSocketDisconnectionHandler,
  defaultWorkflowLogHandler,
} from "../../../src/handlers/defaultHandlers";

// Mock the readline module for testing the feedback handler
jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    question: jest.fn((question, callback) => callback("mocked-answer")),
    close: jest.fn(),
  }),
}));

describe("Default Handlers", () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Mock console methods before each test
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    // Restore console methods after each test
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("defaultSocketConnectionHandler", () => {
    it("should log connection message", () => {
      defaultSocketConnectionHandler();
      expect(console.log).toHaveBeenCalledWith("Socket connected successfully");
    });
  });

  describe("defaultSocketDisconnectionHandler", () => {
    it("should log disconnection message with reason", () => {
      const reason = "test-reason";
      defaultSocketDisconnectionHandler(reason);
      expect(console.log).toHaveBeenCalledWith("Socket disconnected:", reason);
    });
  });

  describe("defaultWorkflowLogHandler", () => {
    it("should log the data", () => {
      const testData = { message: "test log message" };
      defaultWorkflowLogHandler(testData);
      expect(console.log).toHaveBeenCalledWith(testData);
    });
  });
});
