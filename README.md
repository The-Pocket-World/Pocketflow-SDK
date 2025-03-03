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
  - [🔑 Key Features](#-key-features)
  - [📖 Usage Examples](#-usage-examples)
    - [Connecting to the Socket Server](#connecting-to-the-socket-server)
    - [Running Workflows](#running-workflows)
    - [Handling Events](#handling-events)
  - [📚 API Reference](#-api-reference)
    - [`connectSocket`](#connectsocket)
    - [`runWorkflow`](#runworkflow)
    - [Event Handlers](#event-handlers)
  - [🧪 Examples](#-examples)
    - [Environment Setup](#environment-setup)
    - [Twitter Analysis Example](#twitter-analysis-example)
      - [Running the Example](#running-the-example)
      - [Interactive CLI](#interactive-cli)
      - [Programmatic Usage](#programmatic-usage)
  - [🔐 Authentication](#-authentication)
  - [🛠️ Development](#️-development)
  - [👥 Contributing](#-contributing)
  - [📄 License](#-license)

## 🚀 Installation

```bash
npm install pocketflow-sdk
```

Or with yarn:

```bash
yarn add pocketflow-sdk
```

## ⚡ Quick Start

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";

// Connect to the PocketFlow API
const socket = connectSocket("api.pocketflow.ai", {
  token: "your_api_key_here",
});

// Run a workflow
const cleanup = runWorkflow(
  socket,
  "your-workflow-id",
  "your-auth-token",
  {
    prompt: "Analyze the market trends for AI assistants",
    // Other input parameters specific to your workflow
  },
  {
    prettyLogs: true, // Enable formatted console output
  }
);

// When you're done, clean up event listeners
cleanup();
```

## 🔑 Key Features

- **Real-time Communication**: Connect to PocketFlow's socket server for real-time workflow execution and updates
- **Event-Driven Architecture**: Subscribe to workflow events with customizable handlers
- **TypeScript Support**: Full TypeScript definitions for enhanced developer experience
- **Flexible Configuration**: Customize socket connection and workflow execution options
- **Comprehensive Logging**: Built-in support for detailed or pretty-printed logs
- **Interactive Feedback**: Handle user feedback requests during workflow execution

## 📖 Usage Examples

### Connecting to the Socket Server

```typescript
import { connectSocket } from "pocketflow-sdk";

// Basic connection with default options
const socket = connectSocket();

// Connection with custom options
const socketWithOptions = connectSocket("api.pocketflow.ai", {
  // Authentication token (required for most operations)
  token: "your_token_here",

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
});
```

### Running Workflows

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";

// Connect to the socket server
const socket = connectSocket("api.pocketflow.ai", {
  token: "your_token_here",
});

// Run a workflow with basic options
const cleanup = runWorkflow(socket, "your-workflow-id", "your-auth-token", {
  prompt: "Your workflow input prompt",
  // Other input parameters specific to your workflow
});

// Run a workflow with advanced options
const cleanupAdvanced = runWorkflow(
  socket,
  "your-workflow-id",
  "your-auth-token",
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

// Clean up event listeners when done
cleanup();
cleanupAdvanced();
```

### Handling Events

The SDK supports all events emitted by the PocketFlow server:

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";

// Connect to the socket server
const socket = connectSocket("api.pocketflow.ai", {
  token: "your_token_here",
});

// Custom event handlers
const customHandlers = {
  // Workflow execution events
  run_start: (data) => console.log("Workflow started:", data.message),
  run_complete: (data) => console.log("Workflow completed:", data.message),
  run_error: (data) => console.error("Workflow error:", data.message),
  run_warning: (data) => console.warn("Workflow warning:", data.message),

  // Stream and node events
  stream_output: (data) =>
    console.log(`Output from node ${data.node}:`, data.action),
  node_error: (data) =>
    console.error(`Error in node ${data.node}:`, data.error),
  final_output: (data) => console.log("Final output:", data.data),
};

// Run workflow with custom handlers
const cleanup = runWorkflow(
  socket,
  "your-workflow-id",
  "your-auth-token",
  { prompt: "Your workflow input prompt" },
  { handlers: customHandlers }
);
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

### Twitter Analysis Example

The SDK includes a Twitter competitor analysis example that demonstrates how to use the SDK to analyze Twitter data.

#### Running the Example

```bash
npm run examples:twitter
```

#### Interactive CLI

You can also run the example with the interactive CLI interface:

```bash
npm run examples:twitter:cli
```

The CLI interface supports command-line arguments:

```bash
# Run with specific parameters
npm run examples:twitter:cli -- --token=your_api_key --prompt="AI assistants" --project="A coding assistant" --limit=10

# Show help
npm run examples:twitter:cli -- --help
```

#### Programmatic Usage

```typescript
import { runTwitterAnalysis } from "pocketflow-sdk/examples/twitter";

// Run with environment variables
runTwitterAnalysis();

// Or provide values directly
runTwitterAnalysis({
  authToken: "your_api_key_here",
  endpoint: "https://api.pocketflow.ai",
  input: {
    prompt: "AI assistants for developers",
    project_description: "A coding assistant",
    limit: 10,
  },
});
```

## 🔐 Authentication

The SDK requires an authentication token for connecting to the PocketFlow API. You can obtain a token from the [PocketFlow Dashboard](https://app.pocketflow.ai).

## 🛠️ Development

To set up the SDK for development:

1. Clone the repository:

   ```bash
   git clone https://github.com/pocketflow/sdk.git
   cd sdk
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the SDK:

   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
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
