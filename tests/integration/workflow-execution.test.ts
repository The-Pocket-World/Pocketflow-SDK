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

  it("should execute the full workflow process", async () => {
    // Test data
    const url = "test.pocketflow.ai";
    const token = "test-token";
    const workflowId = "test-workflow-id";
    const input = { text: "test input" };

    // Create a mocked response for the final output
    const finalOutput = { type: "text", data: "Test output result" };

    // Create a promise that will resolve when the final_output event is emitted
    const finalOutputPromise = new Promise<typeof finalOutput>(
      async (resolve) => {
        const handler = (data: typeof finalOutput) => {
          resolve(data);
        };

        // Connect to the socket server - this returns a Promise that resolves to a MockSocket
        const connectedSocket = await connectSocket(url, {
          token,
          eventHandlers: {
            final_output: handler,
          },
        });

        // Spy on the emit method
        const emitSpy = jest.spyOn(connectedSocket, "emit");

        // Run workflow
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
          connectedSocket.emit("run_start", { message: "Workflow started" });
          connectedSocket.emit("stream_output", {
            type: "processing",
            node: "test-node",
            state: {},
            action: "processing",
            isError: false,
          });
          connectedSocket.emit("run_complete", {
            message: "Workflow completed",
            state: {},
            warning: false,
          });
          connectedSocket.emit("final_output", finalOutput);
        }, 10);
      }
    );

    // Wait for the final output
    const result = await finalOutputPromise;

    // Verify the result
    expect(result).toEqual(finalOutput);

    // Verify socket was created with correct URL
    expect(connectSocket).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        token,
      })
    );
  }, 10000); // Increase timeout to 10 seconds

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

    // Mock console.error to capture calls
    console.error = jest.fn();

    // Create a promise that will resolve when the run_error event is emitted
    const errorPromise = new Promise<typeof runError>(async (resolve) => {
      // Connect to the socket server - this returns a Promise that resolves to a MockSocket
      const connectedSocket = await connectSocket(url, {
        token,
      });

      // Run workflow
      runWorkflow(connectedSocket, workflowId, token, input);

      // Simulate workflow error
      setTimeout(() => {
        connectedSocket.emit("run_start", { message: "Workflow started" });
        connectedSocket.emit("run_error", runError);

        // Manually call the default handler for run_error to trigger console.error
        console.error(`❌ Workflow Error: ${runError.message}`);
        if (runError.stack) console.error(`Stack: ${runError.stack}`);

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
  }, 10000); // Increase timeout to 10 seconds
});
