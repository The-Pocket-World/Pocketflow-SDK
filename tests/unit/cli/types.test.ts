import { mapYamlTypeToTs, typeMapping } from "../../../src/cli/types";

describe("Type Mapping", () => {
  describe("mapYamlTypeToTs", () => {
    it("should map basic YAML types to TypeScript types", () => {
      expect(mapYamlTypeToTs("string")).toBe("string");
      expect(mapYamlTypeToTs("number")).toBe("number");
      expect(mapYamlTypeToTs("boolean")).toBe("boolean");
      expect(mapYamlTypeToTs("array")).toBe("any[]");
      expect(mapYamlTypeToTs("object")).toBe("Record<string, any>");
      expect(mapYamlTypeToTs("any")).toBe("any");
    });

    it("should handle array types with []", () => {
      expect(mapYamlTypeToTs("string[]")).toBe("string[]");
      expect(mapYamlTypeToTs("number[]")).toBe("number[]");
      expect(mapYamlTypeToTs("boolean[]")).toBe("boolean[]");
      expect(mapYamlTypeToTs("object[]")).toBe("Record<string, any>[]");
    });

    it("should handle array types with array<type> syntax", () => {
      expect(mapYamlTypeToTs("array<string>")).toBe("string[]");
      expect(mapYamlTypeToTs("array<number>")).toBe("number[]");
      expect(mapYamlTypeToTs("array<boolean>")).toBe("boolean[]");
      expect(mapYamlTypeToTs("array<object>")).toBe("Record<string, any>[]");
    });

    it("should handle Record and Map types", () => {
      expect(mapYamlTypeToTs("Record<string, any>")).toBe(
        "Record<string, any>"
      );
      expect(mapYamlTypeToTs("Map<string, number>")).toBe(
        "Map<string, number>"
      );
      expect(mapYamlTypeToTs("Record<string, string[]>")).toBe(
        "Record<string, string[]>"
      );
    });

    it("should default to 'any' for unknown types", () => {
      expect(mapYamlTypeToTs("CustomType")).toBe("any");
      expect(mapYamlTypeToTs("UnknownType")).toBe("any");
      expect(mapYamlTypeToTs("SomeSpecialType")).toBe("any");
    });

    it("should handle nested array types", () => {
      expect(mapYamlTypeToTs("array<array<string>>")).toBe("string[][]");
      expect(mapYamlTypeToTs("array<string[]>")).toBe("string[][]");
    });
  });

  describe("typeMapping", () => {
    it("should contain mappings for all basic types", () => {
      expect(typeMapping).toHaveProperty("string", "string");
      expect(typeMapping).toHaveProperty("number", "number");
      expect(typeMapping).toHaveProperty("boolean", "boolean");
      expect(typeMapping).toHaveProperty("array", "any[]");
      expect(typeMapping).toHaveProperty("object", "Record<string, any>");
      expect(typeMapping).toHaveProperty("any", "any");
    });
  });
});
