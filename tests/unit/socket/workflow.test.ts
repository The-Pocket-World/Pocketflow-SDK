import { Socket } from "socket.io-client";
import {
  runWorkflow,
  defaultHandlers,
  ServerEmittedEvents,
  WorkflowError,
} from "../../../src/socket/workflow";
import { MockSocket } from "../../mocks/socket.mock";

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe("Workflow Module", () => {
  let mockSocket: MockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = new MockSocket();
  });

  describe("runWorkflow", () => {
    const workflowId = "test-workflow-id";
    const token = "test-token";
    const input = { testParam: "test-value" };

    it("should emit a run_workflow event with correct parameters", () => {
      // Spy on the socket.emit method
      const emitSpy = jest.spyOn(mockSocket, "emit");

      // Call the runWorkflow function
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input);

      // Verify the emit method was called with the correct parameters
      expect(emitSpy).toHaveBeenCalledWith(
        "run_workflow",
        expect.objectContaining({
          flowId: workflowId,
          token: token,
          input: input,
        })
      );
    });

    it("should register handlers for workflow events", () => {
      // Spy on the socket.on method
      const onSpy = jest.spyOn(mockSocket, "on");

      // Call the runWorkflow function
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input);

      // Check that handlers were registered for key events
      expect(onSpy).toHaveBeenCalledWith(
        "workflow_received",
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith(
        "workflow_error",
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith("run_error", expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith("run_complete", expect.any(Function));
    });

    it("should register custom handlers if provided in options", () => {
      // Create custom handlers
      const customRunCompleteHandler = jest.fn();
      const customRunErrorHandler = jest.fn();

      // Spy on the socket.on and removeAllListeners methods
      const onSpy = jest.spyOn(mockSocket, "on");
      const removeAllListenersSpy = jest.spyOn(
        mockSocket,
        "removeAllListeners"
      );

      // Call the runWorkflow function with custom handlers
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input, {
        handlers: {
          run_complete: customRunCompleteHandler,
          run_error: customRunErrorHandler,
        },
      });

      // Check that removeAllListeners was called for the events
      expect(removeAllListenersSpy).toHaveBeenCalledWith("run_complete");
      expect(removeAllListenersSpy).toHaveBeenCalledWith("run_error");

      // Verify that the custom handlers were registered
      // We need to check if the handler was registered by manually triggering the event
      if (mockSocket.eventHandlers["run_complete"]) {
        mockSocket.eventHandlers["run_complete"].forEach((handler) => {
          handler({ message: "test", state: {}, warning: false });
        });
      }
      expect(customRunCompleteHandler).toHaveBeenCalled();

      if (mockSocket.eventHandlers["run_error"]) {
        mockSocket.eventHandlers["run_error"].forEach((handler) => {
          handler({ message: "test error" });
        });
      }
      expect(customRunErrorHandler).toHaveBeenCalled();
    });

    it("should use default handlers for events not specified in custom handlers", () => {
      // Create a custom handler for just one event
      const customRunCompleteHandler = jest.fn();

      // Call the runWorkflow function with a custom handler for only one event
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input, {
        handlers: {
          run_complete: customRunCompleteHandler,
        },
      });

      // Verify that the custom handler was used for run_complete
      if (mockSocket.eventHandlers["run_complete"]) {
        mockSocket.eventHandlers["run_complete"].forEach((handler) => {
          handler({ message: "test", state: {}, warning: false });
        });
      }
      expect(customRunCompleteHandler).toHaveBeenCalled();

      // And that default handlers were used for other events
      // Trigger the run_error event to verify default handler is registered
      if (mockSocket.eventHandlers["run_error"]) {
        mockSocket.eventHandlers["run_error"].forEach((handler) => {
          handler({ message: "test error" });
        });
        // Verify console.error was called by the default handler
        expect(console.error).toHaveBeenCalled();
      }
    });

    it("should throw WorkflowError when socket is null", () => {
      expect(() => {
        runWorkflow(null as unknown as Socket, workflowId, token, input);
      }).toThrow(WorkflowError);
      expect(() => {
        runWorkflow(null as unknown as Socket, workflowId, token, input);
      }).toThrow("Socket connection is required");
    });

    it("should throw WorkflowError when workflowId is missing", () => {
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, "", token, input);
      }).toThrow(WorkflowError);
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, "", token, input);
      }).toThrow("Workflow ID is required");
    });

    it("should throw WorkflowError when token is missing", () => {
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, "", input);
      }).toThrow(WorkflowError);
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, "", input);
      }).toThrow("Authentication token is required");
    });

    it("should throw WorkflowError when socket.emit throws", () => {
      // Make the emit method throw an error
      mockSocket.emit = jest.fn().mockImplementation(() => {
        throw new Error("Emit error");
      });

      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, token, input);
      }).toThrow(WorkflowError);
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, token, input);
      }).toThrow("Failed to start workflow execution");
    });

    it("should catch errors in event handlers", () => {
      // Create a custom handler that throws an error
      const errorHandler = jest.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });

      // Run workflow with the error-prone handler
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input, {
        handlers: {
          run_error: errorHandler,
        },
      });

      // Trigger the run_error event
      if (mockSocket.eventHandlers["run_error"]) {
        mockSocket.eventHandlers["run_error"].forEach((handler) => {
          try {
            handler({ message: "test error" });
          } catch (error) {
            // Ignore errors here as we're testing the error handling
          }
        });
      }

      // Verify the error was caught and logged
      expect(errorHandler).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error in run_error handler"),
        expect.any(Error)
      );
    });

    it("should handle registration errors gracefully", () => {
      // Make removeAllListeners throw an error
      mockSocket.removeAllListeners = jest.fn().mockImplementation(() => {
        throw new Error("Registration error");
      });

      // Run workflow should not throw
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, token, input);
      }).not.toThrow();

      // Verify the error was caught and logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to register handler"),
        expect.any(Error)
      );
    });

    it("should handle undefined or null event handlers", () => {
      // Run workflow with an undefined handler
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, token, input, {
          handlers: {
            run_error: undefined,
          },
        });
      }).not.toThrow();

      // Run workflow with a null handler
      expect(() => {
        runWorkflow(mockSocket as unknown as Socket, workflowId, token, input, {
          handlers: {
            run_error: null as any,
          },
        });
      }).not.toThrow();
    });
  });

  describe("WorkflowError", () => {
    it("should create a WorkflowError with the correct name and message", () => {
      const error = new WorkflowError("Test error message");
      expect(error.name).toBe("WorkflowError");
      expect(error.message).toBe("Test error message");
      expect(error instanceof Error).toBe(true);
      expect(error instanceof WorkflowError).toBe(true);
    });

    it("should store the cause of the error", () => {
      const cause = new Error("Original error");
      const error = new WorkflowError("Wrapped error", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("defaultHandlers", () => {
    it("should have handlers for all server-emitted events", () => {
      // List of events we expect to have default handlers
      const expectedEvents: (keyof ServerEmittedEvents)[] = [
        "generation_error",
        "generation_update",
        "generation_complete",
        "run_error",
        "run_warning",
        "run_complete",
        "run_start",
        "stream_output",
        "node_error",
        "final_output",
        "workflow_received",
        "workflow_error",
      ];

      // Check that each event has a handler
      expectedEvents.forEach((event) => {
        expect(defaultHandlers[event]).toBeDefined();
        expect(typeof defaultHandlers[event]).toBe("function");
      });
    });
  });
});
