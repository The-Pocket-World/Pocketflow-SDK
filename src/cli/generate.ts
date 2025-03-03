import {
  ApiAuth,
  listWorkflows,
  getWorkflowDetail,
  NotFoundError,
} from "../index";
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
  const serverUrl = env.SERVER_URL || "http://localhost:8080";

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
    const failedWorkflows: Array<{ id: string; name: string; error: string }> =
      [];

    // Process each workflow
    for (const workflow of workflows) {
      if (verbose) {
        console.log(
          `Processing workflow: ${workflow.name} (${workflow.id})...`
        );
      }

      try {
        // Get workflow details
        if (verbose) {
          console.log(`Fetching details for workflow ${workflow.id}...`);
        }

        const workflowDetail = await getWorkflowDetail(
          {
            apiKey,
            verbose,
          },
          workflow.id
        );

        // Check for different response structures
        // The API might return YAML content in different properties
        let yamlContent = workflowDetail.yaml;
        let workflowToUse = workflowDetail;

        // Handle case where the response has a nested workflow object with yamlContent
        if (
          !yamlContent &&
          workflowDetail.workflow &&
          workflowDetail.workflow.yamlContent
        ) {
          yamlContent = workflowDetail.workflow.yamlContent;

          // Create a compatible workflowDetail object using the nested workflow data
          workflowToUse = {
            ...workflowDetail,
            id: workflowDetail.workflow.id || workflow.id,
            name: workflowDetail.workflow.name || workflow.name,
            yaml: workflowDetail.workflow.yamlContent,
            yaml_path: workflowDetail.workflow.yamlPath || "",
            nodes: workflowDetail.nodes || [],
          };

          if (verbose) {
            console.log(`Found YAML content in workflow.yamlContent property`);
          }
        }

        if (!yamlContent) {
          const errorMsg = `No YAML content found for workflow ${workflow.id}`;
          console.error(errorMsg);
          failedWorkflows.push({
            id: workflow.id,
            name: workflow.name,
            error: errorMsg,
          });
          continue; // Skip this workflow
        }

        // Generate TypeScript code
        const code = generateWorkflowCode(workflowToUse, yamlContent);

        // Save the generated code
        const fileName = `${workflow.id}.ts`;
        saveGeneratedCode(flowsDir, fileName, code);

        generatedIds.push(workflow.id);

        if (verbose) {
          console.log(`Generated ${fileName}`);
        }
      } catch (error) {
        // Special handling for NotFoundError - just skip the workflow
        if (error instanceof NotFoundError) {
          const errorMsg = `Workflow ${workflow.name} (${workflow.id}) not found. This may happen if the workflow exists in the list but its details cannot be retrieved.`;
          console.error(errorMsg);
          failedWorkflows.push({
            id: workflow.id,
            name: workflow.name,
            error: "Not found - workflow may be inaccessible or deleted",
          });
          continue;
        }

        // Log error but continue with other workflows
        const errorMessage =
          error instanceof Error ? error.message : JSON.stringify(error);

        failedWorkflows.push({
          id: workflow.id,
          name: workflow.name,
          error: errorMessage,
        });

        if (error instanceof Error) {
          console.error(
            `Error processing workflow ${workflow.name} (${workflow.id}): ${error.message}`
          );
          // Log stack trace for debugging
          console.error(`Stack trace: ${error.stack}`);
        } else {
          console.error(
            `Error processing workflow ${workflow.name} (${
              workflow.id
            }): ${JSON.stringify(error)}`
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
        `\nGeneration complete. ${generatedIds.length} workflows processed successfully.`
      );

      if (failedWorkflows.length > 0) {
        console.log(`\n${failedWorkflows.length} workflows failed to process:`);
        failedWorkflows.forEach((failed) => {
          console.log(`- ${failed.name} (${failed.id}): ${failed.error}`);
        });
      }

      console.log(`Output directory: ${flowsDir}`);
    } else {
      // Even in non-verbose mode, show a summary of successes and failures
      console.log(
        `Generation complete. ${generatedIds.length} workflows processed successfully, ${failedWorkflows.length} failed.`
      );

      // Always show failed workflows even in non-verbose mode
      if (failedWorkflows.length > 0) {
        console.log(`\nFailed workflows:`);
        failedWorkflows.forEach((failed) => {
          console.log(`- ${failed.name} (${failed.id}): ${failed.error}`);
        });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Workflow generation failed: ${error.message}`);
    }
    throw new Error("Workflow generation failed: Unknown error");
  }
}
