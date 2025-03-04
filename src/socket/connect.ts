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
  console.log("=== DEBUG: connectSocket called ===");
  console.log(`DEBUG: Original URL: ${url}`);

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
    console.log(`DEBUG: Added https protocol to URL: ${url}`);
  }

  console.log(`DEBUG: Connecting to socket server at: ${url}`);

  try {
    // Parse the URL to check if it's valid
    const parsedUrl = new URL(url);
    console.log(
      `DEBUG: Parsed URL - Protocol: ${parsedUrl.protocol}, Host: ${parsedUrl.host}, Path: ${parsedUrl.pathname}`
    );
  } catch (error) {
    console.error(`DEBUG: Invalid URL: ${url}`, error);
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
    console.log(`DEBUG: Configuring for localhost connection`);
    // Try without a specific path first
    socketOptions.path = undefined;
    // Don't use extraHeaders for localhost as they might cause CORS issues
    socketOptions.extraHeaders = undefined;
  }

  console.log(
    `DEBUG: Socket options: ${JSON.stringify(socketOptions, null, 2)}`
  );

  // Add token to auth if provided
  if (token) {
    socketOptions.auth = {
      token: token,
    };
    console.log(
      `DEBUG: Authentication token provided (length: ${token.length})`
    );
    // Log the first and last few characters of the token for debugging
    if (token.length > 10) {
      console.log(
        `DEBUG: Token starts with: ${token.substring(
          0,
          4
        )}... ends with: ...${token.substring(token.length - 4)}`
      );
    }
  } else {
    console.warn("DEBUG: No authentication token provided");
  }

  console.log(`DEBUG: Creating socket connection to: ${url}`);
  let socket: Socket;

  try {
    socket = io(url, socketOptions);
    console.log(`DEBUG: Socket instance created`);
  } catch (error) {
    console.error(`DEBUG: Error creating socket:`, error);
    return Promise.reject(error);
  }

  // Add connection event handler
  socket.on("connect", () => {
    console.log("DEBUG: Socket connected");
    if (handleConnection) {
      handleConnection();
    }
  });

  // Add disconnect event handler
  socket.on("disconnect", (reason) => {
    console.log(`DEBUG: Socket disconnected: ${reason}`);
    if (handleDisconnection) {
      handleDisconnection(reason);
    }
  });

  // Add reconnect event handler
  socket.on("reconnect", (attemptNumber) => {
    console.log(`DEBUG: Socket reconnected after ${attemptNumber} attempts`);
  });

  // Add reconnect attempt event handler
  socket.on("reconnect_attempt", (attemptNumber) => {
    console.log(`DEBUG: Socket reconnect attempt #${attemptNumber}`);
  });

  // Add reconnect error event handler
  socket.on("reconnect_error", (error) => {
    console.error("DEBUG: Socket reconnect error:", error);
  });

  // Add reconnect failed event handler
  socket.on("reconnect_failed", () => {
    console.error("DEBUG: Socket reconnect failed after all attempts");

    // Force close the socket when reconnection fails
    try {
      socket.disconnect();
      console.log(
        "DEBUG: Socket forcibly disconnected after reconnection failure"
      );
    } catch (error) {
      console.error("DEBUG: Error forcibly disconnecting socket:", error);
    }
  });

  // Add error event handler
  socket.on("error", (error) => {
    console.error("DEBUG: Socket error:", error);
  });

  // Add log event handler
  socket.on("workflow_log", (data) => {
    console.log(`DEBUG: Received workflow_log event:`, data);
    handleLog(data);
  });

  // Set up stream output handler
  socket.on("stream_output", (data) => {
    console.log(`DEBUG: Received stream_output event:`, data);
    handleStreamOutput(data);
  });

  // Set up feedback request handler
  socket.on("feedback_request", (data) => {
    console.log(`DEBUG: Received feedback_request event:`, data);
    const response = handleFeedback(data);
    if (response instanceof Promise) {
      response.then((input) => {
        console.log(`DEBUG: Sending feedback_response:`, input);
        socket.emit("feedback_response", { input });
      });
    } else {
      console.log(`DEBUG: Sending feedback_response:`, response);
      socket.emit("feedback_response", { input: response });
    }
  });

  // Register all event handlers from ServerEmittedEvents
  Object.entries(eventHandlers).forEach(([event, handler]) => {
    if (handler !== undefined && handler !== null) {
      console.log(`DEBUG: Registering handler for event: ${event}`);
      socket.on(event, (data) => {
        console.log(`DEBUG: Received ${event} event:`, data);
        (handler as any)(data);
      });
    }
  });

  // Connect to the socket server
  console.log("DEBUG: Connecting to socket server...");
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
    console.log("DEBUG: Enhanced disconnect called");

    // Remove all listeners to prevent memory leaks
    socket.removeAllListeners();

    // Call the original disconnect
    originalDisconnect.call(socket);

    // Don't call socket.close() as it causes infinite recursion
    // if (typeof socket.close === 'function') {
    //   socket.close();
    // }

    console.log("DEBUG: Socket fully disconnected and cleaned up");
    return socket;
  };

  console.log("DEBUG: Socket connected successfully");
  return socket;
};
