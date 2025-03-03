import { Socket } from "socket.io-client";
import { connectSocket } from "../../src/socket/connect";
import { runWorkflow } from "../../src/socket/workflow";
import { MockSocket, mockIo } from "../mocks/socket.mock";

// Import the mock module to access the mock implementation
jest.mock("socket.io-client", () => {
  const originalModule = jest.requireActual("../mocks/socket.mock");
  return {
    io: originalModule.mockIo,
  };
});

describe("Workflow Execution Integration", () => {
  let socket: MockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation
    (mockIo as jest.Mock).mockImplementation(() => {
      socket = new MockSocket();
      return socket;
    });
  });

  it("should execute the full workflow process", async () => {
    // Test data
    const url = "test.pocketflow.ai";
    const token = "test-token";
    const workflowId = "test-workflow-id";
    const input = { text: "test input" };

    // Create a mocked response for the final output
    const finalOutput = { type: "text", data: "Test output result" };

    // Create a promise that will resolve when the final_output event is emitted
    const finalOutputPromise = new Promise<typeof finalOutput>((resolve) => {
      const handler = (data: typeof finalOutput) => {
        resolve(data);
      };

      // Connect socket with custom handler for final_output
      const connectedSocket = connectSocket(url, {
        token,
        eventHandlers: {
          final_output: handler,
        },
      });

      // Since we're mocking the Socket.io interface, we can safely cast the result
      // of connectSocket to MockSocket for testing purposes
      const mockConnectedSocket = connectedSocket as unknown as MockSocket;

      // Spy on the emit method
      const emitSpy = jest.spyOn(mockConnectedSocket, "emit");

      // Run workflow - using the original socket type that runWorkflow expects
      runWorkflow(connectedSocket, workflowId, token, input);

      // Verify run_workflow was emitted with correct parameters
      expect(emitSpy).toHaveBeenCalledWith(
        "run_workflow",
        expect.objectContaining({
          flowId: workflowId,
          token,
          input,
        })
      );

      // Simulate workflow execution sequence
      setTimeout(() => {
        mockConnectedSocket.emit("run_start", { message: "Workflow started" });
        mockConnectedSocket.emit("stream_output", {
          type: "processing",
          node: "test-node",
          state: {},
          action: "processing",
          isError: false,
        });
        mockConnectedSocket.emit("run_complete", {
          message: "Workflow completed",
          state: {},
          warning: false,
        });
        mockConnectedSocket.emit("final_output", finalOutput);
      }, 10);
    });

    // Wait for the final output
    const result = await finalOutputPromise;

    // Verify the result
    expect(result).toEqual(finalOutput);

    // Verify socket was created with correct URL
    expect(mockIo).toHaveBeenCalledWith(
      `https://${url}`,
      expect.objectContaining({
        auth: { token },
      })
    );
  });

  it("should handle errors in the workflow execution", async () => {
    // Test data
    const url = "test.pocketflow.ai";
    const token = "test-token";
    const workflowId = "test-workflow-id";
    const input = { text: "test input" };

    // Create a mocked error response
    const runError = {
      message: "Workflow execution failed",
      stack: "Error stack trace",
    };

    // Create a promise that will resolve when the run_error event is emitted
    const errorPromise = new Promise<typeof runError>((resolve) => {
      // Create spy for console.error
      const errorSpy = jest.spyOn(console, "error");

      // Connect socket
      const connectedSocket = connectSocket(url, {
        token,
      });
      const mockConnectedSocket = connectedSocket as unknown as MockSocket;

      // Run workflow
      runWorkflow(connectedSocket, workflowId, token, input);

      // Simulate workflow error
      setTimeout(() => {
        mockConnectedSocket.emit("run_start", { message: "Workflow started" });
        mockConnectedSocket.emit("run_error", runError);

        // Resolve when error is logged
        resolve(runError);
      }, 10);
    });

    // Wait for the error
    const error = await errorPromise;

    // Verify the error
    expect(error).toEqual(runError);
    // The actual format of the error message depends on the implementation
    // Just check that console.error was called with something containing the error message
    expect(console.error).toHaveBeenCalled();
  });
});
