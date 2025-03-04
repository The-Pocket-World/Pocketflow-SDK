import { Socket } from "socket.io-client";

/**
 * Handler function for workflow log events
 */
export type WorkflowLogHandler = (data: any) => void;

/**
 * Handler function for feedback request events
 */
export type FeedbackRequestHandler = (data: any) => any;

/**
 * Handler function for generation update events
 */
export type GenerationUpdateHandler = (data: any) => void;

/**
 * Handler function for generation complete events
 */
export type GenerationCompleteHandler = (data: any) => void;

/**
 * Handler function for stream output events
 */
export type StreamOutputHandler = (data: any) => void;

/**
 * Handler function for socket connection events
 */
export type SocketConnectionHandler = () => void;

/**
 * Handler function for socket disconnection events
 */
export type SocketDisconnectionHandler = (reason: string) => void;

/**
 * Configuration options for the socket connection
 */
export interface SocketConfig {
  /**
   * The URL of the socket server to connect to
   */
  url?: string;

  /**
   * Authentication token for the socket server
   */
  token?: string;

  /**
   * Function to handle workflow log messages
   */
  handleWorkflowLog?: WorkflowLogHandler;

  /**
   * Function to handle feedback requests
   */
  handleFeedbackRequest?: FeedbackRequestHandler;

  /**
   * Function to handle generation update messages
   */
  handleGenerationUpdate?: GenerationUpdateHandler;

  /**
   * Function to handle generation complete messages
   */
  handleGenerationComplete?: GenerationCompleteHandler;

  /**
   * Function to handle stream output events
   */
  handleStreamOutput?: StreamOutputHandler;

  /**
   * Function to handle socket connection event
   */
  handleSocketConnection?: SocketConnectionHandler;

  /**
   * Function to handle socket disconnection event
   */
  handleSocketDisconnection?: SocketDisconnectionHandler;
}
