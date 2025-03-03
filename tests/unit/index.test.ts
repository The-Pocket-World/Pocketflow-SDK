import * as sdk from "../../src/index";

describe("SDK Exports", () => {
  it("should export socket connection functions", () => {
    expect(sdk.connectSocket).toBeDefined();
    expect(typeof sdk.connectSocket).toBe("function");

    expect(sdk.runWorkflow).toBeDefined();
    expect(typeof sdk.runWorkflow).toBe("function");
  });

  it("should export default handlers", () => {
    expect(sdk.defaultSocketConnectionHandler).toBeDefined();
    expect(typeof sdk.defaultSocketConnectionHandler).toBe("function");

    expect(sdk.defaultSocketDisconnectionHandler).toBeDefined();
    expect(typeof sdk.defaultSocketDisconnectionHandler).toBe("function");

    expect(sdk.defaultFeedbackRequestHandler).toBeDefined();
    expect(typeof sdk.defaultFeedbackRequestHandler).toBe("function");

    expect(sdk.defaultWorkflowLogHandler).toBeDefined();
    expect(typeof sdk.defaultWorkflowLogHandler).toBe("function");
  });

  it("should export all required types", () => {
    // We can't directly test TypeScript types at runtime
    // Instead, we'll check that the SDK has the expected exports
    // by checking the compiled JavaScript module

    // Get all exported properties
    const exportedProperties = Object.keys(sdk);

    // Check for function exports
    const expectedFunctionExports = [
      "connectSocket",
      "runWorkflow",
      "defaultSocketConnectionHandler",
      "defaultSocketDisconnectionHandler",
      "defaultFeedbackRequestHandler",
      "defaultWorkflowLogHandler",
    ];

    expectedFunctionExports.forEach((funcName) => {
      expect(exportedProperties).toContain(funcName);
    });

    // Note: TypeScript types are not present in the compiled JavaScript
    // so we can't test for them directly. They're only used during compilation.
  });
});
