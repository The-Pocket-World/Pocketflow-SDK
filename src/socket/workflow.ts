import { Socket } from "socket.io-client";

/**
 * Interface for all events emitted by the server to clients
 */
export interface ServerEmittedEvents {
  // Generation related events
  generation_error: { message: string };
  generation_update: { type: string; message: string };
  generation_complete: { flow: any };

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
  // Generation related events - minimal handling as these are not the focus
  generation_error: (data) =>
    console.error(`Generation Error: ${data.message}`),
  generation_update: () => {}, // No-op as requested
  generation_complete: () => {}, // No-op as requested

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
};

/**
 * Pretty logging handlers that format the output in a more readable way
 */
export const prettyLogHandlers: EventHandlers = {
  // Generation related events - minimal handling as these are not the focus
  generation_error: (data) => {
    console.error(`\n┌─────────────────────────────────────┐`);
    console.error(`│ 🔴 GENERATION ERROR                  │`);
    console.error(`└─────────────────────────────────────┘`);
    console.error(data.message);
  },
  generation_update: () => {}, // No-op as requested
  generation_complete: () => {}, // No-op as requested

  // Workflow execution related events
  run_error: (data) => {
    console.error(`\n┌─────────────────────────────────────┐`);
    console.error(`│ 🔴 WORKFLOW ERROR                    │`);
    console.error(`└─────────────────────────────────────┘`);
    console.error(data.message);
    if (data.stack) {
      console.error(`\nStack Trace:`);
      console.error(data.stack);
    }
  },
  run_warning: (data) => {
    console.warn(`\n┌─────────────────────────────────────┐`);
    console.warn(`│ 🟠 WORKFLOW WARNING                  │`);
    console.warn(`└─────────────────────────────────────┘`);
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
      console.warn(`│ 🟡 WORKFLOW COMPLETED WITH WARNINGS  │`);
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
      console.log(`│ 🟢 WORKFLOW COMPLETED SUCCESSFULLY   │`);
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
    console.error(`│ ❌ NODE ERROR                        │`);
    console.error(`└─────────────────────────────────────┘`);
    console.error(`Node: ${data.node}`);
    console.error(`Error:`, data.error);
    console.error(`State:`, JSON.stringify(data.state, null, 2));
  },
  final_output: (data) => {
    console.log(`\n┌─────────────────────────────────────┐`);
    console.log(`│ 🏁 FINAL OUTPUT                      │`);
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
   * @default true
   */
  verbose?: boolean;
}

/**
 * Runs a workflow with the specified ID and input.
 * @param socket The socket instance to use for running the workflow.
 * @param workflowId The ID of the workflow to run.
 * @param token The authentication token to use.
 * @param input The input data for the workflow.
 * @param options Options for customizing the workflow execution.
 * @returns A cleanup function to remove all event listeners.
 */
export const runWorkflow = (
  socket: Socket,
  workflowId: string,
  token: string,
  input: any,
  options: WorkflowRunnerOptions = {}
) => {
  const { handlers = {}, prettyLogs = false, verbose = true } = options;

  // Determine which base handlers to use
  const baseHandlers = prettyLogs ? prettyLogHandlers : defaultHandlers;

  // Merge default handlers with custom handlers
  const mergedHandlers: EventHandlers = { ...baseHandlers, ...handlers };

  if (verbose) {
    console.log(`Running workflow: ${workflowId}`);
    console.log(`Input:`, JSON.stringify(input, null, 2));
  }

  // Register all event handlers
  const registeredEvents: string[] = [];

  Object.entries(mergedHandlers).forEach(([event, handler]) => {
    if (handler) {
      socket.on(event, handler as any);
      registeredEvents.push(event);
    }
  });

  // Emit the run_workflow event
  socket.emit("run_workflow", {
    flowId: workflowId,
    token: token,
    input: input,
  });

  // Return a cleanup function to remove all event listeners
  return () => {
    registeredEvents.forEach((event) => {
      socket.off(event);
    });

    if (verbose) {
      console.log(`Cleaned up event listeners for workflow: ${workflowId}`);
    }
  };
};
