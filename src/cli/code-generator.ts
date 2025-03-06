import { WorkflowDetail } from "../http/client";
import { YamlFlow } from "./types";
import {
  parseYamlFlow,
  extractInputTypes,
  extractOutputTypes,
} from "./yaml-parser";
import { mapYamlTypeToTs } from "./types";
import * as fs from "fs";
import * as path from "path";

/**
 * Generate a camelCase function name from a workflow name
 * @param workflowName The original workflow name
 * @returns A camelCase function name
 */
export function generateFunctionName(workflowName: string): string {
  // Convert workflow name to camelCase
  const sanitized = workflowName
    .replace(/[^\w\s]/g, "") // Remove special characters
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase()) // Convert spaces + next char to uppercase
    .replace(/\s/g, "") // Remove remaining spaces
    .replace(/^(.)/, (_, c) => c.toLowerCase()); // Ensure first char is lowercase

  return `run${sanitized.charAt(0).toUpperCase() + sanitized.slice(1)}Workflow`;
}

/**
 * Generate TypeScript code for a workflow wrapper function
 * @param workflow The workflow detail from the API
 * @param yamlSchema The YAML schema content
 * @returns The generated TypeScript code
 */
export function generateWorkflowCode(
  workflow: WorkflowDetail,
  yamlSchema: string
): string {
  try {
    const flow = parseYamlFlow(yamlSchema);
    const functionName = generateFunctionName(workflow.name);
    const inputTypes = extractInputTypes(flow);
    const outputTypes = extractOutputTypes(flow);

    // Convert YAML types to TypeScript types
    const tsInputTypes: Record<string, string> = {};
    Object.entries(inputTypes).forEach(([key, value]) => {
      tsInputTypes[key] = mapYamlTypeToTs(value);
    });

    const tsOutputTypes: Record<string, string> = {};
    Object.entries(outputTypes).forEach(([key, value]) => {
      tsOutputTypes[key] = mapYamlTypeToTs(value);
    });

    // Generate input interface
    const inputInterfaceName = `${functionName.replace(/^run/, "")}Input`;
    let inputInterface = `export interface ${inputInterfaceName} {\n`;
    Object.entries(tsInputTypes).forEach(([key, type]) => {
      inputInterface += `  ${key}: ${type};\n`;
    });
    inputInterface += "}\n\n";

    // Generate output interface
    const outputInterfaceName = `${functionName.replace(/^run/, "")}Output`;
    let outputInterface = `export interface ${outputInterfaceName} {\n`;
    Object.entries(tsOutputTypes).forEach(([key, type]) => {
      outputInterface += `  ${key}: ${type};\n`;
    });
    outputInterface += "}\n\n";

    // Generate function
    const functionCode = `
/**
 * Run the "${workflow.name}" workflow
 * @param input The input parameters for the workflow
 * @param authToken Authentication token for the workflow
 * @param socket Optional socket instance (if not provided, a new connection will be created)
 * @returns A promise that resolves with the workflow output
 */
export async function ${functionName}(
  input: ${inputInterfaceName},
  authToken: string,
  socket?: any
): Promise<${outputInterfaceName}> {
  // If socket is not provided, we'll need to create a connection
  const isInternalSocket = !socket;
  let socketInstance = socket;

  try {
    if (isInternalSocket) {
      // Import here to avoid circular dependencies
      const { connectSocket } = await import('../socket/connect');
      socketInstance = await connectSocket(process.env.POCKETFLOW_SERVER_URL || "api.pocketflow.ai", { token: authToken });
    }

    // Import runWorkflow
    const { runWorkflow } = await import('../socket/workflow');

    // Create a promise to handle the workflow result
    return new Promise((resolve, reject) => {
      try {
        // Setup handlers
        const handlers = {
          run_complete: (data: any) => {
            resolve(data as ${outputInterfaceName});
          },
          run_error: (error: any) => {
            reject(new Error(error.message || 'Workflow execution failed'));
          }
        };

        // Run the workflow
        runWorkflow(socketInstance, '${workflow.id}', authToken, input, { handlers });
      } catch (error) {
        reject(error);
      }
    });
  } finally {
    // Clean up if we created the socket internally
    if (isInternalSocket && socketInstance?.disconnect) {
      socketInstance.disconnect();
    }
  }
}`;

    // Combine all the code
    return `import { Socket } from 'socket.io-client';\n\n${inputInterface}${outputInterface}${functionCode}\n`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate workflow code: ${error.message}`);
    }
    throw new Error("Failed to generate workflow code: Unknown error");
  }
}

/**
 * Generate an index file that exports all workflow functions
 * @param workflowIds List of workflow IDs that have been generated
 * @returns The content of the index file
 */
export function generateIndexFile(workflowIds: string[]): string {
  let indexContent = "";

  // Add imports
  workflowIds.forEach((id) => {
    indexContent += `import * as ${id} from './${id}';\n`;
  });

  indexContent += "\n";

  // Add exports
  workflowIds.forEach((id) => {
    indexContent += `export * from './${id}';\n`;
  });

  // Export named imports as well for convenience
  indexContent += "\n// Export as namespace\n";
  indexContent += "export {\n";
  workflowIds.forEach((id) => {
    indexContent += `  ${id},\n`;
  });
  indexContent += "};\n";

  return indexContent;
}

/**
 * Save generated code to a file
 * @param outDir The output directory
 * @param fileName The file name
 * @param content The content to save
 */
export function saveGeneratedCode(
  outDir: string,
  fileName: string,
  content: string
): void {
  try {
    // Ensure directory exists
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const filePath = path.join(outDir, fileName);
    fs.writeFileSync(filePath, content, "utf8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save generated code: ${error.message}`);
    }
    throw new Error("Failed to save generated code: Unknown error");
  }
}
