import {
  parseYamlFlow,
  extractInputTypes,
  extractOutputTypes,
} from "../../../src/cli/yaml-parser";
import { YamlFlow } from "../../../src/cli/types";

describe("YAML Parser", () => {
  // Sample YAML content for testing
  const validYamlContent = `
type: flow
name: Test Workflow
input:
  - query: string
  - maxResults: number
outputs:
  - results: array<string>
  - count: number
steps:
  - name: FetchData
    type: api_call
    path: /fetch
    expects:
      - query: string
      - limit: number
    outputs:
      - data: array<object>
    successor:
      - success: ProcessData
    batch_size: 10
    max_retries: 3
    retry_interval_ms: 1000
  - name: ProcessData
    type: transform
    path: /transform
    expects:
      - data: array<object>
    outputs:
      - results: array<string>
      - count: number
    successor:
      - success: END
    batch_size: 5
    max_retries: 2
    retry_interval_ms: 500
config:
  - timeout: 30000
shared_files:
  - utils.js
`;

  describe("parseYamlFlow", () => {
    it("should parse valid YAML content correctly", () => {
      const result = parseYamlFlow(validYamlContent);

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Workflow");
      expect(result.type).toBe("flow");
      expect(Array.isArray(result.input)).toBe(true);
      expect(Array.isArray(result.outputs)).toBe(true);
      expect(Array.isArray(result.steps)).toBe(true);

      // Check input parameters
      expect(result.input.length).toBe(2);
      expect(result.input[0]).toHaveProperty("query");
      expect(result.input[1]).toHaveProperty("maxResults");

      // Check output parameters
      expect(result.outputs.length).toBe(2);
      expect(result.outputs[0]).toHaveProperty("results");
      expect(result.outputs[1]).toHaveProperty("count");

      // Check steps
      expect(result.steps.length).toBe(2);
      expect(result.steps[0].name).toBe("FetchData");
      expect(result.steps[0].type).toBe("api_call");
      expect(result.steps[0].expects.length).toBe(2);
      expect(result.steps[0].outputs.length).toBe(1);
      expect(result.steps[0].successor.length).toBe(1);

      // Check config and shared_files
      expect(result.config).toBeDefined();
      expect(result.config?.length).toBe(1);
      expect(result.shared_files).toBeDefined();
      expect(result.shared_files?.length).toBe(1);
    });

    it("should throw an error for invalid YAML content", () => {
      const invalidYaml = `
type: invalid
name: Test
`;
      expect(() => parseYamlFlow(invalidYaml)).toThrow(
        'Invalid YAML: Type must be "flow"'
      );
    });

    it("should throw an error for missing required fields", () => {
      const missingInputYaml = `
type: flow
name: Test Workflow
outputs:
  - results: array<string>
steps:
  - name: Step1
    type: test
    path: /test
    expects: []
    outputs: []
    successor: []
`;
      expect(() => parseYamlFlow(missingInputYaml)).toThrow(
        "Invalid YAML: Input must be an array"
      );
    });
  });

  describe("extractInputTypes", () => {
    it("should extract input types from a YAML flow", () => {
      const flow = parseYamlFlow(validYamlContent);
      const inputTypes = extractInputTypes(flow);

      expect(inputTypes).toEqual({
        query: "string",
        maxResults: "number",
      });
    });

    it("should return an empty object for a flow with no inputs", () => {
      const noInputFlow: YamlFlow = {
        name: "Test",
        type: "flow",
        input: [],
        outputs: [],
        steps: [],
      };

      const inputTypes = extractInputTypes(noInputFlow);
      expect(inputTypes).toEqual({});
    });
  });

  describe("extractOutputTypes", () => {
    it("should extract output types from a YAML flow", () => {
      const flow = parseYamlFlow(validYamlContent);
      const outputTypes = extractOutputTypes(flow);

      expect(outputTypes).toEqual({
        results: "array<string>",
        count: "number",
      });
    });

    it("should return an empty object for a flow with no outputs", () => {
      const noOutputFlow: YamlFlow = {
        name: "Test",
        type: "flow",
        input: [],
        outputs: [],
        steps: [],
      };

      const outputTypes = extractOutputTypes(noOutputFlow);
      expect(outputTypes).toEqual({});
    });
  });
});
