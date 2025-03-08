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
  - [�� Key Features](#-key-features)
  - [📖 Usage Examples](#-usage-examples)
    - [Connecting to the Socket Server](#connecting-to-the-socket-server)
    - [Running Workflows](#running-workflows)
    - [Handling Events](#handling-events)
    - [More Advanced Usage](#more-advanced-usage)
    - [Authentication](#authentication)
    - [Using Generated Functions](#using-generated-functions)
  - [📚 API Reference](#-api-reference)
    - [`connectSocket`](#connectsocket)
    - [`runWorkflow`](#runworkflow)
    - [Event Handlers](#event-handlers)
    - [HTTP API Functions](#http-api-functions)
  - [🧪 Examples](#-examples)
    - [Environment Setup](#environment-setup)
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

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk"; // Replace with the path to the local sdk
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.POCKETFLOW_API_KEY;
const serverUrl = process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai";

if (!apiKey) {
  console.error("Error: POCKETFLOW_API_KEY is not set in the environment");
  process.exit(1);
}

// Example workflow ID - replace with a valid workflow ID from your account
const workflowId = "your-workflow-id";

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
      apiKey,
      {
        prompt: "Analyze the market trends for AI assistants",
        // Other input parameters specific to your workflow
      },
      {
        prettyLogs: true, // Enable formatted console output
      }
    );

    // Allow some time for the workflow to run then disconnect
    setTimeout(() => {
      console.log("Disconnecting socket...");
      socket.disconnect();
    }, 10000); // 10 seconds timeout
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

## �� Key Features

- **Real-time Communication**: Connect to PocketFlow's socket server for real-time workflow execution and updates
- **Event-Driven Architecture**: Subscribe to workflow events with customizable handlers
- **TypeScript Support**: Full TypeScript definitions for enhanced developer experience
- **Flexible Configuration**: Customize socket connection and workflow execution options
- **Comprehensive Logging**: Built-in support for detailed or pretty-printed logs
- **Interactive Feedback**: Handle user feedback requests during workflow execution
- **HTTP API Integration**: Access workflow information programmatically
- **CLI Tools**: Generate type-safe wrapper functions for your workflows

## 📖 Usage Examples

### Connecting to the Socket Server

```typescript
import { connectSocket } from "pocketflow-sdk";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Basic connection with default options
    const basicSocket = await connectSocket();
    
    // Connection with custom options
    const socketWithOptions = await connectSocket(
      process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai", 
      {
        // Authentication token (required for most operations)
        token: process.env.POCKETFLOW_API_KEY,
    
        // Custom event handlers
        handleLog: (data) => console.log("Workflow log:", data),
        handleFeedback: (data) => prompt(data.prompt),
        handleConnection: () => console.log("Socket connected!"),
        handleDisconnection: (reason) => console.log("Socket disconnected:", reason),
    
        // Custom handlers for specific server events
        eventHandlers: {
          run_start: (data) => console.log("Workflow started:", data.message),
          run_complete: (data) => console.log("Workflow completed:", data.message),
        },
      }
    );
    
    // Clean up connections when done
    setTimeout(() => {
      basicSocket.disconnect();
      socketWithOptions.disconnect();
    }, 5000);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

### Running Workflows

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.POCKETFLOW_API_KEY;
const serverUrl = process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai";

if (!apiKey) {
  console.error("Error: POCKETFLOW_API_KEY is not set in the environment");
  process.exit(1);
}

// Example workflow ID - replace with a valid workflow ID from your account
const workflowId = "your-workflow-id";

async function main() {
  try {
    // Connect to the socket server
    const socket = await connectSocket(serverUrl, {
      token: apiKey,
    });

    // Run a workflow with basic options
    runWorkflow(
      socket,
      workflowId,
      apiKey,
      {
        prompt: "Your workflow input prompt",
        // Other input parameters specific to your workflow
      }
    );

    // Run a workflow with advanced options
    runWorkflow(
      socket,
      workflowId,
      apiKey,
      { prompt: "Your workflow input prompt" },
      {
        // Enable pretty-printed logs
        prettyLogs: true,

        // Enable verbose logging
        verbose: true,

        // Custom event handlers
        handlers: {
          run_complete: (data) => {
            console.log("Workflow completed successfully!");
            console.log("Result:", data.state);
          },
          final_output: (data) => {
            console.log("Final output:", data.data);
          },
        },
      }
    );

    // Clean up when done
    setTimeout(() => {
      socket.disconnect();
    }, 10000);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

### Handling Events

The SDK supports all events emitted by the PocketFlow server:

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";
import { ServerEmittedEvents } from "pocketflow-sdk/dist/socket/workflow"; // Import event types
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.POCKETFLOW_API_KEY;
const serverUrl = process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai";

if (!apiKey) {
  console.error("Error: POCKETFLOW_API_KEY is not set in the environment");
  process.exit(1);
}

// Example workflow ID - replace with a valid workflow ID from your account
const workflowId = "your-workflow-id";

async function main() {
  try {
    // Connect to the socket server
    const socket = await connectSocket(serverUrl, {
      token: apiKey,
    });

    // Custom event handlers
    const customHandlers = {
      // Workflow execution events
      run_start: (data: ServerEmittedEvents["run_start"]) => 
        console.log("Workflow started:", data.message),
      run_complete: (data: ServerEmittedEvents["run_complete"]) => 
        console.log("Workflow completed:", data.message),
      run_error: (data: ServerEmittedEvents["run_error"]) => 
        console.error("Workflow error:", data.message),
      run_warning: (data: ServerEmittedEvents["run_warning"]) => 
        console.warn("Workflow warning:", data.message),

      // Stream and node events
      stream_output: (data: ServerEmittedEvents["stream_output"]) =>
        console.log(`Output from node ${data.node}:`, data.action),
      node_error: (data: ServerEmittedEvents["node_error"]) =>
        console.error(`Error in node ${data.node}:`, data.error),
      final_output: (data: ServerEmittedEvents["final_output"]) => 
        console.log("Final output:", data.data),
    };

    // Run workflow with custom handlers
    runWorkflow(
      socket,
      workflowId,
      apiKey,
      { prompt: "Your workflow input prompt" },
      { handlers: customHandlers }
    );

    // Clean up when done
    setTimeout(() => {
      socket.disconnect();
    }, 10000);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

### More Advanced Usage

Refer to the [examples](./examples) directory for more advanced usage examples. You can also run the examples with the interactive CLI interface:

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
POCKETFLOW_SERVER_URL=https://api.pocketflow.app
```

### Using Generated Functions

In your application code:

```typescript
import { runTwitterMonitoringWorkflow } from "./flows";

async function monitorTwitter() {
  const result = await runTwitterMonitoringWorkflow({
    query: "artificial intelligence",
    maxResults: 50,
  });

  console.log(`Found ${result.results.length} tweets`);
}
```

## 📚 API Reference

### `connectSocket`

Connects to a socket server and sets up event handlers.

```typescript
function connectSocket(
  url?: string,
  options?: {
    token?: string; // Authentication token
    eventHandlers?: EventHandlers;
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

```typescript
import { defaultHandlers, prettyLogHandlers } from "pocketflow-sdk";

// Use default handlers as a base and override specific ones
const myHandlers = {
  ...defaultHandlers,
  run_complete: (data) => {
    console.log("My custom completion handler!");
    console.log(data);
  },
};

// Or use the pretty log handlers for a more visually appealing output
const myPrettyHandlers = {
  ...prettyLogHandlers,
  final_output: (data) => {
    console.log("✨ FINAL OUTPUT ✨");
    console.log(JSON.stringify(data.data, null, 2));
  },
};
```

### HTTP API Functions

The SDK provides functions for accessing workflow information through the HTTP API:

```typescript
import { listWorkflows, getWorkflowDetail } from "pocketflow-sdk";

// List all workflows with pagination
const { workflows, meta } = await listWorkflows(
  {
    apiKey: "your_api_key_here",
    verbose: true, // Enable detailed logging
  },
  {
    limit: 10,
    offset: 0,
    sort: "updated_at",
    order: "desc",
    search: "analysis", // Free text search
  }
);

// Get detailed information about a specific workflow
const workflowDetail = await getWorkflowDetail(
  {
    apiKey: "your_api_key_here",
  },
  "workflow-id-here"
);

console.log(`Workflow name: ${workflowDetail.name}`);
console.log(`Nodes: ${workflowDetail.nodes.length}`);
```

## 🧪 Examples

The SDK includes example implementations that demonstrate how to use it with real-world workflows.

### Environment Setup

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your PocketFlow API key and server URL:
   ```
   POCKETFLOW_API_KEY=your_api_key_here
   POCKETFLOW_SERVER_URL=https://api.pocketflow.ai
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
