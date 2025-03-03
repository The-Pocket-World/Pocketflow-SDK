/**
 * Twitter Example Usage
 *
 * This file demonstrates how to use the Twitter example programmatically.
 */

import { runTwitterAnalysis } from "./index";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function runExample() {
  console.log("🚀 Running Twitter competitor analysis example...");

  // Get API key from environment variable or use default
  const authToken = process.env.POCKETFLOW_API_KEY || "YOUR_AUTH_TOKEN";

  // Get server URL from environment variable or use default
  const endpoint = process.env.POCKETFLOW_SERVER_URL || "http://localhost:8080";

  // Custom search parameters
  const input = {
    prompt: "AI assistants for developers",
    project_description:
      "A coding assistant that helps developers write better code",
    limit: 10,
  };

  try {
    // Run the Twitter analysis
    const cleanup = await runTwitterAnalysis({
      authToken,
      endpoint,
      input,
    });

    // Set a timeout to demonstrate cleanup
    setTimeout(() => {
      console.log("\n✅ Example completed. Cleaning up...");
      cleanup();
      process.exit(0);
    }, 60000); // Wait for 1 minute to allow the workflow to complete

    console.log("\n⏳ Waiting for results (will exit in 1 minute)...");
    console.log("Press Ctrl+C to exit early");

    // Handle early termination
    process.on("SIGINT", () => {
      console.log("\n🛑 Terminating early...");
      cleanup();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error running example:", error);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runExample();
}
