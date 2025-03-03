/**
 * Environment variable loader
 * This module is imported first to ensure environment variables are loaded
 * before any other module accesses them.
 */
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

// Always load from the directory where the command is being executed
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  // Load .env file from current working directory - this is critical
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error(`Error loading .env file: ${result.error.message}`);
  }
}

// For debugging
if (process.env.DEBUG_ENV === "true") {
  console.log("Environment variables loaded:");
  console.log(
    `  POCKETFLOW_API_KEY: ${
      process.env.POCKETFLOW_API_KEY ? "****" : "not set"
    }`
  );
  console.log(
    `  POCKETFLOW_SERVER_URL: ${process.env.POCKETFLOW_SERVER_URL || "not set"}`
  );
}

// Export the environment variables
export default {
  API_KEY: process.env.POCKETFLOW_API_KEY,
  SERVER_URL: process.env.POCKETFLOW_SERVER_URL,
};
