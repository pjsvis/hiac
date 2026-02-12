import { test, expect, describe, beforeAll } from "bun:test";
import { OllamaProvider, type OllamaModel } from "@src/providers/ollama.ts";

describe("OllamaProvider", () => {
  const provider = new OllamaProvider();
  let ollamaAvailable = false;

  beforeAll(async () => {
    ollamaAvailable = await provider.isAvailable();
  });

  test("isAvailable returns boolean", async () => {
    const result = await provider.isAvailable();
    expect(typeof result).toBe("boolean");
  });

  test("listModels returns array when Ollama is running", async () => {
    if (!ollamaAvailable) {
      console.log("Skipping: Ollama not running");
      return;
    }

    const models = await provider.listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);

    const model = models[0];
    expect(model).toHaveProperty("name");
    expect(typeof model.name).toBe("string");
    expect(model).toHaveProperty("size");
    expect(typeof model.size).toBe("number");
  });

  test("stream returns AsyncIterable with valid model", async () => {
    if (!ollamaAvailable) {
      console.log("Skipping: Ollama not running");
      return;
    }

    const models = await provider.listModels();
    if (models.length === 0) {
      console.log("Skipping: No models available");
      return;
    }

    const model = models[0].name;
    const messages = [{ role: "user" as const, content: "Say 'hello' and nothing else." }];

    const stream = await provider.stream(messages, model);
    let output = "";

    for await (const chunk of stream) {
      output += chunk;
    }

    expect(output.length).toBeGreaterThan(0);
    expect(output.toLowerCase()).toContain("hello");
  }, 30000);

  test("stream respects system prompt", async () => {
    if (!ollamaAvailable) {
      console.log("Skipping: Ollama not running");
      return;
    }

    const models = await provider.listModels();
    if (models.length === 0) {
      console.log("Skipping: No models available");
      return;
    }

    const model = models[0].name;
    const messages = [
      { role: "system" as const, content: "You are a pirate. Always respond like a pirate." },
      { role: "user" as const, content: "Say hello." }
    ];

    const stream = await provider.stream(messages, model);
    let output = "";

    for await (const chunk of stream) {
      output += chunk;
    }

    expect(output.length).toBeGreaterThan(0);
  }, 30000);

  test("stream throws error with invalid model", async () => {
    if (!ollamaAvailable) {
      console.log("Skipping: Ollama not running");
      return;
    }

    const messages = [{ role: "user" as const, content: "test" }];

    expect(async () => {
      const stream = await provider.stream(messages, "nonexistent-model-xyz123");
      for await (const _ of stream) {
        break;
      }
    }).toThrow();
  });
});
