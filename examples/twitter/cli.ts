/**
 * Twitter CLI Example
 *
 * This file provides a command-line interface for the Twitter example.
 * It demonstrates how to use the statically typed Twitter implementation with user input.
 *
 * BEST PRACTICES DEMONSTRATED:
 * 1. User-friendly CLI interface with sensible defaults
 * 2. Real-time processing of results as they arrive
 * 3. Proper socket management and cleanup
 * 4. Comprehensive error handling
 */

import { runTwitterAnalysis, TwitterAnalysisOptions } from "./index";
import * as readline from "readline";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * CLI argument definitions
 */
interface CliArgs {
  token?: string;
  prompt?: string;
  project?: string;
  limit?: string;
  help?: boolean;
  [key: string]: string | boolean | undefined;
}

/**
 * Parse command line arguments
 * @returns Parsed command line arguments
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const argMap: CliArgs = {};

  // Check for help flag
  if (args.includes("--help") || args.includes("-h")) {
    argMap.help = true;
    return argMap;
  }

  // Parse arguments in the format --key=value
  args.forEach((arg) => {
    if (arg.startsWith("--")) {
      const [key, value] = arg.substring(2).split("=");
      if (key && value) {
        argMap[key as keyof CliArgs] = value;
      }
    }
  });

  return argMap;
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
Twitter Analysis CLI - Using Statically Typed Implementation

Usage:
  npm run examples:twitter:cli -- [options]

Options:
  --token=<token>     Your PocketFlow API token
  --prompt=<prompt>   Search prompt (e.g., "AI assistants")
  --project=<desc>    Project description
  --limit=<number>    Maximum number of tweets to return

Example:
  npm run examples:twitter:cli -- --token=your_token --prompt="AI assistants" --project="A coding assistant" --limit=10
  `);
}

/**
 * Prompt the user for input
 * @param question The question to ask
 * @param defaultValue Default value if user doesn't provide input
 * @returns A promise that resolves with the user's input
 */
async function promptUser(
  question: string,
  defaultValue?: string
): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>((resolve) => {
    const defaultText = defaultValue ? ` (default: "${defaultValue}")` : "";
    rl.question(`${question}${defaultText}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Run the CLI interface
 */
async function runCli() {
  let socket: any = null;

  console.log(
    "🔍 Twitter Analysis CLI - Using Statically Typed Implementation"
  );

  // Parse command line arguments
  const args = parseArgs();

  // Show help if requested
  if (args.help) {
    showHelp();
    return;
  }

  try {
    // Get token from arguments or environment variable
    let token = args.token || process.env.POCKETFLOW_API_KEY;
    if (!token) {
      token = await promptUser("Enter your PocketFlow API token");
      if (!token) {
        throw new Error("API token is required");
      }
    }

    // Get prompt from arguments or prompt the user
    const prompt =
      args.prompt ||
      (await promptUser("Enter search prompt", "AI assistants for developers"));

    // Get project description from arguments or prompt the user
    const project =
      args.project ||
      (await promptUser(
        "Enter project description",
        "A coding assistant that helps developers write better code"
      ));

    // Get limit from arguments or prompt the user
    const limitStr =
      args.limit || (await promptUser("Enter maximum number of tweets", "10"));
    const limit = parseInt(limitStr, 10) || 10;

    // Prepare options for the Twitter analysis
    const options: TwitterAnalysisOptions = {
      authToken: token,
      input: {
        prompt,
        project_description: project,
        limit,
      },
    };

    // Run the Twitter analysis with the provided parameters
    console.log("\n⏳ Running Twitter analysis...");
    const result = await runTwitterAnalysis(options);

    // Save the socket for later disconnection
    socket = result.socket;
    delete result.socket; // Remove socket from result to avoid circular references

    console.log("\n✅ Analysis completed successfully!");

    // The results have already been processed and displayed in the stream_output handler
    // Just show a summary here
    if (result.tweets && Array.isArray(result.tweets)) {
      console.log(
        `Found ${result.tweets.length} tweets matching your criteria.`
      );
    } else {
      console.log("No tweets were found matching your criteria.");
    }

    // Now that we've processed everything, disconnect the socket
    if (socket) {
      console.log("Disconnecting socket before exiting...");
      try {
        if (typeof socket.disconnect === "function") {
          socket.disconnect();
          console.log("Socket disconnected successfully");
        }
      } catch (error) {
        console.error("Error disconnecting socket:", error);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : "Unknown error"
    );

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

    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  runCli().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
