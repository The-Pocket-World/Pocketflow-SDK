import { Socket } from "socket.io-client";
import {
  runWorkflow,
  defaultHandlers,
  ServerEmittedEvents,
} from "../../../src/socket/workflow";
import { MockSocket } from "../../mocks/socket.mock";

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
        }),
        expect.any(Function)
      );
    });

    it("should register default handlers if not provided in options", () => {
      // Spy on the socket.on method
      const onSpy = jest.spyOn(mockSocket, "on");

      // Call the runWorkflow function
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input);

      // Check some of the default handlers were registered
      expect(onSpy).toHaveBeenCalledWith(
        "workflow_received",
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith(
        "workflow_error",
        expect.any(Function)
      );
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

      // Check the custom handlers were registered
      expect(onSpy).toHaveBeenCalledWith(
        "run_complete",
        customRunCompleteHandler
      );
      expect(onSpy).toHaveBeenCalledWith("run_error", customRunErrorHandler);
    });

    it("should use default handlers for events not specified in custom handlers", () => {
      // Create a custom handler for just one event
      const customRunCompleteHandler = jest.fn();

      // Spy on the socket.on method
      const onSpy = jest.spyOn(mockSocket, "on");

      // Call the runWorkflow function with a custom handler for only one event
      runWorkflow(mockSocket as unknown as Socket, workflowId, token, input, {
        handlers: {
          run_complete: customRunCompleteHandler,
        },
      });

      // Check the custom handler was used for run_complete
      expect(onSpy).toHaveBeenCalledWith(
        "run_complete",
        customRunCompleteHandler
      );

      // And that default handlers were used for other events
      expect(onSpy).toHaveBeenCalledWith(
        "workflow_received",
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith(
        "workflow_error",
        expect.any(Function)
      );
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
      ];

      // Check that each event has a handler
      expectedEvents.forEach((event) => {
        expect(defaultHandlers[event]).toBeDefined();
        expect(typeof defaultHandlers[event]).toBe("function");
      });
    });

    // Testing a couple of the default handlers
    it("should log error message for generation_error handler", () => {
      const errorData = { message: "test error message" };
      defaultHandlers.generation_error!(errorData);
      // The actual format might include emoji or formatting
      expect(console.error).toHaveBeenCalled();
      // Check that the error message is included in the log
      const calls = (console.error as jest.Mock).mock.calls;
      const loggedMessage = calls[0][0];
      expect(loggedMessage).toContain(errorData.message);
    });

    it("should log message for run_start handler", () => {
      const startData = { message: "Workflow started" };
      defaultHandlers.run_start!(startData);
      // The actual format might include emoji or formatting
      expect(console.log).toHaveBeenCalled();
      // Check that the start message is included in the log
      const calls = (console.log as jest.Mock).mock.calls;
      const loggedMessage = calls[0][0];
      expect(loggedMessage).toContain(startData.message);
    });
  });
});
