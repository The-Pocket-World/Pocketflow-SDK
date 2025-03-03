/**
 * Mock responses for the Fetch API
 */

// Mock workflow list response
export const mockWorkflowListResponse = {
  workflows: [
    {
      id: "wf_123456789",
      name: "Twitter Monitoring Posts",
      created_at: "2023-05-15T14:22:31Z",
      updated_at: "2023-05-16T09:11:45Z",
      prompt: "Create a workflow that monitors Twitter for new posts about AI",
      execution_count: 15,
      last_executed_at: "2023-05-16T09:11:45Z",
    },
    {
      id: "wf_987654321",
      name: "Email Newsletter Generator",
      created_at: "2023-05-10T09:15:22Z",
      updated_at: "2023-05-14T18:30:10Z",
      prompt: "Generate a weekly email newsletter from blog posts",
      execution_count: 8,
      last_executed_at: "2023-05-14T18:30:10Z",
    },
  ],
  meta: {
    total: 2,
    limit: 20,
    offset: 0,
  },
};

// Mock workflow detail response
export const mockWorkflowDetailResponse = {
  id: "wf_123456789",
  name: "Twitter Monitoring Posts",
  created_at: "2023-05-15T14:22:31Z",
  updated_at: "2023-05-16T09:11:45Z",
  prompt: "Create a workflow that monitors Twitter for new posts about AI",
  yaml_path: "flows/twitter_monitoring.yaml",
  nodes: [
    {
      id: "node_1",
      name: "FetchTwitterPosts",
      type: "twitter_fetcher",
    },
    {
      id: "node_2",
      name: "FilterRelevantPosts",
      type: "content_filter",
    },
  ],
  execution_count: 15,
  last_executed_at: "2023-05-16T09:11:45Z",
};

// Mock error response
export const mockErrorResponse = {
  error: {
    code: "not_found",
    message: "Workflow not found",
    details: "No workflow with ID wf_invalid was found",
  },
};

// Setup global fetch mock
export const setupFetchMock = () => {
  global.fetch = jest.fn();
};

// Reset fetch mock
export const resetFetchMock = () => {
  if (
    global.fetch &&
    typeof (global.fetch as jest.Mock).mockReset === "function"
  ) {
    (global.fetch as jest.Mock).mockReset();
  }
};

// Mock successful fetch response
export const mockSuccessResponse = (data: any) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
};

// Mock failed fetch response
export const mockErrorResponseFn = (status: number, errorData: any) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => errorData,
  });
};
