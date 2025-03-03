import { listWorkflows, getWorkflowDetail, ApiAuth } from "../../../src";
import {
  setupFetchMock,
  resetFetchMock,
  mockSuccessResponse,
  mockErrorResponseFn,
  mockWorkflowListResponse,
  mockWorkflowDetailResponse,
  mockErrorResponse,
} from "../../mocks/fetch.mock";

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
        "https://api.pocketflow.app/v1/workflows",
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test_api_key",
          },
        })
      );
    });

    it("should fetch workflows with custom parameters", async () => {
      // Set up mock response
      mockSuccessResponse(mockWorkflowListResponse);

      // Custom parameters
      const params = {
        limit: 5,
        offset: 10,
        sort: "name" as const,
        order: "asc" as const,
        search: "test query",
      };

      // Call the function
      await listWorkflows(auth, params);

      // Verify the fetch call with correct URL parameters
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;

      // Check that URL contains all our parameters
      expect(fetchUrl).toContain("limit=5");
      expect(fetchUrl).toContain("offset=10");
      expect(fetchUrl).toContain("sort=name");
      expect(fetchUrl).toContain("order=asc");
      expect(fetchUrl).toContain("search=test+query");
    });

    it("should handle authentication with API key", async () => {
      // Set up mock response
      mockSuccessResponse(mockWorkflowListResponse);

      // API Key auth
      const apiKeyAuth: ApiAuth = { apiKey: "test_api_key" };

      // Call the function
      await listWorkflows(apiKeyAuth);

      // Verify the fetch call with API key header
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "test_api_key",
          },
        })
      );
    });

    it("should throw an error when authentication is missing", async () => {
      // Empty auth object
      const emptyAuth: ApiAuth = {};

      // Call the function and expect it to throw
      await expect(listWorkflows(emptyAuth)).rejects.toThrow(
        "Authentication required: Please provide either a JWT token or API key"
      );

      // Verify fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle API errors correctly", async () => {
      // Set up mock error response
      mockErrorResponseFn(404, mockErrorResponse);

      // Call the function and expect it to throw
      await expect(listWorkflows(auth)).rejects.toThrow(
        "No workflow with ID wf_invalid was found"
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
        "https://api.pocketflow.app/v1/workflows/wf_123456789",
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
        "No workflow with ID wf_invalid was found"
      );

      // Verify fetch was called
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
