/**
 * Test file for HTTP client functions
 * For simplicity, we'll test the error classes and simple functionality
 * The complex API interactions would require more elaborate mocking
 */

import {
  ApiError,
  NotFoundError,
  AuthenticationError,
  NetworkError,
  ApiAuth,
  listWorkflows,
  getWorkflowDetail,
} from "../../../src";

// Import test utilities
import {
  setupFetchMock,
  resetFetchMock,
  mockSuccessResponse,
  mockErrorResponseFn,
} from "../test-utils/fetch-mock";

// Import mock data
import {
  mockWorkflowListResponse,
  mockWorkflowDetailResponse,
  mockErrorResponse,
} from "../test-utils/mock-data";

// Mock the env module to control the SERVER_URL
jest.mock("../../../src/env", () => ({
  __esModule: true,
  default: {
    API_KEY: "test_api_key",
    SERVER_URL: "http://localhost:8080",
  },
}));

// Simple tests for error classes - these should work without any mocking
describe("HTTP Client API Error Classes", () => {
  describe("Custom Error Classes", () => {
    it("ApiError should maintain instanceof checks", () => {
      const error = new ApiError("Test error");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(error.name).toBe("ApiError");
    });

    it("NotFoundError should maintain instanceof checks", () => {
      const error = new NotFoundError("Not found error");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof NotFoundError).toBe(true);
      expect(error.name).toBe("NotFoundError");
    });

    it("AuthenticationError should maintain instanceof checks", () => {
      const error = new AuthenticationError("Auth error");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof AuthenticationError).toBe(true);
      expect(error.name).toBe("AuthenticationError");
    });

    it("NetworkError should maintain instanceof checks", () => {
      const error = new NetworkError("Network error");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof NetworkError).toBe(true);
      expect(error.name).toBe("NetworkError");
    });

    it("should capture the cause of the error", () => {
      const cause = new Error("Original error");
      const error = new ApiError("Wrapped error", cause);
      expect(error.cause).toBe(cause);
    });
  });
});

describe("HTTP Client API", () => {
  // Mock auth for all tests
  const auth: ApiAuth = { apiKey: "test_api_key" };

  // Set up global fetch mock before all tests
  beforeAll(() => {
    setupFetchMock();
  });

  // Reset mock between tests
  beforeEach(() => {
    resetFetchMock();
  });

  describe("listWorkflows", () => {
    it("should fetch workflows with default parameters", async () => {
      // Set up mock response
      mockSuccessResponse(mockWorkflowListResponse);

      // Call the function
      const result = await listWorkflows(auth);

      // Verify the results
      expect(result).toEqual(mockWorkflowListResponse);
      expect(result.workflows.length).toBe(2);
      expect(result.meta.total).toBe(2);

      // Verify the fetch call
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/workflows",
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test_api_key",
          },
        })
      );
    });

    it("should handle API errors correctly", async () => {
      // Set up mock error response with the specific error message
      mockErrorResponseFn(404, mockErrorResponse);

      // Call the function and expect it to throw
      await expect(listWorkflows(auth)).rejects.toThrow(
        "Resource not found: /workflows"
      );

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("getWorkflowDetail", () => {
    it("should fetch a specific workflow by ID", async () => {
      // Set up mock response
      mockSuccessResponse(mockWorkflowDetailResponse);

      // Call the function
      const result = await getWorkflowDetail(auth, "wf_123456789");

      // Verify the results
      expect(result).toEqual(mockWorkflowDetailResponse);
      expect(result.id).toBe("wf_123456789");
      expect(result.nodes.length).toBe(2);

      // Verify the fetch call
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/workflows/wf_123456789",
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test_api_key",
          },
        })
      );
    });

    it("should handle API errors when fetching workflow details", async () => {
      // Set up mock error response
      mockErrorResponseFn(404, mockErrorResponse);

      // Call the function and expect it to throw
      await expect(getWorkflowDetail(auth, "wf_invalid")).rejects.toThrow(
        "Resource not found: /workflows/wf_invalid"
      );

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
