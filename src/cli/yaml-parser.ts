import * as yaml from "js-yaml";
import { YamlFlow, YamlFlowParam, YamlStep, YamlStepSuccessor } from "./types";

/**
 * Parse YAML content into a YamlFlow object
 * @param yamlContent The YAML content as a string
 * @returns The parsed YamlFlow object
 */
export function parseYamlFlow(yamlContent: string): YamlFlow {
  try {
    console.log("Parsing YAML content:", yamlContent);
    const parsed = yaml.load(yamlContent) as any;
    console.log("Parsed YAML:", JSON.stringify(parsed, null, 2));

    // Validate the YAML structure
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid YAML: Expected an object");
    }

    if (parsed.type !== "flow") {
      throw new Error('Invalid YAML: Type must be "flow"');
    }

    if (!parsed.name || typeof parsed.name !== "string") {
      throw new Error("Invalid YAML: Missing or invalid name");
    }

    if (!Array.isArray(parsed.input)) {
      throw new Error("Invalid YAML: Input must be an array");
    }

    if (!Array.isArray(parsed.outputs)) {
      throw new Error("Invalid YAML: Outputs must be an array");
    }

    if (!Array.isArray(parsed.steps)) {
      console.log("Steps value:", parsed.steps);
      throw new Error("Invalid YAML: Steps must be an array");
    }

    // Transform the input format
    const input = parsed.input.map((item: any) => {
      const [key, value] = Object.entries(item)[0];
      return { [key]: value } as YamlFlowParam;
    });

    // Transform the outputs format
    const outputs = parsed.outputs.map((item: any) => {
      const [key, value] = Object.entries(item)[0];
      return { [key]: value } as YamlFlowParam;
    });

    // Transform the steps format
    const steps = parsed.steps.map((step: any) => {
      // Transform expects format
      const expects = step.expects.map((item: any) => {
        const [key, value] = Object.entries(item)[0];
        return { [key]: value } as YamlFlowParam;
      });

      // Transform outputs format
      const outputs = step.outputs.map((item: any) => {
        const [key, value] = Object.entries(item)[0];
        return { [key]: value } as YamlFlowParam;
      });

      // Transform successor format
      const successor = step.successor.map((item: any) => {
        const [key, value] = Object.entries(item)[0];
        return { [key]: value } as YamlStepSuccessor;
      });

      return {
        name: step.name,
        type: step.type,
        path: step.path,
        expects,
        outputs,
        successor,
        batch_size: step.batch_size,
        max_retries: step.max_retries,
        retry_interval_ms: step.retry_interval_ms,
      } as YamlStep;
    });

    const result = {
      name: parsed.name,
      type: parsed.type,
      input,
      outputs,
      steps,
      config: parsed.config,
      shared_files: parsed.shared_files,
    } as YamlFlow;

    console.log("Transformed result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse YAML flow: ${error.message}`);
    }
    throw new Error("Failed to parse YAML flow: Unknown error");
  }
}

/**
 * Extract input parameter types from a YAML flow
 * @param flow The YAML flow object
 * @returns A record mapping parameter names to their types
 */
export function extractInputTypes(flow: YamlFlow): Record<string, string> {
  const inputTypes: Record<string, string> = {};

  if (flow.input && Array.isArray(flow.input)) {
    flow.input.forEach((param) => {
      const [key, value] = Object.entries(param)[0];
      inputTypes[key] = value;
    });
  }

  return inputTypes;
}

/**
 * Extract output parameter types from a YAML flow
 * @param flow The YAML flow object
 * @returns A record mapping parameter names to their types
 */
export function extractOutputTypes(flow: YamlFlow): Record<string, string> {
  const outputTypes: Record<string, string> = {};

  if (flow.outputs && Array.isArray(flow.outputs)) {
    flow.outputs.forEach((param) => {
      const [key, value] = Object.entries(param)[0];
      outputTypes[key] = value;
    });
  }

  return outputTypes;
}
