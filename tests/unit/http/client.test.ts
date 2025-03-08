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
} from "../../../src";

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
