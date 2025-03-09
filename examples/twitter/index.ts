/**
 * Twitter Example Using Generated Statically Typed Implementation
 *
 * This file demonstrates how to use the generated statically typed Twitter implementation.
 * It showcases the benefits of using TypeScript interfaces for workflow inputs and outputs.
 *
 */

import {
  TwitterMonitoringPostsWorkflowInput,
  TwitterMonitoringPostsWorkflowOutput,
} from "../../src/flows/twitter";
import * as dotenv from "dotenv";
import { connectSocket } from "../../src/socket/connect";
import { generateHtmlReport, saveHtmlReport } from "./template-utils";
import { Socket } from "socket.io-client";

// Load environment variables
dotenv.config();

// Extended output type for internal use that includes the socket
interface ExtendedTwitterOutput extends TwitterMonitoringPostsWorkflowOutput {
  socket?: Socket;
}

/**
 * Configuration options for the Twitter analysis
 */
export interface TwitterAnalysisOptions {
  /** Authentication token for the PocketFlow API */
  authToken?: string;
  /** Custom input parameters for the workflow */
  input?: Partial<TwitterMonitoringPostsWorkflowInput & { query?: string }>;
  /** Whether to save the results to an HTML file */
  saveResults?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Run the Twitter analysis using the statically typed implementation
 *
 * @param options Configuration options
 * @returns A promise that resolves with the workflow output
 */
export async function runTwitterAnalysis(
  options: TwitterAnalysisOptions
): Promise<ExtendedTwitterOutput> {
  let socket: any = null;
  const authToken = options.authToken || process.env.POCKETFLOW_API_KEY;
  const saveResults =
    options.saveResults !== undefined ? options.saveResults : true;
  const verbose = options.verbose !== undefined ? options.verbose : false;

  // Suppress debug logs by intercepting console.log
  // This is a workaround to avoid debug logs without changing environment variables
  const originalConsoleLog = console.log;
  if (!verbose) {
    console.log = function (...args) {
      // Only show logs that don't start with "DEBUG:" or "=== DEBUG:" prefix
      const firstArg = args[0];
      if (typeof firstArg === "string") {
        if (firstArg.includes("DEBUG:") || firstArg.includes("=== DEBUG:")) {
          return; // Suppress debug logs
        }
      }
      originalConsoleLog.apply(console, args);
    };
  }

  try {
    // Only log the start message
    console.log("🔍 Running Twitter analysis workflow...");

    // Ensure we have an auth token
    if (!authToken) {
      throw new Error(
        "Authentication token is required in options or POCKETFLOW_API_KEY environment variable"
      );
    }

    // Define the input for the workflow
    const input: TwitterMonitoringPostsWorkflowInput = {
      prompt: "AI assistants for developers",
      project_description:
        "A coding assistant that helps developers write better code",
      limit: 10,
      min_likes: 0,
      min_retweets: 0,
      ...(options.input || {}),
    };

    // Get server URL from environment variables
    const serverUrl = process.env.POCKETFLOW_SERVER_URL;
    if (!serverUrl) {
      throw new Error(
        "POCKETFLOW_SERVER_URL is not defined in environment variables"
      );
    }

    // Import runWorkflow
    const { runWorkflow } = await import("../../src/socket/workflow");

    // Create a shared result reference we can update from the stream output handler
    const sharedResult: TwitterMonitoringPostsWorkflowOutput = { tweets: [] };

    // Connect to the socket server - minimize logging in handlers
    socket = await connectSocket(serverUrl, {
      token: authToken,
      handleConnection: () => {}, // No logging for connection
      handleDisconnection: (reason: string) => {}, // No logging for disconnection
      handleLog: (data: any) => {}, // No logging for workflow logs
      handleStreamOutput: (data: any) => {}, // No logging for stream output
    });

    // Ensure we're connected
    if (!socket) {
      throw new Error("Failed to connect to PocketFlow server");
    }

    // Create a promise to handle the workflow execution
    return new Promise<ExtendedTwitterOutput>((resolve, reject) => {
      // Set a flag to track if the workflow has completed
      let isCompleted = false;
      let result = { ...sharedResult }; // Use the shared result reference

      // Set a timeout to prevent the workflow from running indefinitely
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          console.error(
            "Workflow timed out after 5 minutes without completing"
          );
          reject(new Error("Workflow timed out after 5 minutes"));
        }
      }, 5 * 60 * 1000); // 5 minutes timeout

      // Define handlers for workflow events - minimize logging
      const handlers = {
        // Handle workflow completion
        run_complete: (data: any) => {
          if (verbose) {
            console.log("Workflow completed with data:", data);
          } else {
            console.log("✅ Workflow completed successfully!");
          }
          clearTimeout(timeoutId);

          // Extract tweets from the final state
          let tweetsData: any[] = [];

          try {
            // Check for output first (new consolidated event format)
            if (data.output) {
              tweetsData = data.output;
              console.log(`Found ${tweetsData.length} tweets in output`);
            }
            // Fallback to checking state (for backwards compatibility)
            else if (data && data.state) {
              if (typeof data.state === "object" && data.state.tweets) {
                // If data.state is an object with tweets property
                tweetsData = data.state.tweets;
                console.log(`Found ${tweetsData.length} tweets in results`);
              } else if (
                typeof data.state === "string" &&
                data.state.includes("tweets:")
              ) {
                // Extract tweets from YAML-formatted string
                const yamlContent = data.state;
                // First locate the tweets array start
                const tweetsStart = yamlContent.indexOf("tweets: [");
                if (tweetsStart !== -1) {
                  // Find the matching closing bracket with proper nesting tracking
                  let openBrackets = 1; // Already found the opening bracket
                  let position = tweetsStart + 9; // Skip "tweets: ["
                  while (openBrackets > 0 && position < yamlContent.length) {
                    if (yamlContent[position] === "[") openBrackets++;
                    if (yamlContent[position] === "]") openBrackets--;
                    position++;
                  }

                  // If we found the matching closing bracket
                  if (openBrackets === 0) {
                    // Extract the tweets JSON array with brackets
                    const tweetsJson = yamlContent.substring(
                      tweetsStart + 8,
                      position
                    );
                    // Parse the JSON array
                    tweetsData = JSON.parse(tweetsJson);
                    console.log(`Found ${tweetsData.length} tweets in results`);
                  }
                }
              }
            }

            // Update the shared result with the extracted tweets
            if (tweetsData && tweetsData.length > 0) {
              sharedResult.tweets = tweetsData;

              console.log("\n📊 Analysis Results:");
              console.log(`Found ${tweetsData.length} relevant tweets:`);
              // Only log the first 3 tweets to reduce output
              const displayLimit = Math.min(3, tweetsData.length);
              tweetsData.slice(0, displayLimit).forEach((tweet, index) => {
                console.log(`\nTweet #${index + 1}:`);
                console.log(
                  `Text: ${tweet.text || tweet.content || tweet.title}`
                );
                console.log(
                  `User: ${tweet.username || tweet.author || "Unknown"}`
                );
                console.log(`Score: ${tweet.score || "N/A"}`);
                if (tweet.reason) console.log(`Reason: ${tweet.reason}`);
                console.log(`URL: ${tweet.url || "N/A"}`);
              });

              if (tweetsData.length > displayLimit) {
                console.log(
                  `\n... and ${tweetsData.length - displayLimit} more tweets`
                );
              }

              // Generate and save HTML report if requested
              if (saveResults) {
                try {
                  console.log("\n📝 Generating HTML report...");

                  // Extract query from input or data
                  const query =
                    (input as any).query ||
                    (typeof data.state === "object" && data.state.query) ||
                    input.prompt ||
                    "Twitter analysis";

                  // Generate HTML report using the template utility
                  const htmlContent = generateHtmlReport({
                    prompt: input.prompt || "AI assistants for developers",
                    project_description:
                      input.project_description || "Twitter analysis",
                    limit: input.limit || 10,
                    query: query,
                    tweets: tweetsData,
                    success: true,
                  });

                  // Save the HTML report
                  const reportPath = saveHtmlReport(htmlContent);
                  console.log(`📊 Report saved to: ${reportPath}`);
                } catch (reportError) {
                  console.error("Error generating HTML report:", reportError);
                }
              }
            }
          } catch (error) {
            console.error("Error extracting tweets from final state:", error);
          }

          if (!isCompleted) {
            isCompleted = true;
            // Resolve with the results
            resolve({ ...sharedResult, socket });

            // Just disconnect without logging
            if (socket && typeof socket.disconnect === "function") {
              socket.disconnect();
            }
          }
        },
        run_error: (error: any) => {
          console.error("❌ Error:", error.message);
          clearTimeout(timeoutId);
          if (!isCompleted) {
            isCompleted = true;

            // Disconnect socket without logging
            if (socket && typeof socket.disconnect === "function") {
              socket.disconnect();
            }

            reject(new Error(error.message || "Workflow execution failed"));
          }
        },
        // Empty handlers for other events to prevent default logging
        handleLog: (data: any) => {},
        handleStreamOutput: (data: any) => {},
        run_start: (data: any) => {},
        run_warning: (data: any) => {},
        node_error: (data: any) => {},
      };

      // Run the workflow with the handlers
      if (verbose) {
        console.log("Running workflow with ID 'twitter'");
        console.log("Workflow input:", JSON.stringify(input, null, 2));
      }

      runWorkflow(socket, "twitter", authToken, input, {
        handlers,
        prettyLogs: false, // Disable pretty logs
        verbose: false, // Disable verbose logging
      });
    });
  } catch (error) {
    console.error(
      "❌ Error running Twitter analysis:",
      error instanceof Error ? error.message : "Unknown error"
    );

    // If we have a socket, attach it to the error for cleanup
    if (socket) {
      (error as any).socket = socket;
    }

    throw error; // Re-throw the error for the caller to handle
  } finally {
    // Restore the original console.log function
    console.log = originalConsoleLog;
  }
}

/**
 * Main function to run the example
 */
async function main() {
  let socket: any = null;

  try {
    console.log("🔄 Starting Twitter analysis example...");

    // Get API key from environment variables
    const apiKey = process.env.POCKETFLOW_API_KEY;
    if (!apiKey) {
      throw new Error(
        "POCKETFLOW_API_KEY is not defined in environment variables"
      );
    }

    // Get server URL from environment variables
    const serverUrl = process.env.POCKETFLOW_SERVER_URL;
    console.log(
      `Using server URL: ${serverUrl || "https://api.pocketflow.ai"}`
    );

    // Set a timeout to ensure the example doesn't run indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Workflow timed out after 5 minutes"));
      }, 5 * 60 * 1000); // 5 minutes timeout
    });

    // Run the analysis with a timeout
    console.log("Running Twitter analysis with timeout...");
    const result = await Promise.race<ExtendedTwitterOutput>([
      runTwitterAnalysis({
        authToken: apiKey,
        saveResults: true,
      }),
      timeoutPromise,
    ]);

    // Save the socket for later disconnection
    socket = result.socket;
    delete result.socket; // Remove socket from result to avoid circular references

    console.log("\n🎉 Example completed successfully!");

    // The results have already been processed and displayed in the stream_output handler
    // Just show a summary here
    if (result.tweets && Array.isArray(result.tweets)) {
      console.log(`Found ${result.tweets.length} tweets in total.`);
    } else {
      console.log("No tweets were returned from the workflow.");
    }

    // Socket should already be disconnected by the completion handlers
    // No need to disconnect here, but let's check to be sure
    if (socket && typeof socket.disconnect === "function" && socket.connected) {
      console.log("Socket still connected, disconnecting now...");
      socket.disconnect();
    } else {
      console.log("Socket already disconnected or not available.");
    }

    // Force exit immediately - don't wait for any background processes
    console.log("Example completed, exiting process immediately");

    // Use setImmediate to ensure all console logs are flushed before exiting
    setImmediate(() => {
      process.exit(0); // Exit with success code
    });
  } catch (error) {
    console.error(
      "\n❌ Failed to run example:",
      error instanceof Error ? error.message : "Unknown error"
    );
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }

    // Try to disconnect any socket that might be in the error object
    if (error && typeof error === "object" && "socket" in error) {
      socket = (error as any).socket;
      delete (error as any).socket; // Remove socket from error to avoid circular references
    }

    // Disconnect the socket if available
    if (socket) {
      console.log("Disconnecting socket before exiting due to error...");
      try {
        if (typeof socket.disconnect === "function") {
          socket.disconnect();
          console.log("Socket disconnected successfully");
        }
      } catch (disconnectError) {
        console.error("Error disconnecting socket:", disconnectError);
      }
    }

    // Force exit with error code - use setImmediate to ensure logs are flushed
    console.log("Example failed, exiting process immediately");
    setImmediate(() => {
      process.exit(1);
    });
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}
