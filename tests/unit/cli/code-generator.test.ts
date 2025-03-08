import {
  generateFunctionName,
  generateWorkflowCode,
  generateIndexFile,
  saveGeneratedCode,
} from "../../../src/cli/code-generator";
import { WorkflowDetail } from "../../../src/http/client";
import * as fs from "fs";
import * as path from "path";

// Mock the fs and path modules
jest.mock("fs");
jest.mock("path");

describe("Code Generator", () => {
  describe("generateFunctionName", () => {
    it("should convert workflow names to camelCase function names", () => {
      expect(generateFunctionName("Twitter Monitoring Posts")).toBe(
        "runTwitterMonitoringPostsWorkflow"
      );
      expect(generateFunctionName("Email Newsletter Generator")).toBe(
        "runEmailNewsletterGeneratorWorkflow"
      );
      expect(generateFunctionName("Simple Test")).toBe("runSimpleTestWorkflow");
      expect(generateFunctionName("with-special-chars!@#")).toBe(
        "runWithspecialcharsWorkflow"
      );
      expect(generateFunctionName("UPPERCASE NAME")).toBe(
        "runUPPERCASENAMEWorkflow"
      );
      expect(generateFunctionName("lowercase name")).toBe(
        "runLowercaseNameWorkflow"
      );
      expect(generateFunctionName("Mixed Case Name")).toBe(
        "runMixedCaseNameWorkflow"
      );
    });
  });

  describe("generateWorkflowCode", () => {
    // Sample workflow detail for testing
    const workflowDetail: WorkflowDetail = {
      id: "wf_123456789",
      name: "Test Workflow",
      created_at: "2023-05-15T14:22:31Z",
      updated_at: "2023-05-16T09:11:45Z",
      prompt: "Test workflow description",
      yaml_path: "flows/test_workflow.yaml",
      yaml: "",
      nodes: [
        {
          id: "node_1",
          name: "TestNode",
          type: "test_type",
        },
      ],
      execution_count: 5,
      last_executed_at: "2023-05-16T09:11:45Z",
    };

    // Sample YAML content for testing
    const yamlContent = `
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
`;

    it("should generate TypeScript code for a workflow", () => {
      // Set the YAML content
      workflowDetail.yaml = yamlContent;

      // Generate the code
      const code = generateWorkflowCode(workflowDetail, yamlContent);

      // Check that the code contains expected elements
      expect(code).toContain("import { Socket } from 'socket.io-client';");
      expect(code).toContain("export interface TestWorkflowWorkflowInput {");
      expect(code).toContain("query: string;");
      expect(code).toContain("maxResults: number;");
      expect(code).toContain("export interface TestWorkflowWorkflowOutput {");
      expect(code).toContain("results: string[];");
      expect(code).toContain("count: number;");
      expect(code).toContain("export async function runTestWorkflowWorkflow(");
      expect(code).toContain("input: TestWorkflowWorkflowInput,");
      expect(code).toContain("authToken: string,");
      expect(code).toContain("socket?: any");
      expect(code).toContain("): Promise<TestWorkflowWorkflowOutput> {");
      expect(code).toContain(
        "runWorkflow(socketInstance, 'wf_123456789', authToken, input, { handlers });"
      );
    });

    it("should handle different YAML types correctly", () => {
      // Modified YAML with different types
      const complexYaml = `
type: flow
name: Complex Types
input:
  - stringParam: string
  - numberParam: number
  - booleanParam: boolean
  - arrayParam: array<number>
  - objectParam: object
  - recordParam: Record<string, any>
  - customParam: CustomType
outputs:
  - result: string
steps:
  - name: Step1
    type: test
    path: /test
    expects: []
    outputs: []
    successor: []
`;

      workflowDetail.name = "Complex Types";
      workflowDetail.yaml = complexYaml;

      const code = generateWorkflowCode(workflowDetail, complexYaml);

      // Check type mappings
      expect(code).toContain("stringParam: string;");
      expect(code).toContain("numberParam: number;");
      expect(code).toContain("booleanParam: boolean;");
      expect(code).toContain("arrayParam: number[];");
      expect(code).toContain("objectParam: Record<string, any>;");
      expect(code).toContain("recordParam: Record<string, any>;");
      expect(code).toContain("customParam: any;"); // Custom types default to any
    });
  });

  describe("generateIndexFile", () => {
    it("should generate an index file with exports for all workflow IDs", () => {
      const workflowIds = ["wf_123", "wf_456", "wf_789"];

      const indexContent = generateIndexFile(workflowIds);

      // Check imports
      expect(indexContent).toContain("import * as wf_123 from './wf_123';");
      expect(indexContent).toContain("import * as wf_456 from './wf_456';");
      expect(indexContent).toContain("import * as wf_789 from './wf_789';");

      // Check exports
      expect(indexContent).toContain("export * from './wf_123';");
      expect(indexContent).toContain("export * from './wf_456';");
      expect(indexContent).toContain("export * from './wf_789';");

      // Check namespace exports
      expect(indexContent).toContain("export {");
      expect(indexContent).toContain("  wf_123,");
      expect(indexContent).toContain("  wf_456,");
      expect(indexContent).toContain("  wf_789,");
      expect(indexContent).toContain("};");
    });

    it("should generate an empty index file when no workflow IDs are provided", () => {
      const indexContent = generateIndexFile([]);

      // The function actually returns a minimal export block even for empty arrays
      expect(indexContent).toContain("export {");
      expect(indexContent).toContain("};");
    });
  });

  describe("saveGeneratedCode", () => {
    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();

      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Mock path.join to return a simple path
      (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));
    });

    it("should create the output directory if it doesn't exist", () => {
      saveGeneratedCode("output/dir", "test.ts", "// Test content");

      expect(fs.mkdirSync).toHaveBeenCalledWith("output/dir", {
        recursive: true,
      });
    });

    it("should write the content to the file", () => {
      const outDir = "output/dir";
      const fileName = "test.ts";
      const content = "// Test content";

      saveGeneratedCode(outDir, fileName, content);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "output/dir/test.ts",
        "// Test content",
        "utf8"
      );
    });

    it("should not create the directory if it already exists", () => {
      // Mock fs.existsSync to return true
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      saveGeneratedCode("existing/dir", "test.ts", "// Test content");

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
