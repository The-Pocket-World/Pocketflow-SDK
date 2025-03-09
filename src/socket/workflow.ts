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
  final_output: { type: string; data: any };

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
  final_output: (data) => {
    console.log(`🏁 Final Output (${data.type}):`, data.data);
  },
  // Add missing handlers that the tests expect
  workflow_received: () => {
    console.log(`📥 Workflow received by server`);
  },
  workflow_error: (data: any) => {
    console.error(`❌ Workflow Error: ${data.message || "Unknown error"}`);
    if (data.stack) console.error(`Stack: ${data.stack}`);
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
  final_output: () => {}, // No logging for final output
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
      console.warn(`\n┌─────────────────────────────────────┐`);
      console.warn(`│ 🟡 WORKFLOW COMPLETED WITH WARNINGS │`);
      console.warn(`└─────────────────────────────────────┘`);
      console.warn(data.message);
      if (data.errors) {
        console.warn(`\nErrors:`);
        data.errors.forEach((err, i) => {
          console.warn(`[${i + 1}] ${JSON.stringify(err)}`);
        });
      }
    } else {
      console.log(`\n┌─────────────────────────────────────┐`);
      console.log(`│ 🟢 WORKFLOW COMPLETED SUCCESSFULLY  │`);
      console.log(`└─────────────────────────────────────┘`);
      console.log(data.message);
    }
    console.log(`\nFinal State:`, JSON.stringify(data.state, null, 2));
  },
  run_start: (data) => {
    console.log(`\n┌─────────────────────────────────────┐`);
    console.log(`│ 🚀 WORKFLOW STARTED                 │`);
    console.log(`└─────────────────────────────────────┘`);
    console.log(data.message);
  },

  // Stream and node related events
  stream_output: (data) => {
    const icon = data.isError ? "❌" : "📤";
    console.log(`\n${icon} Stream Output from Node: ${data.node}`);
    console.log(`Type: ${data.type}`);
    console.log(`Action: ${data.action}`);
    console.log(`State:`, JSON.stringify(data.state, null, 2));
  },
  node_error: (data) => {
    console.error(`\n┌─────────────────────────────────────┐`);
    console.error(`│ ❌ NODE ERROR                       │`);
    console.error(`└─────────────────────────────────────┘`);
    console.error(`Node: ${data.node}`);
    console.error(`Error:`, data.error);
    console.error(`State:`, JSON.stringify(data.state, null, 2));
  },
  final_output: (data) => {
    console.log(`\n┌─────────────────────────────────────┐`);
    console.log(`│ 🏁 FINAL OUTPUT                     │`);
    console.log(`└─────────────────────────────────────┘`);
    console.log(`Type: ${data.type}`);
    console.log(`Data:`, JSON.stringify(data.data, null, 2));
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
    // Merge default and custom handlers
    // For each event type, remove any existing listeners and register the new one
    const eventTypes = Object.keys(
      baseHandlers
    ) as (keyof ServerEmittedEvents)[];

    // Register merged handlers for each event type
    eventTypes.forEach((eventType) => {
      const handler = handlers[eventType] || baseHandlers[eventType];

      if (handler) {
        try {
          // Remove any existing listener
          socket.removeAllListeners(eventType);

          // Add new listener
          socket.on(eventType, (data: any) => {
            try {
              handler(data);
            } catch (error) {
              console.error(`Error in ${eventType} handler:`, error);
            }
          });
        } catch (error) {
          console.error(
            `Failed to register handler for '${eventType}':`,
            error
          );
        }
      }
    });

    // Add event handlers for any custom handlers not in the default set
    Object.entries(handlers).forEach(([eventType, handler]) => {
      const eventName = eventType as keyof ServerEmittedEvents;
      if (!eventTypes.includes(eventName) && handler) {
        try {
          // Remove any existing listener
          socket.removeAllListeners(eventName);

          // Add new listener with error handling
          socket.on(eventName, (data: any) => {
            try {
              handler(data);
            } catch (error) {
              console.error(`Error in ${eventName} handler:`, error);
            }
          });
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
