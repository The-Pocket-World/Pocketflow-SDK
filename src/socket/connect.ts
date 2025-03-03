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
 * @returns A Socket instance connected to the specified server.
 */
export const connectSocket = (
  url: string = "api.pocketflow.ai",
  options: SocketConnectionOptions = {}
): Socket => {
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
  }

  console.log(`Connecting to socket server at: ${url}`);

  // Configure socket connection options
  const socketOptions: any = {
    transports: ["polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  };

  // Add token to auth if provided
  if (token) {
    socketOptions.auth = {
      token: token,
    };
  }

  const socket = io(url, socketOptions);

  socket.on("connect", () => {
    handleConnection();
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
    if (error.message.includes("authentication")) {
      console.error("Authentication failed. Please check your token.");
    }
    process.exit(1);
  });

  socket.on("disconnect", (reason) => {
    handleDisconnection(reason);
  });

  // Set up workflow log handler
  socket.on("workflow_log", (data) => {
    handleLog(data);
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
    if (handler) {
      socket.on(event, handler as any);
    }
  });

  return socket;
};
