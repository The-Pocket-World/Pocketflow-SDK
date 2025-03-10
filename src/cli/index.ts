#!/usr/bin/env node

// Import environment variables first, before any other imports
import env from "../env";

import { Command } from "commander";
import { generateWorkflowTypes } from "./generate";
import { CliOptions } from "./types";
import axios from "axios";

// Define the CLI options interface
interface CommandOptions {
  apiKey?: string;
  outDir: string;
  verbose: boolean;
  debug?: boolean;
}

// Create CLI program
const program = new Command();

program
  .name("pocketflow-cli")
  .description("CLI for PocketFlow SDK")
  .version("1.0.0");

// Add a test-connection command to help diagnose server issues
program
  .command("test-connection")
  .description("Test the connection to the PocketFlow server")
  .option(
    "-k, --api-key <key>",
    "PocketFlow API key (or use POCKETFLOW_API_KEY in env vars or .env file)"
  )
  .option("-v, --verbose", "Enable verbose output", false)
  .action(async (options: { apiKey?: string; verbose: boolean }) => {
    try {
      const apiKey = options.apiKey || env.API_KEY;
      const serverUrl = env.SERVER_URL || "https://api.pocketflow.ai";

      console.log(`Testing connection to server: ${serverUrl}`);

      if (!apiKey) {
        console.warn(
          "Warning: No API key provided. Authentication will not be tested."
        );
      } else {
        console.log(
          `Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(
            apiKey.length - 4
          )}`
        );
      }

      // Test 1: Basic connectivity
      try {
        console.log("\nTest 1: Basic connectivity");
        const response = await axios.get(serverUrl, {
          validateStatus: () => true,
          timeout: 5000,
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers["content-type"]}`);

        if (options.verbose) {
          console.log("Response headers:", response.headers);
          console.log(
            "Response data (first 500 chars):",
            typeof response.data === "string"
              ? response.data.substring(0, 500)
              : JSON.stringify(response.data).substring(0, 500)
          );
        }
      } catch (error: any) {
        console.error(`Connection error: ${error.message}`);
      }

      // Test 2: API endpoint (workflows)
      try {
        console.log("\nTest 2: API endpoints");
        const apiPrefix = "/api";
        const apiUrl = `${
          serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl
        }${apiPrefix}/workflows`;

        console.log(`Testing API URL: ${apiUrl}`);
        const headers: Record<string, string> = {};

        if (apiKey) {
          headers["X-API-Key"] = apiKey;
        }

        const response = await axios.get(apiUrl, {
          headers,
          validateStatus: () => true,
          timeout: 5000,
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers["content-type"]}`);

        if (options.verbose) {
          console.log("Response headers:", response.headers);
          console.log(
            "Response data (first 500 chars):",
            typeof response.data === "string"
              ? response.data.substring(0, 500)
              : JSON.stringify(response.data).substring(0, 500)
          );
        }
      } catch (error: any) {
        console.error(`API endpoint error: ${error.message}`);
      }

      console.log(
        "\nTest complete. Check the results above to diagnose any issues."
      );
      console.log("For more detailed information, run with --verbose flag.");
    } catch (error) {
      console.error(
        error instanceof Error
          ? `Error: ${error.message}`
          : "An unknown error occurred"
      );
      process.exit(1);
    }
  });

// Add generate command
program
  .command("generate")
  .description("Generate TypeScript types for workflows")
  .option(
    "-k, --api-key <key>",
    "PocketFlow API key (or use POCKETFLOW_API_KEY in env vars or .env file)"
  )
  .option("-o, --out-dir <dir>", "Output directory", "src/flows")
  .option("-v, --verbose", "Enable verbose output", false)
  .option("-d, --debug", "Show debug information for troubleshooting", false)
  .addHelpText(
    "after",
    `
Example .env file content:
  POCKETFLOW_API_KEY=your_api_key_here
  POCKETFLOW_SERVER_URL=http://localhost:8080

Usage examples:
  $ pocketflow generate --api-key your_api_key
  $ pocketflow generate --api-key your_api_key --out-dir ./src/workflows
  $ pocketflow generate --verbose  # Uses API key from .env or environment variables
  $ pocketflow generate --debug    # Shows detailed information for troubleshooting
  `
  )
  .action(async (options: CommandOptions) => {
    try {
      // Enable debug mode if specified
      if (options.debug) {
        process.env.DEBUG_ENV = "true";
        // Log environment information for debugging
        console.log("Environment configuration:");
        console.log("  API_KEY:", env.API_KEY ? "[SET]" : "[NOT SET]");
        console.log("  SERVER_URL:", env.SERVER_URL || "[NOT SET]");
        console.log("  Working directory:", process.cwd());
      }

      // Command line args take precedence over env vars
      const cliOptions: CliOptions = {
        auth: {
          apiKey: options.apiKey || env.API_KEY,
        },
        outDir: options.outDir,
        verbose: Boolean(options.verbose || options.debug),
      };

      if (options.verbose || options.debug) {
        console.log("CLI Options:", {
          ...cliOptions,
          auth: { apiKey: cliOptions.auth.apiKey ? "[SET]" : "[NOT SET]" },
        });
      }

      await generateWorkflowTypes(cliOptions);
    } catch (error) {
      console.error(
        error instanceof Error
          ? `Error: ${error.message}`
          : "An unknown error occurred"
      );
      process.exit(1);
    }
  });

// Only execute CLI commands when this module is run directly, not when imported
if (require.main === module) {
  // If no command is specified, default to "generate"
  if (process.argv.length <= 2 || !process.argv[2].startsWith("-")) {
    // Insert the "generate" command if it's not present
    if (process.argv.length <= 2 || process.argv[2] !== "generate") {
      process.argv.splice(2, 0, "generate");
    }
  }

  // Parse arguments
  program.parse(process.argv);

  // Only show help if requested with --help flag
  // (Removed the automatic help display when no args provided)
}
