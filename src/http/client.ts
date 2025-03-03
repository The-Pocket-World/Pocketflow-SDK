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
// Remove trailing slash if present but don't add /v1
const BASE_URL = SERVER_URL.endsWith("/")
  ? SERVER_URL.slice(0, -1)
  : SERVER_URL;

// Always log the base URL for clarity
console.log(`PocketFlow SDK using API endpoint: ${BASE_URL}`);

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
   * List of nodes in the workflow
   */
  nodes: WorkflowNode[];
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
    throw new Error("Authentication required: Please provide an API key");
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

  const url = new URL(`${baseUrl}${path}`);

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

    // Local server uses /api prefix while production API uses /v1
    const apiPrefix = BASE_URL.includes("api.pocketflow.app") ? "/v1" : "/api";

    // Construct the full URL with the appropriate prefix
    const url = buildUrlWithParams(`${apiPrefix}${path}`, params);

    if (auth.verbose) {
      console.log(`API Request: ${method} ${url}`);
      console.log("Headers:", buildAuthHeaders(auth));
    }

    const response = await fetch(url, {
      method,
      headers: buildAuthHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });

    // First get the response as text
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      if (auth.verbose) {
        console.error("Failed to parse server response as JSON:");
        console.error("----- Response Body Start -----");
        console.error(responseText);
        console.error("----- Response Body End -----");
      }
      throw new Error(
        `Invalid response format: ${parseError.message}. Check server configuration and API endpoints.`
      );
    }

    if (!response.ok) {
      // Handle API error responses
      const errorResponse = data as ApiErrorResponse;
      throw new Error(
        `API error: ${errorResponse.error.message}${
          errorResponse.error.details ? ` - ${errorResponse.error.details}` : ""
        }`
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Network request failed: ${String(error)}`);
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
  return apiRequest<WorkflowListResponse>("/workflows", "GET", auth, params);
}

/**
 * Get details of a specific workflow
 */
export async function getWorkflowDetail(
  auth: ApiAuth,
  workflowId: string
): Promise<WorkflowDetail> {
  return apiRequest<WorkflowDetail>(`/workflows/${workflowId}`, "GET", auth);
}
