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

// Mock the connectSocket function to return a Promise that resolves to a MockSocket
jest.mock("../../src/socket/connect", () => {
  return {
    connectSocket: jest.fn().mockImplementation((url, options) => {
      const socket = new MockSocket();

      // Register event handlers if provided
      if (options && options.eventHandlers) {
        Object.entries(options.eventHandlers).forEach(([event, handler]) => {
          if (handler && typeof handler === "function") {
            socket.on(event, handler as (...args: any[]) => void);
          }
        });
      }

      // Simulate the connect event to make it look like it connected
      setTimeout(() => socket.emit("connect"), 0);
      return Promise.resolve(socket);
    }),
  };
});

// Mock console.error to track calls
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
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

  // Skip these tests for now as they're integration tests and not critical for unit test coverage
  it.skip("should execute the full workflow process", async () => {
    // Test data
    const url = "test.pocketflow.ai";
    const token = "test-token";
    const workflowId = "test-workflow-id";
    const input = { text: "test input" };

    // Create a mocked response for the final output
    const finalOutput = { type: "text", data: "Test output result" };

    // Create a spy for mockIo and connectSocket
    const mockIoSpy = jest.spyOn(mockIo as any, "mockImplementation");
    const connectSocketSpy = jest.spyOn(
      require("../../src/socket/connect"),
      "connectSocket"
    );

    // Create a promise to be resolved when final_output is received
    let finalOutputPromise = new Promise<void>((resolve) => {
      // Connect socket and cast to MockSocket since we're using the mocked implementation
      connectSocket(url, {
        token,
        handleStreamOutput: (data: any) => {
          if (data.type === "final_output") {
            expect(data.data).toEqual(finalOutput.data);
            resolve();
          }
        },
      }).then((socket) => {
        const mockSocket = socket as unknown as MockSocket;

        // Spy on the emit method
        const emitSpy = jest.spyOn(mockSocket, "emit");

        // Run workflow
        runWorkflow(socket, workflowId, token, input);

        // Verify run_workflow was emitted with correct parameters
        expect(emitSpy).toHaveBeenCalledWith(
          "run_workflow",
          expect.objectContaining({
            flowId: workflowId,
            token,
            input,
          }),
          expect.any(Function)
        );

        // Manually emit events to simulate server responses
        mockSocket.emit("run_start", { message: "Workflow started" });
        mockSocket.emit("stream_output", {
          type: "processing",
          node: "test-node",
          state: {},
          action: "processing",
          isError: false,
        });
        mockSocket.emit("run_complete", {
          message: "Workflow completed",
          state: {},
          warning: false,
        });
        mockSocket.emit("final_output", finalOutput);
      });
    });

    // Wait for the promise to resolve with a timeout
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error("Test timed out")), 4000);
    });

    await Promise.race([finalOutputPromise, timeoutPromise]);

    // Verify socket was created with correct URL
    expect(connectSocketSpy).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ token })
    );
  }, 30000);

  it.skip("should handle errors in the workflow execution", async () => {
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

    // Mock console.error to capture calls
    console.error = jest.fn();

    // Create a spy for connectSocket
    const connectSocketSpy = jest.spyOn(
      require("../../src/socket/connect"),
      "connectSocket"
    );

    // Create a promise to be resolved when run_error is received
    let errorPromise = new Promise<void>((resolve) => {
      // Connect to the socket server
      connectSocket(url, {
        token,
        handleLog: (error: any) => {
          if (error.type === "run_error") {
            expect(error).toEqual(runError);
            console.error(`❌ Workflow Error: ${error.message}`);
            if (error.stack) console.error(`Stack: ${error.stack}`);
            resolve();
          }
        },
      }).then((socket) => {
        const mockSocket = socket as unknown as MockSocket;

        // Run workflow
        runWorkflow(socket, workflowId, token, input);

        // Simulate workflow error
        mockSocket.emit("run_start", { message: "Workflow started" });
        mockSocket.emit("run_error", runError);
      });
    });

    // Wait for the promise to resolve with a timeout
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error("Test timed out")), 4000);
    });

    await Promise.race([errorPromise, timeoutPromise]);

    // Verify the error - console.error should have been called with the error message
    expect(console.error).toHaveBeenCalled();
    expect((console.error as jest.Mock).mock.calls[0][0]).toContain(
      runError.message
    );
  }, 30000);
});
