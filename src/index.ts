// Export socket connection functions
import { connectSocket } from "./socket/connect";
import { runWorkflow } from "./socket/workflow";

// Export workflow HTTP API functions
import { listWorkflows, getWorkflowDetail, NotFoundError } from "./http/client";

// Export CLI functionality
import * as cli from "./cli";

// Export default handlers
import {
  defaultSocketConnectionHandler,
  defaultSocketDisconnectionHandler,
  defaultFeedbackRequestHandler,
  defaultWorkflowLogHandler,
} from "./handlers/defaultHandlers";

// Export types
import {
  SocketConnectionHandler,
  SocketDisconnectionHandler,
  FeedbackRequestHandler,
  GenerationCompleteHandler,
  GenerationUpdateHandler,
  WorkflowLogHandler,
  SocketConfig,
} from "./types";

// Export HTTP API types
import {
  ApiAuth,
  WorkflowListParams,
  WorkflowSummary,
  WorkflowDetail,
  WorkflowListResponse,
  PaginationParams,
  PaginationMeta,
  WorkflowNode,
} from "./http/client";

// Export everything
export {
  // Socket functions
  connectSocket,
  runWorkflow,

  // HTTP API functions
  listWorkflows,
  getWorkflowDetail,
  NotFoundError,

  // CLI functionality
  cli,

  // Default handlers
  defaultSocketConnectionHandler,
  defaultSocketDisconnectionHandler,
  defaultFeedbackRequestHandler,
  defaultWorkflowLogHandler,

  // Socket Types
  SocketConnectionHandler,
  SocketDisconnectionHandler,
  FeedbackRequestHandler,
  GenerationCompleteHandler,
  GenerationUpdateHandler,
  WorkflowLogHandler,
  SocketConfig,

  // HTTP API Types
  ApiAuth,
  WorkflowListParams,
  WorkflowSummary,
  WorkflowDetail,
  WorkflowListResponse,
  PaginationParams,
  PaginationMeta,
  WorkflowNode,
};
