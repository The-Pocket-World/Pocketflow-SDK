// Export socket connection functions
import { connectSocket } from "./socket/connect";
import { runWorkflow } from "./socket/workflow";

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

// Export everything
export {
  // Socket functions
  connectSocket,
  runWorkflow,

  // Default handlers
  defaultSocketConnectionHandler,
  defaultSocketDisconnectionHandler,
  defaultFeedbackRequestHandler,
  defaultWorkflowLogHandler,

  // Types
  SocketConnectionHandler,
  SocketDisconnectionHandler,
  FeedbackRequestHandler,
  GenerationCompleteHandler,
  GenerationUpdateHandler,
  WorkflowLogHandler,
  SocketConfig,
};
