import * as yaml from "js-yaml";
import { YamlFlow } from "./types";

/**
 * Parse YAML content into a YamlFlow object
 * @param yamlContent The YAML content as a string
 * @returns The parsed YamlFlow object
 */
export function parseYamlFlow(yamlContent: string): YamlFlow {
  try {
    const flow = yaml.load(yamlContent) as YamlFlow;

    // Validate the YAML structure
    if (!flow || typeof flow !== "object") {
      throw new Error("Invalid YAML: Expected an object");
    }

    if (flow.type !== "flow") {
      throw new Error('Invalid YAML: Type must be "flow"');
    }

    if (!flow.name || typeof flow.name !== "string") {
      throw new Error("Invalid YAML: Missing or invalid name");
    }

    if (!Array.isArray(flow.input)) {
      throw new Error("Invalid YAML: Input must be an array");
    }

    if (!Array.isArray(flow.outputs)) {
      throw new Error("Invalid YAML: Outputs must be an array");
    }

    if (!Array.isArray(flow.steps)) {
      throw new Error("Invalid YAML: Steps must be an array");
    }

    return flow;
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
