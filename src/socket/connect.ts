import { io, Socket } from "socket.io-client";
import {
  SocketConnectionHandler,
  SocketDisconnectionHandler,
  FeedbackRequestHandler,
  GenerationCompleteHandler,
  GenerationUpdateHandler,
  WorkflowLogHandler,
  StreamOutputHandler,
} from "../types";
import {
  defaultSocketConnectionHandler,
  defaultSocketDisconnectionHandler,
  defaultFeedbackRequestHandler,
  defaultWorkflowLogHandler,
  defaultStreamOutputHandler,
} from "../handlers/defaultHandlers";
import { EventHandlers } from "./workflow";

/**
 * Error thrown when socket connection fails
 */
export class SocketConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "SocketConnectionError";

    // Maintain the prototype chain for instanceof checks
    Object.setPrototypeOf(this, SocketConnectionError.prototype);
  }
}

/**
 * Options for connecting to a socket server
 */
export interface SocketConnectionOptions {
  /**
   * Authentication token for the socket server
   */
  token?: string;

  /**
   * Function to handle workflow log messages
   */
  handleLog?: WorkflowLogHandler;

  /**
   * Function to handle feedback requests
   */
  handleFeedback?: FeedbackRequestHandler;

  /**
   * Function to handle stream output events
   */
  handleStreamOutput?: StreamOutputHandler;

  /**
   * Function to handle socket connection event
   */
  handleConnection?: SocketConnectionHandler;

  /**
   * Function to handle socket disconnection event
   */
  handleDisconnection?: SocketDisconnectionHandler;
}

/**
 * Connects to a socket server at the specified URL.
 * @param url The URL of the socket server to connect to. Defaults to 'api.pocketflow.ai'.
 * @param options Options for customizing the socket connection.
 * @returns A Promise that resolves with a Socket instance connected to the specified server.
 * @throws {SocketConnectionError} If the connection fails or times out
 */
export const connectSocket = async (
  url: string = "api.pocketflow.ai",
  options: SocketConnectionOptions = {}
): Promise<Socket> => {
  const {
    token,
    handleLog = defaultWorkflowLogHandler,
    handleFeedback = defaultFeedbackRequestHandler,
    handleStreamOutput = defaultStreamOutputHandler,
    handleConnection = defaultSocketConnectionHandler,
    handleDisconnection = defaultSocketDisconnectionHandler,
  } = options;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    // Parse the URL to check if it's valid
    new URL(url);
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error);
    throw new SocketConnectionError(
      `Invalid socket server URL: ${url}. Please provide a valid URL.`,
      error instanceof Error ? error : undefined
    );
  }

  // Configure socket connection options
  const socketOptions: any = {
    transports: ["polling", "websocket"], // Try both polling and websocket transport
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 30000, // 30 seconds timeout
    forceNew: true, // Force a new connection
    autoConnect: false,
  };

  // For localhost, we need to adjust the path and other options
  if (url.includes("localhost")) {
    // Try without a specific path first
    socketOptions.path = undefined;
    // Don't use extraHeaders for localhost as they might cause CORS issues
    socketOptions.extraHeaders = undefined;
  }

  // Add token to auth if provided
  if (token) {
    socketOptions.auth = {
      token: token,
    };
  } else {
    console.warn("No authentication token provided");
  }

  let socket: Socket;

  try {
    socket = io(url, socketOptions);
  } catch (error) {
    console.error(`Error creating socket:`, error);
    throw new SocketConnectionError(
      `Failed to create socket connection to ${url}`,
      error instanceof Error ? error : undefined
    );
  }

  // Add connection event handler
  socket.on("connect", () => {
    if (handleConnection) {
      handleConnection();
    }
  });

  // Add disconnect event handler with enhanced logging
  socket.on("disconnect", (reason) => {
    console.error(`Socket disconnected: ${reason}`, new Error().stack);
    console.error(
      `Disconnect details - Socket ID: ${socket.id}, Connected: ${socket.connected}, URL: ${url}`
    );
    if (handleDisconnection) {
      handleDisconnection(reason);
    }
  });

  // Add reconnect error event handler
  socket.on("reconnect_error", (error) => {
    console.error("Socket reconnect error:", error);
  });

  // Add reconnect failed event handler
  socket.on("reconnect_failed", () => {
    console.error("Socket reconnect failed after all attempts");

    // Force close the socket when reconnection fails
    try {
      socket.disconnect();
    } catch (error) {
      console.error("Error forcibly disconnecting socket:", error);
    }
  });

  // Add error event handler
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  // Add connect_error event handler
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    console.error("Connection details:", {
      url,
      socketId: socket.id,
      transportOptions: socket.io?.opts?.transports,
      auth: socketOptions.auth ? "Present" : "Missing",
    });
  });

  socket.on("connect_timeout", (timeout) => {
    console.error("Socket connect_timeout:", timeout);
  });

  socket.io.on("reconnect_attempt", (attemptNumber) => {
    console.log(`Socket reconnect attempt #${attemptNumber}`);
  });

  // Add log event handler
  socket.on("workflow_log", (data) => {
    handleLog(data);
  });

  // Set up stream output handler
  socket.on("stream_output", (data) => {
    handleStreamOutput(data);
  });

  // Set up feedback request handler
  socket.on("feedback_request", (data) => {
    try {
      const response = handleFeedback(data);
      if (response instanceof Promise) {
        response
          .then((input) => {
            socket.emit("feedback_response", { input });
          })
          .catch((error) => {
            console.error("Error in feedback response:", error);
            // Still try to send a feedback response to prevent hanging
            socket.emit("feedback_response", {
              input: null,
              error: error instanceof Error ? error.message : String(error),
            });
          });
      } else {
        socket.emit("feedback_response", { input: response });
      }
    } catch (error) {
      console.error("Error handling feedback request:", error);
      // Still try to send a feedback response to prevent hanging
      socket.emit("feedback_response", {
        input: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Connect to the socket server
  socket.connect();

  // Wait for the socket to connect or timeout
  try {
    await new Promise<void>((resolve, reject) => {
      // Set a timeout for connection
      const timeoutId = setTimeout(() => {
        reject(
          new SocketConnectionError(
            "Socket connection timed out after 10 seconds"
          )
        );
      }, 10000);

      // Handle successful connection
      socket.once("connect", () => {
        clearTimeout(timeoutId);
        resolve();
      });

      // Handle connection error
      socket.once("connect_error", (error) => {
        clearTimeout(timeoutId);
        reject(
          new SocketConnectionError(
            "Failed to connect to socket server",
            error instanceof Error ? error : undefined
          )
        );
      });
    });
  } catch (error) {
    // Make sure we clean up the socket on error
    try {
      socket.disconnect();
      socket.removeAllListeners();
    } catch (cleanupError) {
      console.error(
        "Error cleaning up socket after connection failure:",
        cleanupError
      );
    }

    // Rethrow the error
    throw error instanceof SocketConnectionError
      ? error
      : new SocketConnectionError(
          "Failed to establish socket connection",
          error instanceof Error ? error : undefined
        );
  }

  // Add a custom disconnect method that ensures complete cleanup
  const originalDisconnect = socket.disconnect;
  socket.disconnect = function () {
    // Remove all listeners to prevent memory leaks
    socket.removeAllListeners();

    // Call the original disconnect
    originalDisconnect.call(socket);

    console.log("Socket fully disconnected and cleaned up");
    return socket;
  };

  return socket;
};
