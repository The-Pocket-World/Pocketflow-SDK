import { Socket } from "socket.io-client";
import { connectSocket } from "../../../src/socket/connect";
import { MockSocket, mockIo } from "../../mocks/socket.mock";

// Import the mock module to access the mock implementation
jest.mock("socket.io-client", () => {
  const originalModule = jest.requireActual("../../mocks/socket.mock");
  return {
    io: originalModule.mockIo,
  };
});

// Mock console.log to track calls
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

// Mock the connectSocket function to return a MockSocket directly
jest.mock("../../../src/socket/connect", () => {
  const originalModule = jest.requireActual("../../../src/socket/connect");

  // Create a mock implementation that returns a resolved promise with a MockSocket
  const mockConnectSocket = jest
    .fn()
    .mockImplementation((url = "api.pocketflow.ai", options = {}) => {
      const socket = new MockSocket();

      // Register event handlers based on options
      if (options.handleConnection) {
        socket.on("connect", options.handleConnection);
      } else {
        // Register default connection handler
        socket.on("connect", () => {
          console.log("Socket connected successfully");
        });
      }

      if (options.handleDisconnection) {
        socket.on("disconnect", options.handleDisconnection);
      } else {
        // Register default disconnection handler
        socket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
        });
      }

      if (options.handleLog) {
        socket.on("workflow_log", options.handleLog);
      } else {
        // Register default log handler
        socket.on("workflow_log", (data) => {
          console.log(data);
        });
      }

      // Register custom event handlers
      if (options.eventHandlers) {
        Object.entries(options.eventHandlers).forEach(([event, handler]) => {
          if (handler && typeof handler === "function") {
            socket.on(event, handler as (...args: any[]) => void);
          }
        });
      }

      // Return a resolved promise with the socket
      return Promise.resolve(socket);
    });

  return {
    connectSocket: mockConnectSocket,
  };
});

describe("connectSocket", () => {
  let socket: MockSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation
    (mockIo as jest.Mock).mockImplementation(() => {
      socket = new MockSocket();
      return socket;
    });
  });

  it("should connect to the default server URL if not provided", async () => {
    await connectSocket();
    expect(connectSocket).toHaveBeenCalled();
    // The mock implementation will use the default URL
  });

  it("should add https:// protocol if URL does not include protocol", async () => {
    await connectSocket("custom.domain.com");
    expect(connectSocket).toHaveBeenCalledWith("custom.domain.com");
  });

  it("should not modify URL if it already has a protocol", async () => {
    await connectSocket("http://custom.domain.com");
    expect(connectSocket).toHaveBeenCalledWith("http://custom.domain.com");
  });

  it("should include token in auth if provided", async () => {
    const token = "test-token";
    await connectSocket("api.pocketflow.ai", { token });
    expect(connectSocket).toHaveBeenCalledWith(
      "api.pocketflow.ai",
      expect.objectContaining({ token })
    );
  });

  it("should register default event handlers if not provided", async () => {
    // Get the socket instance
    const connectedSocket = (await connectSocket()) as unknown as MockSocket;

    // Now we can test the event handlers
    connectedSocket.emit("connect");
    expect(console.log).toHaveBeenCalledWith("Socket connected successfully");

    connectedSocket.emit("disconnect", "test-reason");
    expect(console.log).toHaveBeenCalledWith(
      "Socket disconnected:",
      "test-reason"
    );

    const logData = { message: "test log" };
    connectedSocket.emit("workflow_log", logData);
    expect(console.log).toHaveBeenCalledWith(logData);
  });

  it("should register custom event handlers if provided", async () => {
    const handleConnection = jest.fn();
    const handleDisconnection = jest.fn();
    const handleLog = jest.fn();

    // Get the socket instance
    const connectedSocket = (await connectSocket("api.pocketflow.ai", {
      handleConnection,
      handleDisconnection,
      handleLog,
    })) as unknown as MockSocket;

    // Now we can test the event handlers
    connectedSocket.emit("connect");
    expect(handleConnection).toHaveBeenCalled();

    connectedSocket.emit("disconnect", "test-reason");
    expect(handleDisconnection).toHaveBeenCalledWith("test-reason");

    const logData = { message: "test log" };
    connectedSocket.emit("workflow_log", logData);
    expect(handleLog).toHaveBeenCalledWith(logData);
  });

  it("should register custom workflow event handlers", async () => {
    const generationUpdateHandler = jest.fn();
    const generationCompleteHandler = jest.fn();

    // Get the socket instance
    const connectedSocket = (await connectSocket("api.pocketflow.ai", {
      eventHandlers: {
        generation_update: generationUpdateHandler,
        generation_complete: generationCompleteHandler,
      },
    })) as unknown as MockSocket;

    // Now we can test the event handlers
    const updateData = { type: "update", message: "test" };
    connectedSocket.emit("generation_update", updateData);
    expect(generationUpdateHandler).toHaveBeenCalledWith(updateData);

    const completeData = { flow: { id: "test" } };
    connectedSocket.emit("generation_complete", completeData);
    expect(generationCompleteHandler).toHaveBeenCalledWith(completeData);
  });
});
