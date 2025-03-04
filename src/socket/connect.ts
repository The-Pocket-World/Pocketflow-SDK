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
 * Options for connecting to a socket server
 */
export interface SocketConnectionOptions {
  /**
   * Authentication token for the socket server
   */
  token?: string;

  /**
   * Custom event handlers for workflow events
   */
  eventHandlers?: EventHandlers;

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
 */
export const connectSocket = async (
  url: string = "api.pocketflow.ai",
  options: SocketConnectionOptions = {}
): Promise<Socket> => {
  const {
    token,
    eventHandlers = {},
    handleLog = defaultWorkflowLogHandler,
    handleFeedback = defaultFeedbackRequestHandler,
    handleStreamOutput = defaultStreamOutputHandler,
    handleConnection = defaultSocketConnectionHandler,
    handleDisconnection = defaultSocketDisconnectionHandler,
  } = options;

  // Ensure the URL has a protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    // Parse the URL to check if it's valid
    new URL(url);
  } catch (error) {
    console.error(`Invalid URL: ${url}`, error);
  }

  // Configure socket connection options
  const socketOptions: any = {
    transports: ["polling"],
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
    return Promise.reject(error);
  }

  // Add connection event handler
  socket.on("connect", () => {
    if (handleConnection) {
      handleConnection();
    }
  });

  // Add disconnect event handler
  socket.on("disconnect", (reason) => {
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
    const response = handleFeedback(data);
    if (response instanceof Promise) {
      response.then((input) => {
        socket.emit("feedback_response", { input });
      });
    } else {
      socket.emit("feedback_response", { input: response });
    }
  });

  // Register all event handlers from ServerEmittedEvents
  Object.entries(eventHandlers).forEach(([event, handler]) => {
    if (handler !== undefined && handler !== null) {
      socket.on(event, (data) => {
        (handler as any)(data);
      });
    }
  });

  // Connect to the socket server
  socket.connect();

  // Wait for the socket to connect or timeout
  await new Promise<void>((resolve, reject) => {
    // Set a timeout for connection
    const timeoutId = setTimeout(() => {
      reject(new Error("Socket connection timed out after 10 seconds"));
    }, 10000);

    // Handle successful connection
    socket.once("connect", () => {
      clearTimeout(timeoutId);
      resolve();
    });

    // Handle connection error
    socket.once("connect_error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });

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
