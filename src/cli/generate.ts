import { ApiAuth, listWorkflows, getWorkflowDetail } from "../index";
import { CliOptions } from "./types";
import {
  generateWorkflowCode,
  generateIndexFile,
  saveGeneratedCode,
} from "./code-generator";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import env from "../env";

/**
 * Generate TypeScript types and wrappers for workflows
 * @param options CLI options
 */
export async function generateWorkflowTypes(
  options: CliOptions
): Promise<void> {
  const { auth, outDir, verbose } = options;

  // Get auth from environment variables if not provided in options
  const apiKey = auth.apiKey || env.API_KEY;
  const serverUrl = env.SERVER_URL;

  // Validate auth
  if (!apiKey) {
    throw new Error(
      "Authentication required: Please provide an API key via options, the POCKETFLOW_API_KEY environment variable, or a .env file in your current directory"
    );
  }

  if (verbose) {
    console.log(
      `Using API key: ${apiKey.substring(0, 4)}...${apiKey.substring(
        apiKey.length - 4
      )} (masked for security)`
    );
    if (serverUrl) {
      console.log(`Using server URL: ${serverUrl}`);
    }
  }

  // Create output directory if it doesn't exist
  const flowsDir = path.resolve(process.cwd(), outDir);
  if (!fs.existsSync(flowsDir)) {
    fs.mkdirSync(flowsDir, { recursive: true });
    if (verbose) {
      console.log(`Created output directory: ${flowsDir}`);
    }
  }

  try {
    // Log progress
    if (verbose) {
      console.log("Fetching workflows...");
    }

    // Get all workflows using auth from env vars or options
    try {
      const workflowsResponse = await listWorkflows({
        apiKey,
        verbose,
      });
      const workflows = workflowsResponse.workflows;

      if (workflows.length === 0) {
        if (verbose) {
          console.log("No workflows found.");
        }
        return;
      }

      if (verbose) {
        console.log(`Found ${workflows.length} workflow(s).`);
      }

      // Track workflow IDs for index generation
      const generatedIds: string[] = [];

      // Process each workflow
      for (const workflow of workflows) {
        if (verbose) {
          console.log(
            `Processing workflow: ${workflow.name} (${workflow.id})...`
          );
        }

        try {
          // Get workflow details
          const workflowDetail = await getWorkflowDetail(
            {
              apiKey,
              verbose,
            },
            workflow.id
          );

          // Fetch YAML content
          let yamlContent: string;

          if (workflowDetail.yaml_path) {
            try {
              // Fetch from actual YAML path
              if (verbose) {
                console.log(`Fetching YAML from: ${workflowDetail.yaml_path}`);
              }
              const yamlResponse = await axios.get(workflowDetail.yaml_path);
              yamlContent = yamlResponse.data;
            } catch (error) {
              // Fall back to sample YAML
              if (verbose) {
                console.log(
                  `Could not fetch YAML, generating sample: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              }
              yamlContent = generateSampleYaml(workflowDetail);
            }
          } else {
            // Create sample YAML based on workflow details
            if (verbose) {
              console.log(`No YAML path provided, generating sample.`);
            }
            yamlContent = generateSampleYaml(workflowDetail);
          }

          // Generate TypeScript code
          const code = generateWorkflowCode(workflowDetail, yamlContent);

          // Save the generated code
          const fileName = `${workflow.id}.ts`;
          saveGeneratedCode(flowsDir, fileName, code);

          generatedIds.push(workflow.id);

          if (verbose) {
            console.log(`Generated ${fileName}`);
          }
        } catch (error) {
          // Log error but continue with other workflows
          if (error instanceof Error) {
            console.error(
              `Error processing workflow ${workflow.id}: ${error.message}`
            );
          } else {
            console.error(
              `Error processing workflow ${workflow.id}: Unknown error`
            );
          }
        }
      }

      // Generate index file
      if (generatedIds.length > 0) {
        const indexContent = generateIndexFile(generatedIds);
        saveGeneratedCode(flowsDir, "index.ts", indexContent);

        if (verbose) {
          console.log(
            `Generated index.ts with ${generatedIds.length} workflow exports`
          );
        }
      }

      // Final summary
      if (verbose) {
        console.log(
          `\nGeneration complete. ${generatedIds.length} workflows processed.`
        );
        console.log(`Output directory: ${flowsDir}`);
      }
    } catch (error) {
      if (verbose) {
        console.error("Detailed error:", error);
      }
      if (error instanceof Error) {
        throw new Error(`Failed to fetch workflows: ${error.message}`);
      }
      throw new Error("Failed to fetch workflows: Unknown error");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Workflow generation failed: ${error.message}`);
    }
    throw new Error("Workflow generation failed: Unknown error");
  }
}

/**
 * Generate a sample YAML schema for a workflow when the actual YAML is not available
 * This is for demonstration purposes - in a real implementation, you'd use the actual YAML
 * @param workflow The workflow details
 * @returns A sample YAML string
 */
function generateSampleYaml(workflow: any): string {
  // Create a basic YAML structure based on the workflow
  return `name: ${workflow.name}
type: flow
input:
  - query: string
  - maxResults: number
outputs:
  - results: array
  - success: boolean
steps:
${
  workflow.nodes
    ? workflow.nodes
        .map(
          (node: any) => `
  - name: ${node.name}
    type: node
    path: nodes/${node.name.toLowerCase()}.ts
    expects:
      - query: string
    outputs:
      - results: array
    successor:
      - default: ${
        workflow.nodes.indexOf(node) < workflow.nodes.length - 1
          ? workflow.nodes[workflow.nodes.indexOf(node) + 1].name
          : "__COMPLETE__"
      }
      - err: __ABORT__
`
        )
        .join("")
    : ""
}
`;
}
