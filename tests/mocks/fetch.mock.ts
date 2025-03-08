/**
 * Mock responses for the Fetch API
 */

// Mock data for workflow list response
export const mockWorkflowListResponse = {
  workflows: [
    {
      id: "wf_123456789",
      name: "Test Workflow 1",
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-02T00:00:00Z",
      prompt: "Test prompt 1",
      execution_count: 5,
      last_executed_at: "2023-01-03T00:00:00Z",
    },
    {
      id: "wf_987654321",
      name: "Test Workflow 2",
      created_at: "2023-01-04T00:00:00Z",
      updated_at: "2023-01-05T00:00:00Z",
      prompt: "Test prompt 2",
      execution_count: 10,
      last_executed_at: "2023-01-06T00:00:00Z",
    },
  ],
  meta: {
    total: 2,
    limit: 20,
    offset: 0,
  },
};

// Mock data for workflow detail response
export const mockWorkflowDetailResponse = {
  id: "wf_123456789",
  name: "Test Workflow 1",
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-02T00:00:00Z",
  prompt: "Test prompt 1",
  execution_count: 5,
  last_executed_at: "2023-01-03T00:00:00Z",
  yaml_path: "/workflows/wf_123456789/workflow.yaml",
  yaml: "name: Test Workflow\nprompt: Test prompt\nnodes:\n  - id: node1\n    type: input\n  - id: node2\n    type: output",
  nodes: [
    {
      id: "node1",
      name: "Input Node",
      type: "input",
    },
    {
      id: "node2",
      name: "Output Node",
      type: "output",
    },
  ],
};

// Mock error response
export const mockErrorResponse = {
  error: {
    code: "not_found",
    message: "Resource not found",
    details: "The requested resource could not be found",
  },
};

// Set up global fetch mock
export const setupFetchMock = () => {
  global.fetch = jest.fn();
};

// Reset fetch mock between tests
export const resetFetchMock = () => {
  (global.fetch as jest.Mock).mockReset();
};

// Mock successful fetch response
export const mockSuccessResponse = (data: any) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: new Map([["content-type", "application/json"]]),
    text: jest.fn().mockResolvedValueOnce(JSON.stringify(data)),
  });
};

/**
 * Mock a fetch response with an error status code and error details
 */
export const mockErrorResponseFn = (
  status: number,
  errorData: any = mockErrorResponse
): void => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: status,
    statusText: getStatusText(status),
    headers: new Map([["content-type", "application/json"]]),
    text: jest.fn().mockResolvedValueOnce(JSON.stringify(errorData)),
  });
};

// Helper function to get appropriate status text
function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    429: "Too Many Requests",
    500: "Internal Server Error",
    503: "Service Unavailable",
  };

  return statusMap[status] || "Error";
}
