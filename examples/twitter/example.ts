/**
 * Twitter Example Usage
 *
 * This file demonstrates how to use the Twitter example programmatically.
 * It shows how to call the runTwitterAnalysis function with custom parameters.
 */

import { runTwitterAnalysis, TwitterAnalysisOptions } from "./index";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Example configuration for the Twitter analysis
 */
const EXAMPLE_CONFIG: TwitterAnalysisOptions = {
  input: {
    prompt: "AI assistants for developers",
    project_description:
      "A coding assistant that helps developers write better code",
    limit: 10,
  },
  // Use saveResults: true to generate an HTML report (default)
};

/**
 * Run the example with custom configuration
 */
async function runExample() {
  console.log(
    "🚀 Running Twitter analysis example with statically typed implementation..."
  );

  try {
    // Get API key from environment variable
    const authToken = process.env.POCKETFLOW_API_KEY;
    if (!authToken) {
      throw new Error("POCKETFLOW_API_KEY environment variable is not set");
    }

    // Merge the example configuration with the auth token
    const options: TwitterAnalysisOptions = {
      ...EXAMPLE_CONFIG,
      authToken,
    };

    // Log the configuration
    console.log("\n📋 Configuration:");
    console.log(`  Prompt: "${options.input?.prompt}"`);
    console.log(`  Project: "${options.input?.project_description}"`);
    console.log(`  Limit: ${options.input?.limit} tweets`);

    // Run the Twitter analysis with the provided configuration
    console.log("\n⏳ Running analysis...");
    const result = await runTwitterAnalysis(options);

    // Log the results
    console.log("\n📊 Results:");
    console.log(`  Found ${result.tweets.length} tweets`);

    // Log a sample tweet if available
    if (result.tweets.length > 0) {
      const sampleTweet = result.tweets[0];
      console.log("\n📝 Sample tweet:");
      console.log(`  Content: "${sampleTweet.content?.substring(0, 100)}..."`);
      console.log(`  Author: ${sampleTweet.metadata?.author || "Unknown"}`);
      console.log(`  Score: ${sampleTweet.score}`);
    }

    console.log("\n✅ Example completed successfully!");
    return result;
  } catch (error) {
    console.error(
      "\n❌ Error running example:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw error;
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}

// Export the example function for programmatic usage
export { runExample };
