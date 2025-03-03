import { connectSocket } from "../../src/socket/connect";
import { runWorkflow, ServerEmittedEvents } from "../../src/socket/workflow";
import * as path from "path";
import {
  TwitterSearchResult,
  generateHtmlReport,
  saveHtmlReport,
} from "./template-utils";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration
const WORKFLOW_ID = "twitter";
const AUTH_TOKEN = process.env.POCKETFLOW_API_KEY || "YOUR_AUTH_TOKEN"; // Use environment variable or fallback
const DEFAULT_ENDPOINT =
  process.env.POCKETFLOW_SERVER_URL || "http://localhost:8080"; // Use environment variable or fallback

// Default input for the Twitter competitor analysis workflow
const defaultWorkflowInput = {
  prompt: "Show me competitors",
  project_description: "A SaaS AI Agent builder.",
  limit: 5,
};

/**
 * Handles the completion of a Twitter search workflow run
 * @param data The data returned from the workflow run
 */
const handleRunComplete = (data: ServerEmittedEvents["run_complete"]) => {
  // Cast to unknown first, then to TwitterSearchResult to avoid type errors
  const result = data.state as unknown as TwitterSearchResult;

  console.log("\n✅ Twitter search completed!");
  console.log(
    `Found ${result.tweets.length} relevant tweets for: "${result.prompt}"`
  );

  // Generate HTML report using the template utility
  const htmlContent = generateHtmlReport(result);

  // Save the HTML report
  const outputPath = saveHtmlReport(htmlContent);
  console.log(`\n📊 Results saved to ${outputPath}`);
};

/**
 * Run the Twitter competitor analysis workflow
 * @param options Configuration options
 */
export async function runTwitterAnalysis(
  options: {
    authToken?: string;
    endpoint?: string;
    input?: {
      prompt?: string;
      project_description?: string;
      limit?: number;
    };
  } = {}
) {
  const authToken = options.authToken || AUTH_TOKEN;
  const endpoint = options.endpoint || DEFAULT_ENDPOINT;

  if (authToken === "YOUR_AUTH_TOKEN") {
    console.error("⚠️  Please set your auth token before running the example");
    console.error(
      "   Either set the POCKETFLOW_API_KEY environment variable or provide it as an argument"
    );
    process.exit(1);
  }

  // Merge default input with provided input
  const workflowInput = {
    ...defaultWorkflowInput,
    ...options.input,
  };

  console.log("🔍 Starting Twitter competitor analysis...");
  console.log(`Searching for: "${workflowInput.prompt}"`);
  console.log(`Project context: "${workflowInput.project_description}"`);
  console.log(`Limit: ${workflowInput.limit} tweets`);

  // Connect to the socket
  const socket = connectSocket(endpoint, {
    token: authToken,
    eventHandlers: {
      run_complete: handleRunComplete,
    },
  });

  // Run the workflow
  const cleanup = runWorkflow(socket, WORKFLOW_ID, authToken, workflowInput, {
    prettyLogs: true,
  });

  // Return a cleanup function
  return () => {
    cleanup();
    socket.disconnect();
  };
}

// If this file is run directly, execute the example
if (require.main === module) {
  runTwitterAnalysis();
}
