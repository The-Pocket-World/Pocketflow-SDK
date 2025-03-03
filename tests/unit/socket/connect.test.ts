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

  it("should connect to the default server URL if not provided", () => {
    connectSocket();
    expect(mockIo).toHaveBeenCalledWith(
      "https://api.pocketflow.ai",
      expect.any(Object)
    );
  });

  it("should add https:// protocol if URL does not include protocol", () => {
    connectSocket("custom.domain.com");
    expect(mockIo).toHaveBeenCalledWith(
      "https://custom.domain.com",
      expect.any(Object)
    );
  });

  it("should not modify URL if it already has a protocol", () => {
    connectSocket("http://custom.domain.com");
    expect(mockIo).toHaveBeenCalledWith(
      "http://custom.domain.com",
      expect.any(Object)
    );
  });

  it("should include token in auth if provided", () => {
    const token = "test-token";
    connectSocket("api.pocketflow.ai", { token });
    expect(mockIo).toHaveBeenCalledWith(
      "https://api.pocketflow.ai",
      expect.objectContaining({
        auth: { token },
      })
    );
  });

  it("should register default event handlers if not provided", () => {
    const socket = connectSocket() as unknown as MockSocket;

    // Trigger events and check if default handlers are called
    socket.emit("connect");
    expect(console.log).toHaveBeenCalledWith("Socket connected successfully");

    socket.emit("disconnect", "test-reason");
    expect(console.log).toHaveBeenCalledWith(
      "Socket disconnected:",
      "test-reason"
    );

    const logData = { message: "test log" };
    socket.emit("workflow_log", logData);
    expect(console.log).toHaveBeenCalledWith(logData);
  });

  it("should register custom event handlers if provided", () => {
    const handleConnection = jest.fn();
    const handleDisconnection = jest.fn();
    const handleLog = jest.fn();

    const socket = connectSocket("api.pocketflow.ai", {
      handleConnection,
      handleDisconnection,
      handleLog,
    }) as unknown as MockSocket;

    // Trigger events and check if custom handlers are called
    socket.emit("connect");
    expect(handleConnection).toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalledWith(
      "Socket connected successfully"
    );

    socket.emit("disconnect", "test-reason");
    expect(handleDisconnection).toHaveBeenCalledWith("test-reason");

    const logData = { message: "test log" };
    socket.emit("workflow_log", logData);
    expect(handleLog).toHaveBeenCalledWith(logData);
  });

  it("should register custom workflow event handlers", () => {
    const generationUpdateHandler = jest.fn();
    const generationCompleteHandler = jest.fn();

    const socket = connectSocket("api.pocketflow.ai", {
      eventHandlers: {
        generation_update: generationUpdateHandler,
        generation_complete: generationCompleteHandler,
      },
    }) as unknown as MockSocket;

    // Trigger events and check if custom handlers are called
    const updateData = { type: "update", message: "test" };
    socket.emit("generation_update", updateData);
    expect(generationUpdateHandler).toHaveBeenCalledWith(updateData);

    const completeData = { flow: { id: "test" } };
    socket.emit("generation_complete", completeData);
    expect(generationCompleteHandler).toHaveBeenCalledWith(completeData);
  });
});
