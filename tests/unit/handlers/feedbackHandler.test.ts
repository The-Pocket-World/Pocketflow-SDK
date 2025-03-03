import { defaultFeedbackRequestHandler } from "../../../src/handlers/defaultHandlers";

// Mock data for testing
const mockData = {
  prompt: "Test prompt",
  defaultValue: "default-value",
};

// Mock readline module
const mockQuestion = jest.fn();
const mockClose = jest.fn();

jest.mock("readline", () => ({
  createInterface: jest.fn().mockReturnValue({
    question: mockQuestion,
    close: mockClose,
  }),
}));

describe("defaultFeedbackRequestHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log the feedback request data", async () => {
    // Setup mock to call the callback with a user input
    mockQuestion.mockImplementation((question, callback) => {
      callback("user-input");
    });

    // Call the handler
    const result = defaultFeedbackRequestHandler(mockData);

    // Test that it's a Promise
    expect(result).toBeInstanceOf(Promise);

    // Wait for the promise to resolve
    const response = await result;

    // Verify logging
    expect(console.log).toHaveBeenCalledWith("Feedback request:", mockData);

    // Verify readline usage
    expect(mockQuestion).toHaveBeenCalledWith(
      `${mockData.prompt} (Default: ${mockData.defaultValue}): `,
      expect.any(Function)
    );

    // Verify close was called
    expect(mockClose).toHaveBeenCalled();

    // Verify response
    expect(response).toBe("user-input");
  });

  it("should use default value when user input is empty", async () => {
    // Setup mock to call the callback with an empty string
    mockQuestion.mockImplementation((question, callback) => {
      callback("");
    });

    // Call the handler and get the result
    const response = await defaultFeedbackRequestHandler(mockData);

    // Verify response uses default value
    expect(response).toBe(mockData.defaultValue);
  });
});
