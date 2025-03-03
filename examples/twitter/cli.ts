#!/usr/bin/env node
import { runTwitterAnalysis } from "./index";
import * as readline from "readline";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Parse command line arguments
const args = process.argv.slice(2);
const argMap: Record<string, string> = {};

// Parse arguments in the format --key=value
args.forEach((arg) => {
  if (arg.startsWith("--")) {
    const [key, value] = arg.substring(2).split("=");
    if (key && value) {
      argMap[key] = value;
    }
  }
});

// Check if help flag is present
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Twitter Competitor Analysis Example

Usage:
  npx ts-node examples/twitter/cli.ts [options]

Options:
  --token=<auth_token>           Your authentication token (or set POCKETFLOW_API_KEY env var)
  --prompt=<search_prompt>       The search prompt (e.g., "Show me competitors")
  --project=<description>        Your project description
  --limit=<number>               Maximum number of tweets to return (default: 5)
  --endpoint=<url>               API endpoint (or set POCKETFLOW_SERVER_URL env var)
  --help, -h                     Show this help message

Example:
  npx ts-node examples/twitter/cli.ts --token=pfl_abc123 --prompt="AI assistants" --project="A coding assistant" --limit=10
  `);
  process.exit(0);
}

// Function to prompt for input if not provided
function prompt(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: "${defaultValue}")` : "";
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue || "");
    });
  });
}

// Main function to run the CLI
async function main() {
  try {
    // Get auth token from args, env var, or prompt
    let authToken = argMap.token || process.env.POCKETFLOW_API_KEY;
    if (!authToken) {
      authToken = await prompt("Enter your authentication token");
      if (!authToken) {
        console.error("❌ Authentication token is required");
        process.exit(1);
      }
    }

    // Get endpoint from args, env var, or prompt
    const endpoint =
      argMap.endpoint ||
      process.env.POCKETFLOW_SERVER_URL ||
      (await prompt("Enter API endpoint", "http://localhost:8080"));

    // Get other parameters with defaults
    const promptText =
      argMap.prompt ||
      (await prompt("Enter search prompt", "Show me competitors"));
    const projectDesc =
      argMap.project ||
      (await prompt("Enter project description", "A SaaS AI Agent builder."));
    const limitStr = argMap.limit || (await prompt("Enter result limit", "5"));

    // Parse limit as number
    const limit = parseInt(limitStr, 10);
    if (isNaN(limit) || limit <= 0) {
      console.error("❌ Limit must be a positive number");
      process.exit(1);
    }

    // Run the analysis
    console.log("\n🚀 Starting Twitter competitor analysis...\n");

    const cleanup = await runTwitterAnalysis({
      authToken,
      endpoint,
      input: {
        prompt: promptText,
        project_description: projectDesc,
        limit,
      },
    });

    // Handle process termination
    process.on("SIGINT", () => {
      console.log("\n\n🛑 Terminating...");
      cleanup();
      rl.close();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ An error occurred:", error);
    process.exit(1);
  }
}

// Run the main function
main().finally(() => {
  // Close readline interface when done
  rl.close();
});
