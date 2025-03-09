import { Socket } from "socket.io-client";

/**
 * Error thrown when a workflow operation fails
 */
export class WorkflowError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "WorkflowError";

    // Maintain the prototype chain for instanceof checks
    Object.setPrototypeOf(this, WorkflowError.prototype);
  }
}

/**
 * Interface for all events emitted by the server to clients
 */
export interface ServerEmittedEvents {
  // Workflow execution related events
  run_error: { message: string; stack?: string };
  run_warning: {
    message: string;
    errors: any[];
    state: Record<string, unknown>;
    warning: boolean;
  };
  run_complete: {
    message: string;
    state: Record<string, unknown>;
    warning: boolean;
    errors?: any[];
    output?: any;
  };
  run_start: { message: string };

  // Stream and node related events
  stream_output: {
    type: string;
    node: string;
    state: any;
    action: string;
    isError: boolean;
  };
  node_error: { node: string; error: any; state: any };

  // Add missing handlers that the tests expect
  workflow_received: { message?: string };
  workflow_error: { message: string; stack?: string };
}

/**
 * Type for event handlers that can be registered for workflow events
 */
export type EventHandlers = {
  [K in keyof ServerEmittedEvents]?: (data: ServerEmittedEvents[K]) => void;
};

/**
 * Default handlers for all server-emitted events
 */
export const defaultHandlers: EventHandlers = {
  // Workflow execution related events
  run_error: (data) => {
    console.error(`❌ Workflow Error: ${data.message}`);
    if (data.stack) console.error(`Stack: ${data.stack}`);
    // Socket disconnection will be handled by the wrapper in runWorkflow
  },
  run_warning: (data) => {
    console.warn(`⚠️ Workflow Warning: ${data.message}`);
    if (data.errors && data.errors.length > 0) {
      console.warn(`Errors:`, data.errors);
    }
  },
  run_complete: (data) => {
    if (data.warning || (data.errors && data.errors.length > 0)) {
      console.warn(`⚠️ Workflow Completed with warnings: ${data.message}`);
      if (data.errors) console.warn(`Errors:`, data.errors);
    } else {
      console.log(`✅ Workflow Completed: ${data.message}`);
    }
    // Socket disconnection will be handled by the wrapper in runWorkflow
  },
  run_start: (data) => {
    console.log(`🚀 Workflow Started: ${data.message}`);
  },

  // Stream and node related events
  stream_output: (data) => {
    const prefix = data.isError ? "❌ Error" : "📤 Output";
    console.log(
      `${prefix} from node '${data.node}' (${data.type}): ${data.action}`
    );
  },
  node_error: (data) => {
    console.error(`❌ Error in node '${data.node}':`, data.error);
  },
  workflow_received: () => {
    console.log(`📥 Workflow received by server`);
  },
  workflow_error: (data: any) => {
    console.error(`❌ Workflow Error: ${data.message || "Unknown error"}`);
    if (data.stack) console.error(`Stack: ${data.stack}`);
    // Socket disconnection will be handled by the wrapper in runWorkflow
  },
};

/**
 * Quiet handlers that minimize logging for non-critical events
 */
export const quietHandlers: EventHandlers = {
  // Workflow execution related events - only log errors and completion
  run_error: (data) => {
    console.error(`❌ Workflow Error: ${data.message}`);
  },
  run_warning: (data) => {
    // Only log warnings if they're serious enough to affect the result
    if (data.errors && data.errors.length > 0) {
      console.warn(`⚠️ Workflow Warning: ${data.message}`);
    }
  },
  run_complete: (data) => {
    if (data.warning || (data.errors && data.errors.length > 0)) {
      console.warn(`⚠️ Workflow Completed with warnings`);
    } else {
      console.log(`✅ Workflow Completed`);
    }
    // Log output data if available
    if (data.output) {
      console.log(`🏁 Output data:`, data.output);
    }
  },
  run_start: () => {}, // No logging for workflow start

  // No logging for stream outputs and node events unless it's an error
  stream_output: (data) => {
    if (data.isError) {
      console.error(`❌ Error from node '${data.node}': ${data.action}`);
    }
  },
  node_error: (data) => {
    console.error(`❌ Error in node '${data.node}'`);
  },
  workflow_received: () => {}, // No logging for workflow received
  workflow_error: (data: any) => {
    console.error(`❌ Workflow Error: ${data.message || "Unknown error"}`);
  },
};

/**
 * Pretty logging handlers that format the output in a more readable way
 */
export const prettyLogHandlers: EventHandlers = {
  // Workflow execution related events
  run_error: (data) => {
    console.error(`\n┌─────────────────────────────────────┐`);
    console.error(`│ 🔴 WORKFLOW ERROR                   │`);
    console.error(`└─────────────────────────────────────┘`);
    console.error(data.message);
    if (data.stack) {
      console.error(`\nStack Trace:`);
      console.error(data.stack);
    }
    // Socket disconnection will be handled by the wrapper in runWorkflow
  },
  run_warning: (data) => {
    console.warn(`\n┌─────────────────────────┐`);
    console.warn(`│ 🟠 WORKFLOW WARNING     │`);
    console.warn(`└─────────────────────────┘`);
    console.warn(data.message);
    if (data.errors && data.errors.length > 0) {
      console.warn(`\nErrors:`);
      data.errors.forEach((err, i) => {
        console.warn(`[${i + 1}] ${JSON.stringify(err)}`);
      });
    }
  },
  run_complete: (data) => {
    if (data.warning || (data.errors && data.errors.length > 0)) {
      console.warn(
        `⚠️ Workflow completed with warnings: ${
          data.message || "Unknown warning"
        }`
      );
      if (data.errors) {
        console.warn(`Errors:`, data.errors);
      }
    } else {
      console.log(`✅ Workflow completed: ${data.message || "Success"}`);
    }
    // Log output data if available
    if (data.output) {
      console.log(`🏁 Output:`, data.output);
    }
    // Socket disconnection will be handled by the wrapper in runWorkflow
  },
  run_start: (data) => {
    console.log(`🚀 Workflow started: ${data.message || "Starting workflow"}`);
  },

  // Stream and node related events
  stream_output: (data) => {
    // Choose an emoji based on isError flag
    const prefix = data.isError ? "❌" : "🔄";
    console.log(
      `${prefix} from node '${data.node}' (${data.type}): ${data.action}`
    );
  },
  node_error: (data) => {
    console.error(`❌ Error in node '${data.node}':`, data.error);
  },
  workflow_received: () => {
    console.log(`📥 Workflow received by server`);
  },
  workflow_error: (data: any) => {
    console.error(`❌ Workflow Error: ${data.message || "Unknown error"}`);
    if (data.stack) console.error(`Stack: ${data.stack}`);
  },
};

/**
 * Options for running a workflow
 */
export interface WorkflowRunnerOptions {
  /**
   * Custom event handlers for workflow events
   */
  handlers?: EventHandlers;

  /**
   * Whether to use pretty logging for events
   * @default false
   */
  prettyLogs?: boolean;

  /**
   * Whether to log the workflow execution details
   * @default false
   */
  verbose?: boolean;
}

/**
 * Runs a workflow with the given ID, auth token, and input.
 * @param socket The socket connection to use.
 * @param workflowId The ID of the workflow to run.
 * @param authToken The authentication token to use.
 * @param input The input to provide to the workflow.
 * @param options Options for customizing the workflow execution.
 * @throws {WorkflowError} If workflow configuration is invalid
 */
export const runWorkflow = (
  socket: Socket,
  workflowId: string,
  authToken: string,
  input: any,
  options: WorkflowRunnerOptions = {}
): void => {
  // Validate required parameters
  if (!socket) {
    throw new WorkflowError("Socket connection is required to run a workflow");
  }

  if (!workflowId) {
    throw new WorkflowError("Workflow ID is required");
  }

  if (!authToken) {
    throw new WorkflowError("Authentication token is required");
  }

  const { handlers = {}, prettyLogs = false, verbose = false } = options;

  // Get the appropriate base handlers
  let baseHandlers: EventHandlers;
  if (prettyLogs) {
    baseHandlers = prettyLogHandlers;
  } else if (verbose) {
    baseHandlers = defaultHandlers;
  } else {
    baseHandlers = quietHandlers;
  }

  try {
    // Clear any existing event handlers for the workflow events
    // This prevents duplicate handlers if the same socket is reused
    const eventTypes = Object.keys(
      baseHandlers
    ) as (keyof ServerEmittedEvents)[];
    eventTypes.forEach((eventType) => {
      try {
        socket.removeAllListeners(eventType);
      } catch (error) {
        console.error(
          `Failed to remove event listeners for ${eventType}:`,
          error
        );
      }
    });

    // Function to safely disconnect the socket
    const safeDisconnect = () => {
      try {
        if (
          socket &&
          typeof socket.disconnect === "function" &&
          socket.connected
        ) {
          console.log("Disconnecting socket after workflow completion");
          socket.disconnect();
        }
      } catch (error) {
        console.error("Error disconnecting socket:", error);
      }
    };

    // Register handlers for all event types
    eventTypes.forEach((eventType) => {
      const handler = handlers[eventType] || baseHandlers[eventType];

      if (handler) {
        try {
          // For events that should close the socket, add disconnect logic
          if (
            eventType === "run_complete" ||
            eventType === "run_error" ||
            eventType === "workflow_error"
          ) {
            // Create event-specific wrapper with socket disconnection
            socket.on(eventType, (data: any) => {
              try {
                // Call the original handler
                handler(data);
              } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
              } finally {
                // Always disconnect after these events
                safeDisconnect();
              }
            });
          } else {
            // Normal event handling without socket disconnection
            socket.on(eventType, (data: any) => {
              try {
                handler(data);
              } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
              }
            });
          }
        } catch (error) {
          console.error(
            `Failed to register handler for custom event '${eventType}':`,
            error
          );
        }
      }
    });

    // Add event handlers for any custom handlers not in the default set
    Object.entries(handlers).forEach(([customEventType, handler]) => {
      const eventName = customEventType as string;

      // Skip if the event was already handled in the previous loop
      if (!eventTypes.includes(eventName as any) && handler) {
        try {
          // Remove any existing listener
          socket.removeAllListeners(eventName);

          // Check if this is an event that should trigger socket disconnection
          if (
            eventName === "run_complete" ||
            eventName === "run_error" ||
            eventName === "workflow_error"
          ) {
            // Add event handler with socket disconnection
            socket.on(eventName, (data: any) => {
              try {
                handler(data);
              } catch (error) {
                console.error(`Error in custom ${eventName} handler:`, error);
              } finally {
                // Always disconnect after these events
                safeDisconnect();
              }
            });
          } else {
            // Normal event handling without socket disconnection
            socket.on(eventName, (data: any) => {
              try {
                handler(data);
              } catch (error) {
                console.error(`Error in custom ${eventName} handler:`, error);
              }
            });
          }
        } catch (error) {
          console.error(
            `Failed to register handler for custom event '${eventName}':`,
            error
          );
        }
      }
    });

    // Create payload for workflow run
    const payload = {
      flowId: workflowId,
      token: authToken,
      input: input || {},
    };

    // Log what we're about to do
    console.log("Emitting run_workflow event with payload:", {
      flowId: payload.flowId,
      hasInput: !!payload.input,
      hasToken: !!payload.token,
      socketId: socket.id,
      socketConnected: socket.connected,
    });

    // Emit run_workflow event to start the workflow
    socket.emit("run_workflow", payload, (ack: any) => {
      // Optional acknowledgment callback, helpful for debugging
      if (ack) {
        console.log(
          `Server acknowledged workflow run request: ${JSON.stringify(ack)}`
        );
      }
    });

    // Log immediately after emission to check if socket is still connected
    console.log(
      `After emitting run_workflow - Socket still connected: ${socket.connected}, ID: ${socket.id}`
    );
  } catch (error: any) {
    console.error(`Error emitting workflow event: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    if (handlers.run_error) {
      (handlers.run_error as any)({
        message: error.message,
        stack: error.stack,
      });
    } else {
      throw new WorkflowError(
        "Failed to start workflow execution",
        error instanceof Error ? error : undefined
      );
    }
  }
};
