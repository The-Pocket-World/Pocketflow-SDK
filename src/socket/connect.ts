import { io, Socket } from "socket.io-client";
import {
  SocketConnectionHandler,
  SocketDisconnectionHandler,
  FeedbackRequestHandler,
  GenerationCompleteHandler,
  GenerationUpdateHandler,
  WorkflowLogHandler,
} from "../types";
import {
  defaultSocketConnectionHandler,
  defaultSocketDisconnectionHandler,
  defaultFeedbackRequestHandler,
  defaultWorkflowLogHandler,
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
export const connectSocket = (
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
    autoConnect: true,
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

  // Return a promise that resolves when the socket is connected
  return new Promise((resolve, reject) => {
    // Set a connection timeout
    const connectionTimeout = setTimeout(() => {
      console.error("DEBUG: Socket connection timed out after 30 seconds");
      reject(new Error("Socket connection timed out after 30 seconds"));
    }, 30000); // 30 seconds timeout

    // Add event listeners
    console.log(`DEBUG: Adding socket event listeners`);

    // Track connection attempts
    let connectionAttempts = 0;
    const maxConnectionAttempts = 3;

    // Function to handle connection success
    const handleSuccessfulConnection = () => {
      console.log(`DEBUG: Socket connected successfully with ID: ${socket.id}`);
      console.log(`DEBUG: Socket connected: ${socket.connected}`);
      clearTimeout(connectionTimeout);
      handleConnection();
      resolve(socket);
    };

    socket.on("connect", handleSuccessfulConnection);

    // If the socket is already connected, resolve immediately
    if (socket.connected) {
      handleSuccessfulConnection();
      return;
    }

    socket.on("connect_error", (error) => {
      connectionAttempts++;
      console.error(
        `DEBUG: Socket connection error (attempt ${connectionAttempts}/${maxConnectionAttempts}): ${error.message}`
      );
      console.error(`DEBUG: Full error:`, error);

      if (error.message.includes("authentication")) {
        console.error("DEBUG: Authentication failed. Please check your token.");
        clearTimeout(connectionTimeout);
        reject(new Error("Authentication failed. Please check your token."));
      } else if (error.message.includes("timeout")) {
        console.error(
          "DEBUG: Connection timed out. The server might be down or unreachable."
        );
      } else if (error.message.includes("xhr poll error")) {
        console.error(
          "DEBUG: XHR poll error. There might be network connectivity issues."
        );
      } else if (error.message.includes("ECONNREFUSED")) {
        console.error(
          "DEBUG: Connection refused. Make sure the server is running at the specified URL."
        );
      } else if (error.message.includes("404")) {
        console.error(
          "DEBUG: Server returned 404. The socket.io path might be incorrect."
        );
        // Try with a different path if we're connecting to localhost
        if (url.includes("localhost") && socketOptions.path === "/socket.io") {
          console.log("DEBUG: Trying with a different socket.io path...");
          socket.io.opts.path = "/";
          socket.connect();
        }
      }

      // If we've exceeded the maximum number of connection attempts, reject the promise
      if (connectionAttempts >= maxConnectionAttempts) {
        console.error(
          `DEBUG: Failed to connect after ${maxConnectionAttempts} attempts`
        );
        clearTimeout(connectionTimeout);
        reject(
          new Error(
            `Failed to connect after ${maxConnectionAttempts} attempts: ${error.message}`
          )
        );
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`DEBUG: Socket disconnected: ${reason}`);
      handleDisconnection(reason);
    });

    socket.on("error", (error) => {
      console.error(`DEBUG: Socket error:`, error);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`DEBUG: Socket reconnected after ${attemptNumber} attempts`);
      // If we're already resolved, this is just informational
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`DEBUG: Socket reconnection attempt ${attemptNumber}`);
    });

    socket.on("reconnect_error", (error) => {
      console.error(`DEBUG: Socket reconnection error:`, error);
    });

    socket.on("reconnect_failed", () => {
      console.error(`DEBUG: Socket reconnection failed after all attempts`);
      clearTimeout(connectionTimeout);
      reject(new Error("Socket reconnection failed after all attempts"));
    });

    // Set up workflow log handler
    socket.on("workflow_log", (data) => {
      console.log(`DEBUG: Received workflow_log event:`, data);
      handleLog(data);
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

    console.log(`DEBUG: Socket setup complete, waiting for connection...`);
  });
};
