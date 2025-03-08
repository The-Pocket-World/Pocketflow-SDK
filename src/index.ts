// Export socket connection functions
import { connectSocket, SocketConnectionError } from "./socket/connect";
import { runWorkflow, WorkflowError } from "./socket/workflow";

// Export workflow HTTP API functions
import { 
  listWorkflows, 
  getWorkflowDetail, 
  NotFoundError,
  ApiError,
  AuthenticationError,
  NetworkError
} from "./http/client";

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
  
  // Socket error classes
  SocketConnectionError,
  WorkflowError,

  // HTTP API functions
  listWorkflows,
  getWorkflowDetail,
  
  // HTTP API error classes
  NotFoundError,
  ApiError,
  AuthenticationError,
  NetworkError,

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
