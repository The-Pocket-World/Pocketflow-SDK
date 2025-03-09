import { connectSocket, runWorkflow } from "./src/index"; // Replace with the path to the local sdk
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.POCKETFLOW_API_KEY;
const serverUrl = process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai";

if (!apiKey) {
  console.error("Error: POCKETFLOW_API_KEY is not set in the environment");
  process.exit(1);
}

// Replace with the id of the workflow you want to run
const workflowId = "twitter";

async function main() {
  try {
    // Connect to the PocketFlow API
    const socket = await connectSocket(serverUrl, {
      token: apiKey,
    });

    // Run a workflow
    runWorkflow(
      socket,
      workflowId,
      apiKey as string,
      {
        // Replace with the input parameters for the workflow
        prompt: "Analyze the market trends for AI assistants",
        project_description: "An AI assistant",
        limit: 10,
        min_likes: 10,
        min_retweets: 5,
      },
      {
        prettyLogs: true, // Enable formatted console output
        handlers: {
          run_complete: (output) => {
            console.log("Run complete");
            console.log(output);
            socket.disconnect();
          },
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
