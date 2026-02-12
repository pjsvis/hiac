import { test, expect, describe } from "bun:test";
import { getProvider, isCloudModel } from "@src/factory.ts";
import { OllamaProvider } from "@src/providers/ollama.ts";
import { CloudProvider } from "@src/providers/cloud.ts";

describe("getProvider", () => {
  test("returns OllamaProvider for simple model names", () => {
    const provider = getProvider("llama3");
    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  test("returns OllamaProvider for local-style names", () => {
    const provider = getProvider("llama3.1:8b");
    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  test("returns CloudProvider for gpt- prefix", () => {
    const provider = getProvider("gpt-4");
    expect(provider).toBeInstanceOf(CloudProvider);
  });

  test("returns CloudProvider for slash-separated names", () => {
    const provider = getProvider("anthropic/claude-3-opus");
    expect(provider).toBeInstanceOf(CloudProvider);
  });
});

describe("isCloudModel", () => {
  test("returns false for local models", () => {
    expect(isCloudModel("llama3")).toBe(false);
    expect(isCloudModel("mistral")).toBe(false);
    expect(isCloudModel("phi3.5:latest")).toBe(false);
  });

  test("returns true for gpt- prefix", () => {
    expect(isCloudModel("gpt-4")).toBe(true);
    expect(isCloudModel("gpt-4o-mini")).toBe(true);
    expect(isCloudModel("gpt-3.5-turbo")).toBe(true);
  });

  test("returns true for slash-separated names", () => {
    expect(isCloudModel("anthropic/claude-3-opus")).toBe(true);
    expect(isCloudModel("openai/gpt-4")).toBe(true);
    expect(isCloudModel("meta-llama/llama-3-70b")).toBe(true);
  });
});
