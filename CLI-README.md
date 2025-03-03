# PocketFlow CLI

The PocketFlow CLI allows you to generate type-safe TypeScript wrappers for your workflows.

## Installation

The CLI is included in the PocketFlow SDK:

```bash
npm install pocketflow-sdk
```

## Usage

### Initialize Configuration

Create a default configuration file in your project:

```bash
npx pocketflow init
```

This will create a `.pocketflowrc.json` file in your project root with the following structure:

```json
{
  "auth": {
    "apiKey": "pfl_your_api_key"
  },
  "outDir": "src/flows",
  "verbose": false
}
```

Edit this file to add your actual API key or JWT token.

### Generate Workflow Types

Generate TypeScript types for your workflows:

```bash
npx pocketflow generate
```

This will:

1. Fetch all workflows from your account
2. Generate TypeScript interfaces for input/output types
3. Create type-safe wrapper functions
4. Save them in the specified output directory (default: `src/flows`)

### Authentication Options

You have several options for providing your API key:

1. **Command line argument**:

   ```bash
   npx pocketflow generate -k pfl_your_api_key
   ```

2. **Configuration file** (`.pocketflowrc.json`):

   ```json
   {
     "auth": {
       "apiKey": "pfl_your_api_key"
     }
   }
   ```

3. **Environment variable**:

   ```bash
   export POCKETFLOW_API_KEY=pfl_your_api_key
   npx pocketflow generate
   ```

4. **Environment file** (`.env`):

   Create a `.env` file in your project directory:

   ```
   POCKETFLOW_API_KEY=pfl_your_api_key
   # Use a custom server if needed (defaults to https://api.pocketflow.app)
   POCKETFLOW_SERVER_URL=http://localhost:8080
   ```

   Then run the command:

   ```bash
   npx pocketflow generate
   ```

   The CLI will automatically detect and use the `.env` file in the current working directory.

### Using a Custom Server

If you need to connect to a different PocketFlow API server:

1. **Environment variable**:

   ```bash
   export POCKETFLOW_SERVER_URL=http://localhost:8080
   npx pocketflow generate
   ```

2. **Environment file** (`.env`):

   ```
   POCKETFLOW_API_KEY=pfl_your_api_key
   POCKETFLOW_SERVER_URL=http://localhost:8080
   ```

Important notes:

- Do NOT include `/v1` or any other API version in the server URL
- The URL should only include the base domain or host and port
- The SDK will automatically handle the appropriate API paths

The server URL setting is particularly useful for:

- Local development with a local API server
- Testing with staging environments
- Enterprise deployments with custom API endpoints

### Command Line Options

You can override configuration options using command line arguments:

```bash
npx pocketflow generate -k pfl_your_api_key -o custom/output/dir -v
```

Available options:

- `-k, --api-key <key>`: PocketFlow API key
- `-t, --token <token>`: JWT token (alternative to API key)
- `-o, --out-dir <dir>`: Output directory (default: `src/flows`)
- `-v, --verbose`: Enable verbose output

## Generated Code

The CLI generates the following files:

1. TypeScript files for each workflow with:

   - Input and output interfaces
   - Type-safe wrapper function

2. An index file that exports all workflow functions

### Example

For a workflow named "Twitter Monitoring", the CLI generates:

```typescript
// wf_123456789.ts
import { runWorkflow } from "../socket/workflow";

export interface TwitterMonitoringWorkflowInput {
  query: string;
  maxResults: number;
}

export interface TwitterMonitoringWorkflowOutput {
  results: any[];
  success: boolean;
}

/**
 * Run the "Twitter Monitoring" workflow
 * @param input The input parameters for the workflow
 * @param socketUrl Optional socket URL override
 * @returns A promise that resolves with the workflow output
 */
export async function runTwitterMonitoringWorkflow(
  input: TwitterMonitoringWorkflowInput,
  socketUrl?: string
): Promise<TwitterMonitoringWorkflowOutput> {
  return runWorkflow(
    "wf_123456789",
    input,
    socketUrl
  ) as Promise<TwitterMonitoringWorkflowOutput>;
}
```

## Using Generated Functions

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

## Best Practices

1. Run the CLI after creating or updating workflows in PocketFlow
2. Commit the generated files to your repository
3. Use the type-safe functions instead of the generic `runWorkflow` function

## Troubleshooting

### Authentication Issues

If you see authentication errors, check that:

- Your API key or JWT token is valid
- You have the correct permissions for the workflows

### YAML Parsing Issues

The CLI relies on the YAML schema returned by the API. If you encounter parsing issues:

- Check that your workflow YAML schemas are valid
- Ensure the schema follows the required format for inputs/outputs

### Missing Dependencies

If you see module not found errors, install the required dependencies:

```bash
npm install js-yaml commander axios
npm install --save-dev @types/js-yaml
```
