# PocketFlow SDK

[![npm version](https://img.shields.io/npm/v/pocketflow-sdk.svg)](https://www.npmjs.com/package/pocketflow-sdk)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/pocketflow/sdk/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

A TypeScript SDK for interacting with the PocketFlow API, enabling seamless integration with PocketFlow's workflow automation platform.

## 📋 Table of Contents

- [PocketFlow SDK](#pocketflow-sdk)
  - [📋 Table of Contents](#-table-of-contents)
  - [🚀 Installation](#-installation)
  - [⚡ Quick Start](#-quick-start)
  - [📖 Usage Examples](#-usage-examples)
    - [Authentication](#authentication)
  - [📚 API Reference](#-api-reference)
    - [`connectSocket`](#connectsocket)
    - [`runWorkflow`](#runworkflow)
    - [Event Handlers](#event-handlers)
  - [👥 Contributing](#-contributing)
  - [📄 License](#-license)

## 🚀 Installation

Clone the github repo:

```bash
git clone https://github.com/The-Pocket-World/sdk.git
```

Install dependencies:

```bash
npm install
```

Generate the types:

```bash
npm run generate
```

That's it! You can now use the SDK in your project. Just replace "pocketflow-sdk" in the import statements with the path to the local sdk.

## ⚡ Quick Start

Here is a basic example that uses the twitter search workflow. Remember to replace the import path with the correct one for your setup.

```typescript
import { connectSocket, runWorkflow } from "path/to/local/sdk/src/index"; // Replace with the path to the local sdk
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
```

Remember to create a `.env` file and add your PocketFlow API key and server URL:

```
POCKETFLOW_API_KEY=your_api_key_here
POCKETFLOW_SERVER_URL=https://api.pocketflow.ai
```

You can get the pocketflow api key from the [PocketFlow dashboard](https://platform.pocketflow.ai/settings/api).

Now, you can run the quickstart example by running:

```bash
npx ts-node <path-to-quickstart-file>
```

## 📖 Usage Examples

Refer to the [examples](./examples) directory for usage examples. You can also run the examples with the interactive CLI interface:

```bash
npm run examples:twitter
```

to run the twitter example (advanced twitter search tool) and

```bash
npm run examples:youtube2twitter
```

for the youtube2twitter example (identifies startup ideas in a youtube video and searches twitter for related posts).

### Authentication

Set the POCKETFLOW_API_KEY environment variable in your `.env` file for the SDK to authenticate:

```.env
POCKETFLOW_API_KEY=pfl_your_api_key
POCKETFLOW_SERVER_URL=https://api.pocketflow.ai
```

## 📚 API Reference

### `connectSocket`

Connects to a socket server and sets up event handlers.

```typescript
function connectSocket(
  url?: string,
  options?: {
    token?: string; // Authentication token
    handleLog?: (data: any) => void;
    handleFeedback?: (data: any) => any;
    handleConnection?: () => void;
    handleDisconnection?: (reason: string) => void;
    handleStreamOutput?: (data: any) => void;
  }
): Socket;
```

### `runWorkflow`

Runs a workflow with the specified ID and input, with support for custom event handlers.

```typescript
function runWorkflow(
  socket: Socket,
  workflowId: string,
  token: string,
  input: any,
  options?: {
    handlers?: EventHandlers;
    prettyLogs?: boolean;
    verbose?: boolean;
  }
): () => void; // Returns a cleanup function
```

### Event Handlers

The SDK provides default handlers for all server-emitted events:

> **Note:** As of the latest update, workflow output is now consolidated in the `run_complete` event with an `output` field, rather than being sent in a separate `final_output` event.

> **Note:** The SDK now automatically disconnects the socket when a workflow completes or encounters an error. This happens after the `run_complete`, `run_error`, or `workflow_error` events are processed. You don't need to call `socket.disconnect()` in your handlers, but it's safe to do so if you prefer explicit control.

```typescript
import {
  defaultHandlers,
  prettyLogHandlers,
} from "path/to/local/sdk/src/index";

// Use default handlers as a base and override specific ones
const myHandlers = {
  ...defaultHandlers,
  run_complete: (data) => {
    console.log("My custom completion handler!");
    console.log(data.state);
    // Process output data if available
    if (data.output) {
      console.log("Workflow output:", data.output);
    }
    // No need to call socket.disconnect() - it's done automatically
  },
};

// Or use the pretty log handlers for a more visually appealing output
const myPrettyHandlers = {
  ...prettyLogHandlers,
  run_complete: (data) => {
    console.log("✨ WORKFLOW COMPLETE ✨");
    console.log(JSON.stringify(data.state, null, 2));
    // Process output data if available
    if (data.output) {
      console.log("✨ OUTPUT DATA ✨");
      console.log(JSON.stringify(data.output, null, 2));
    }
  },
};
```

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the [PocketFlow](https://pocketflow.ai) team
