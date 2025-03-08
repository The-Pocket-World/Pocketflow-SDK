/**
 * Default handler for workflow log messages.
 * Only logs errors by default to reduce noise.
 */
export const defaultWorkflowLogHandler = (data: any) => {
  // Log all data for testing purposes
  console.log(data);
};

/**
 * Default handler for feedback requests.
 * Logs the request, prompts for user input via CLI, and returns the input.
 */
export const defaultFeedbackRequestHandler = (data: any) => {
  console.log("Feedback request:", data);
  const { prompt, defaultValue } = data;
  // Simple CLI input using Node's readline
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (Default: ${defaultValue})` : "";
    readline.question(
      `${prompt}${defaultText}: `,
      (input: string) => {
        readline.close();
        resolve(input || defaultValue || "");
      }
    );
  });
};

/**
 * Default stream output handler.
 * Only logs errors by default to reduce noise.
 */
export const defaultStreamOutputHandler = (data: any) => {
  // Only log errors to reduce noise
  if (data.isError) {
    console.log(
      `❌ Error from node '${data.node}' (${data.type}): ${data.action}`
    );
    if (data.state) {
      console.log("State:", data.state);
    }
  }
};

/**
 * Default connection handler.
 * Simply logs the connection event.
 */
export const defaultSocketConnectionHandler = () => {
  // Log connection for testing purposes
  console.log("Socket connected successfully");
};

/**
 * Default disconnection handler.
 * Logs detailed information about the disconnection event and reason.
 */
export const defaultSocketDisconnectionHandler = (reason: string) => {
  // Log all disconnections for testing purposes
  console.log("Socket disconnected:", reason);
  
  // Map common socket.io disconnect reasons to more helpful messages
  const reasonExplanations: Record<string, string> = {
    'io server disconnect': 'The server has forcefully disconnected the socket with socket.disconnect()',
    'io client disconnect': 'The socket was manually disconnected using socket.disconnect()',
    'ping timeout': 'The server did not send a PING within the pingInterval + pingTimeout range',
    'transport close': 'The connection was closed (example: user has lost connection, or network was changed from WiFi to 4G)',
    'transport error': 'The connection encountered an error (example: server was stopped or unreachable)'
  };
  
  if (reasonExplanations[reason]) {
    console.log(`Explanation: ${reasonExplanations[reason]}`);
  }
  
  console.log(`Timestamp: ${new Date().toISOString()}`);
};
