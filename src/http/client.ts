/**
 * HTTP client for interacting with the PocketFlow API
 */

// Import environment variables first
import env from "../env";

/**
 * Base URL for the PocketFlow API
 * Uses POCKETFLOW_SERVER_URL from environment if available
 */
const SERVER_URL = env.SERVER_URL || "https://api.pocketflow.app";
// Remove trailing slash if present
const BASE_URL = SERVER_URL.endsWith("/")
  ? SERVER_URL.slice(0, -1)
  : SERVER_URL;

// Always log the base URL for clarity
console.log(`PocketFlow SDK using API endpoint: ${BASE_URL}`);

/**
 * Base error class for API errors
 */
export class ApiError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "ApiError";

    // Maintain the prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Custom error class for 404 Not Found responses
 */
export class NotFoundError extends ApiError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, cause);
    this.name = "NotFoundError";

    // Maintain the prototype chain for instanceof checks
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Custom error class for authentication errors
 */
export class AuthenticationError extends ApiError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, cause);
    this.name = "AuthenticationError";

    // Maintain the prototype chain for instanceof checks
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Custom error class for network issues
 */
export class NetworkError extends ApiError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, cause);
    this.name = "NetworkError";

    // Maintain the prototype chain for instanceof checks
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Interface for API authentication options
 */
export interface ApiAuth {
  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;

  /**
   * Request timeout in milliseconds (default: 30000ms = 30 seconds)
   */
  timeout?: number;
}

/**
 * Interface for pagination parameters
 */
export interface PaginationParams {
  /**
   * Number of items to return (default: 20, max: 100)
   */
  limit?: number;

  /**
   * Pagination offset (default: 0)
   */
  offset?: number;
}

/**
 * Interface for workflow list query parameters
 */
export interface WorkflowListParams extends PaginationParams {
  /**
   * Sort field: 'created_at', 'updated_at', 'name' (default: 'created_at')
   */
  sort?: "created_at" | "updated_at" | "name";

  /**
   * Sort order: 'asc' or 'desc' (default: 'desc')
   */
  order?: "asc" | "desc";

  /**
   * Free text search across workflow name and prompt
   */
  search?: string;
}

/**
 * Interface for a workflow in the list response
 */
export interface WorkflowSummary {
  /**
   * Unique identifier for the workflow
   */
  id: string;

  /**
   * Name of the workflow
   */
  name: string;

  /**
   * When the workflow was created
   */
  created_at: string;

  /**
   * When the workflow was last updated
   */
  updated_at: string;

  /**
   * Workflow prompt description
   */
  prompt: string;

  /**
   * Number of times the workflow has been executed
   */
  execution_count: number;

  /**
   * When the workflow was last executed
   */
  last_executed_at: string | null;
}

/**
 * Interface for pagination metadata
 */
export interface PaginationMeta {
  /**
   * Total number of items
   */
  total: number;

  /**
   * Limit used for the request
   */
  limit: number;

  /**
   * Offset used for the request
   */
  offset: number;
}

/**
 * Interface for workflow list response
 */
export interface WorkflowListResponse {
  /**
   * List of workflow summaries
   */
  workflows: WorkflowSummary[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;
}

/**
 * Interface for a workflow node
 */
export interface WorkflowNode {
  /**
   * Unique identifier for the node
   */
  id: string;

  /**
   * Name of the node
   */
  name: string;

  /**
   * Type of the node
   */
  type: string;
}

/**
 * Interface for detailed workflow information
 */
export interface WorkflowDetail extends WorkflowSummary {
  /**
   * Path to the workflow YAML file
   */
  yaml_path: string;

  /**
   * YAML content of the workflow
   */
  yaml?: string;

  /**
   * List of nodes in the workflow
   */
  nodes: WorkflowNode[];

  /**
   * Alternative response structure with nested workflow object
   */
  workflow?: {
    id: string;
    name: string;
    yamlPath: string;
    prompt: string;
    yamlContent: string;
    [key: string]: any;
  };
}

/**
 * Interface for API error response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Helper function to build authentication headers
 */
const buildAuthHeaders = (auth: ApiAuth): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth.apiKey) {
    headers["X-API-Key"] = auth.apiKey;
  } else {
    throw new AuthenticationError(
      "Authentication required: Please provide an API key"
    );
  }

  return headers;
};

/**
 * Helper function to construct URL with query parameters
 */
const buildUrlWithParams = (
  endpoint: string,
  params?: Record<string, any>
): string => {
  // Ensure BASE_URL doesn't end with a trailing slash
  const baseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;

  // Make sure we have a valid URL by ensuring endpoint starts with /
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let url;
  try {
    url = new URL(`${baseUrl}${path}`);
  } catch (error) {
    throw new ApiError(
      `Invalid URL: ${baseUrl}${path}`,
      error instanceof Error ? error : undefined
    );
  }

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

/**
 * Generic function to make API requests
 */
async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  auth: ApiAuth,
  params?: Record<string, any>,
  body?: any
): Promise<T> {
  try {
    // Make sure we have a valid URL by ensuring endpoint starts with /
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    const apiPrefix = "/api";

    // Construct the full URL with the appropriate prefix
    const url = buildUrlWithParams(`${apiPrefix}${path}`, params);

    // Always log the request URL for debugging
    console.log(`API Request: ${method} ${url}`);

    if (auth.verbose) {
      console.log("Headers:", JSON.stringify(buildAuthHeaders(auth), null, 2));
      if (body) {
        console.log("Request Body:", JSON.stringify(body, null, 2));
      }
    }

    // Create AbortController for request timeout if specified
    const timeout = auth.timeout || 30000; // Default to 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: buildAuthHeaders(auth),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      // Log response status and headers for debugging
      console.log(`Response Status: ${response.status} ${response.statusText}`);

      if (auth.verbose) {
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        console.log(
          "Response Headers:",
          JSON.stringify(responseHeaders, null, 2)
        );
      }

      // First get the response as text
      const responseText = await response.text();

      // Handle HTTP status code errors
      switch (response.status) {
        case 401:
        case 403:
          console.error(
            `Authentication failed: ${response.status} ${response.statusText}`
          );
          throw new AuthenticationError(
            "Authentication failed. Please check your API key."
          );

        case 404:
          if (auth.verbose) {
            console.log(`Resource not found: ${url}`);
          } else {
            // Always log 404 errors even in non-verbose mode
            console.error(`Resource not found: ${url}`);
            console.error(`Response body: ${responseText}`);
          }
          throw new NotFoundError(`Resource not found: ${endpoint}`);

        case 429:
          console.error("Rate limit exceeded");
          throw new ApiError("Rate limit exceeded. Please try again later.");
      }

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error("Failed to parse server response as JSON:");
        console.error("----- Response Body Start -----");
        console.error(responseText);
        console.error("----- Response Body End -----");

        throw new ApiError(
          `Invalid response format: ${parseError.message}. Check server configuration and API endpoints.`
        );
      }

      if (!response.ok) {
        // Handle API error responses
        console.error("API Error Response:", JSON.stringify(data, null, 2));

        // Special handling for workflow fetch errors (both 404 and 500 with specific message)
        if (data && data.error === "Failed to fetch workflow") {
          const errorMsg = `Failed to fetch workflow at ${url}, treating as not found.`;
          console.error(errorMsg);
          if (auth.verbose) {
            console.error(`Full response: ${responseText}`);
          }
          throw new NotFoundError(
            `Failed to fetch workflow. The workflow may not exist or the server encountered an internal error.`
          );
        }

        if (data && data.error) {
          // Handle standard error response format
          const errorResponse = data as ApiErrorResponse;
          throw new ApiError(
            `API error: ${errorResponse.error.message || "Unknown error"}${
              errorResponse.error.details
                ? ` - ${errorResponse.error.details}`
                : ""
            }`
          );
        } else {
          // If the error structure is not as expected, log the entire response
          throw new ApiError(
            `API error: ${response.status} ${
              response.statusText
            } - ${JSON.stringify(data)}`
          );
        }
      }

      return data as T;
    } catch (fetchError) {
      // Clear the timeout if we're encountering a different error
      clearTimeout(timeoutId);

      // Handle specific fetch errors
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        throw new NetworkError(`Request timed out after ${timeout}ms`);
      }

      throw fetchError;
    }
  } catch (error) {
    // Rethrow specific API error types so they can be handled specially
    if (error instanceof ApiError) {
      throw error;
    }

    console.error(
      `API Request Failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    // Network errors (fetch failures)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError(
        "Network error: Failed to connect to API server",
        error
      );
    }

    if (error instanceof Error) {
      throw new ApiError(error.message, error);
    } else {
      throw new ApiError(`Network request failed: ${String(error)}`);
    }
  }
}

/**
 * List all workflows
 */
export async function listWorkflows(
  auth: ApiAuth,
  params?: WorkflowListParams
): Promise<WorkflowListResponse> {
  try {
    return await apiRequest<WorkflowListResponse>(
      "/workflows",
      "GET",
      auth,
      params
    );
  } catch (error) {
    console.error("Failed to list workflows:", error);
    throw error;
  }
}

/**
 * Get details of a specific workflow
 */
export async function getWorkflowDetail(
  auth: ApiAuth,
  workflowId: string
): Promise<WorkflowDetail> {
  if (!workflowId) {
    throw new ApiError("Workflow ID is required");
  }

  console.log(`Fetching details for workflow ID: ${workflowId}`);
  try {
    const result = await apiRequest<WorkflowDetail>(
      `/workflows/${workflowId}`,
      "GET",
      auth
    );

    // Log the full response for debugging
    console.log(
      `Workflow detail response for ${workflowId}:`,
      JSON.stringify(result, null, 2)
    );

    // Log whether YAML content was found
    if (!result.yaml) {
      console.warn(`Warning: No YAML content found for workflow ${workflowId}`);
    } else {
      console.log(
        `Successfully retrieved YAML content for workflow ${workflowId}`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `Failed to get details for workflow ${workflowId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}
