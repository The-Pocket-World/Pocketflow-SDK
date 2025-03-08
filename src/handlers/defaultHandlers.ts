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
 * Simply logs the disconnection event and reason.
 */
export const defaultSocketDisconnectionHandler = (reason: string) => {
  // Log all disconnections for testing purposes
  console.log("Socket disconnected:", reason);
};
