/**
 * Types representing the YAML schema structure for workflows
 */

export interface YamlFlowParam {
  [key: string]: string; // Parameter name and its type
}

export interface YamlStepSuccessor {
  [key: string]: string; // Action and target node pairs
}

export interface YamlStep {
  name: string;
  type: "node" | "batched_node";
  path: string;
  expects: YamlFlowParam[];
  outputs: YamlFlowParam[];
  successor: YamlStepSuccessor[];
  batch_size?: number;
  max_retries?: number;
  retry_interval_ms?: number;
}

export interface YamlFlow {
  name: string;
  type: "flow";
  input: YamlFlowParam[];
  config?: YamlFlowParam[];
  outputs: YamlFlowParam[];
  shared_files?: string[];
  steps: YamlStep[];
}

/**
 * Interface for a workflow code generator configuration
 */
export interface GeneratorConfig {
  outDir: string;
  sdkPath: string;
  addComments: boolean;
}

/**
 * Interface for CLI options
 */
export interface CliOptions {
  auth: {
    apiKey?: string;
  };
  outDir: string;
  verbose: boolean;
}

/**
 * Type mapping from YAML types to TypeScript types
 */
export const typeMapping: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  array: "any[]",
  object: "Record<string, any>",
  any: "any",
  // Add more mappings as needed
};

/**
 * Converts a YAML type to a TypeScript type
 * @param yamlType The YAML type string
 * @returns The corresponding TypeScript type
 */
export function mapYamlTypeToTs(yamlType: string): string {
  // Handle array types like "string[]" or "array<string>"
  if (yamlType.endsWith("[]")) {
    const baseType = yamlType.slice(0, -2);
    return `${mapYamlTypeToTs(baseType)}[]`;
  }

  if (yamlType.startsWith("array<") && yamlType.endsWith(">")) {
    const innerType = yamlType.slice(6, -1);
    return `${mapYamlTypeToTs(innerType)}[]`;
  }

  // Handle record/map types like "Record<string, any>" or "Map<string, number>"
  if (yamlType.startsWith("Record<") || yamlType.startsWith("Map<")) {
    return yamlType; // Keep as is, it's already a TypeScript type
  }

  // Handle custom types that might not be in our mapping
  return typeMapping[yamlType] || "any";
}
