/**
 * Twitter Example Using Generated Statically Typed Implementation
 *
 * This file demonstrates how to use the generated statically typed Twitter implementation.
 * It showcases the benefits of using TypeScript interfaces for workflow inputs and outputs.
 */

import {
  runTwitterMonitoringPostsWorkflow,
  TwitterMonitoringPostsWorkflowInput,
  TwitterMonitoringPostsWorkflowOutput,
} from "../../src/flows";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { generateHtmlReport, saveHtmlReport } from "./template-utils";

// Load environment variables
dotenv.config();

/**
 * Configuration options for the Twitter analysis
 */
export interface TwitterAnalysisOptions {
  /** Authentication token for the PocketFlow API */
  authToken?: string;
  /** Custom input parameters for the workflow */
  input?: Partial<TwitterMonitoringPostsWorkflowInput>;
  /** Whether to save the results to an HTML file */
  saveResults?: boolean;
}

/**
 * Default input parameters for the Twitter analysis
 */
const DEFAULT_INPUT: TwitterMonitoringPostsWorkflowInput = {
  prompt: "AI assistants for developers",
  project_description:
    "A coding assistant that helps developers write better code",
  limit: 10,
};

/**
 * Run the Twitter analysis using the statically typed implementation
 *
 * @param options Configuration options
 * @returns A promise that resolves with the workflow output
 */
export async function runTwitterAnalysis(
  options: TwitterAnalysisOptions = {}
): Promise<TwitterMonitoringPostsWorkflowOutput> {
  console.log(
    "🚀 Running Twitter analysis with statically typed implementation..."
  );

  // Get API key from environment variable or use default
  const authToken =
    options.authToken || process.env.POCKETFLOW_API_KEY || "YOUR_AUTH_TOKEN";

  if (authToken === "YOUR_AUTH_TOKEN") {
    const error = new Error("Authentication token is required");
    console.error("⚠️  Please set your auth token before running the example");
    console.error(
      "   Either set the POCKETFLOW_API_KEY environment variable or provide it as an argument"
    );
    throw error;
  }

  // Merge default input with provided input
  const input: TwitterMonitoringPostsWorkflowInput = {
    ...DEFAULT_INPUT,
    ...options.input,
  };

  console.log("🔍 Starting Twitter monitoring posts...");
  console.log(`Searching for: "${input.prompt}"`);
  console.log(`Project context: "${input.project_description}"`);
  console.log(`Limit: ${input.limit} tweets`);

  try {
    console.log(
      "\n⏳ Waiting for workflow to complete (this may take a minute)..."
    );

    // Run the workflow with type-safe input and output
    const result = await runTwitterMonitoringPostsWorkflow(input, authToken);

    console.log("\n✅ Twitter search completed!");

    if (result.tweets && Array.isArray(result.tweets)) {
      console.log(`Found ${result.tweets.length} relevant tweets`);

      // Display some information about the tweets
      if (result.tweets.length > 0) {
        console.log("\n📊 Tweet Summary:");
        result.tweets.slice(0, 3).forEach((tweet, index) => {
          console.log(`\n🐦 Tweet ${index + 1}:`);
          console.log(
            `  Content: "${tweet.content?.substring(0, 100)}${
              tweet.content?.length > 100 ? "..." : ""
            }"`
          );
          console.log(`  Author: ${tweet.metadata?.author || "Unknown"}`);
          console.log(`  Score: ${tweet.score}`);
        });

        if (result.tweets.length > 3) {
          console.log(`\n... and ${result.tweets.length - 3} more tweets`);
        }
      } else {
        console.log("No tweets found matching your criteria.");
      }
    } else {
      console.log("No tweets returned from the workflow.");
    }

    // Generate and save HTML report if requested (default: true)
    const saveResults = options.saveResults !== false;
    if (saveResults) {
      console.log("\n📝 Generating HTML report...");

      // Generate HTML report using the template utility
      const htmlContent = generateHtmlReport({
        ...input,
        tweets: result.tweets || [],
        success: true,
        query: input.prompt,
      });

      // Save the HTML report
      const outputPath = saveHtmlReport(htmlContent);
      console.log(`\n📊 Results saved to ${outputPath}`);
      console.log(`   Open this file in your browser to view the report.`);
    }

    return result;
  } catch (error) {
    console.error(
      "❌ Error running Twitter analysis:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error; // Re-throw the error for the caller to handle
  }
}

/**
 * Main function to run the example
 */
async function main() {
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
    const result = await Promise.race<TwitterMonitoringPostsWorkflowOutput>([
      runTwitterAnalysis({
        authToken: apiKey,
        // Add a shorter timeout for debugging
        saveResults: true,
      }),
      timeoutPromise,
    ]);

    console.log("\n🎉 Example completed successfully!");

    if (result.tweets && Array.isArray(result.tweets)) {
      console.log(`Found ${result.tweets.length} tweets in total.`);
    } else {
      console.log("No tweets were returned from the workflow.");
    }

    // Keep the process running for a bit to ensure all socket events are processed
    console.log("Waiting for 5 seconds to ensure all events are processed...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("Example completed, exiting process");
    process.exit(0); // Exit with success code

    return result;
  } catch (error) {
    console.error(
      "\n❌ Failed to run example:",
      error instanceof Error ? error.message : "Unknown error"
    );
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }

    // Keep the process running for a bit to ensure all socket events are processed
    console.log("Waiting for 5 seconds before exiting due to error...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main();
}
