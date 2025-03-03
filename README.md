# PocketFlow SDK

A TypeScript SDK for interacting with the PocketFlow API.

## Installation

```bash
npm install pocketflow-sdk
```

## Running Examples

The SDK includes example implementations that demonstrate how to use the SDK with real-world workflows.

### Environment Setup

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your PocketFlow API key and server URL:
   ```
   POCKETFLOW_API_KEY=your_api_key_here
   POCKETFLOW_SERVER_URL=http://localhost:8080
   ```

### Running the Twitter Analysis Example

Run the Twitter competitor analysis example:

```bash
npm run examples:twitter
```

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

You can also provide the API key and server URL directly when running the example:

```typescript
import { runTwitterAnalysis } from "pocketflow-sdk/examples/twitter";

// Run with environment variables
runTwitterAnalysis();

// Or provide values directly
runTwitterAnalysis({
  authToken: "your_api_key_here",
  endpoint: "http://your-server-url",
  input: {
    prompt: "AI assistants for developers",
    project_description: "A coding assistant",
    limit: 10,
  },
});
```

## Usage

### Connecting to the Socket Server

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";

// Connect to the socket server with options
const socket = connectSocket("api.pocketflow.ai", {
  // Authentication token (required)
  token: "your_token_here",

  // Optional handlers
  handleLog: (data) => console.log("Workflow log:", data),
  handleFeedback: (data) => prompt(data.prompt),
  handleConnection: () => console.log("Socket connected!"),
  handleDisconnection: (reason) => console.log("Socket disconnected:", reason),

  // You can also provide custom event handlers for server-emitted events
  eventHandlers: {
    run_start: (data) => console.log("Workflow started:", data.message),
    run_complete: (data) => console.log("Workflow completed:", data.message),
  },
});

// Run a workflow with default handlers
const cleanup = runWorkflow(socket, "your-workflow-id", "your-auth-token", {
  prompt: "Your prompt",
  // Other input parameters
});

// When you're done, clean up the event listeners
cleanup();
```

### Enhanced Workflow Runner

The SDK provides an enhanced workflow runner with support for all server-emitted events and customizable handlers:

```typescript
import { connectSocket, runWorkflow } from "pocketflow-sdk";

// Connect with authentication token
const socket = connectSocket("api.pocketflow.ai", {
  token: "your_token_here",
});

// Run a workflow with pretty logs
const cleanup = runWorkflow(
  socket,
  "your-workflow-id",
  "your-auth-token",
  { prompt: "Your prompt" },
  {
    // Enable pretty logs for a premium developer experience
    prettyLogs: true,

    // Customize specific event handlers
    handlers: {
      run_complete: (data) => {
        console.log("Workflow completed with custom handler!");
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
```

### Server-Emitted Events

The SDK supports all events emitted by the server:

```typescript
// Import the ServerEmittedEvents interface to see all available events
import { ServerEmittedEvents } from "pocketflow-sdk";

// Example of using custom handlers for specific events
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

// Use these handlers when running a workflow
const cleanup = runWorkflow(
  socket,
  "your-workflow-id",
  "your-auth-token",
  { prompt: "Your prompt" },
  { handlers: customHandlers }
);
```

## API Reference

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

## Authentication

The SDK requires an authentication token for connecting to the PocketFlow API. You can obtain a token from the [PocketFlow Dashboard](https://app.pocketflow.ai).

```typescript
// Connect with authentication token
const socket = connectSocket("api.pocketflow.ai", {
  token: "your_token_here",
});
```

## License

Apache License 2.0
