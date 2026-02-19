import { OllamaProvider } from "@src/providers/ollama.ts";
import { gumFilter } from "@src/utils/gum.ts";
import type { Config } from "@src/utils/config.ts";

export interface ModelEntry {
  name: string;
  source: "local" | "cloud";
  size?: number;
}

export async function getAvailableModels(
  config: Config,
): Promise<ModelEntry[]> {
  const models: ModelEntry[] = [];

  const ollama = new OllamaProvider();
  if (await ollama.isAvailable()) {
    const ollamaModels = await ollama.listModels();
    for (const m of ollamaModels) {
      models.push({ name: m.name, source: "local", size: m.size });
    }
  }

  const openrouterModels = config.openrouter?.models ?? [];
  for (const name of openrouterModels) {
    models.push({ name, source: "cloud" });
  }

  return models;
}

function formatModelEntry(entry: ModelEntry): string {
  if (entry.source === "local") {
    const sizeMB = entry.size
      ? ` (${(entry.size / 1024 / 1024).toFixed(0)} MB)`
      : "";
    return `[local] ${entry.name}${sizeMB}`;
  }
  return `[cloud] ${entry.name}`;
}

function parseModelSelection(selection: string): string {
  return selection
    .replace(/^\[(local|cloud)\]\s*/, "")
    .replace(/\s*\(\d+ MB\)$/, "")
    .trim();
}

export async function selectModel(config: Config): Promise<string> {
  const models = await getAvailableModels(config);

  if (models.length === 0) {
    throw new Error(
      "No models available. Start Ollama or add OpenRouter models with --add-model.",
    );
  }

  const displayItems = models.map(formatModelEntry);

  const selected = await gumFilter(displayItems, {
    header: "Select model:",
    height: 20,
  });

  if (selected.length === 0 || !selected[0]) {
    throw new Error("No model selected.");
  }

  return parseModelSelection(selected[0]);
}

/**
 * Model resolution chain:
 *   1. Explicit -m value (not "?") -> use it
 *   2. -m ? -> interactive picker
 *   3. Config default -> use it
 *   4. TTY -> interactive picker
 *   5. No TTY, no default -> error
 */
export async function resolveModel(
  explicitModel: string | undefined,
  config: Config,
): Promise<string> {
  if (explicitModel && explicitModel !== "?") {
    return explicitModel;
  }

  if (explicitModel === "?") {
    return selectModel(config);
  }

  if (config.defaults?.model) {
    return config.defaults.model;
  }

  if (process.stdin.isTTY) {
    return selectModel(config);
  }

  throw new Error(
    "No model specified. Use -m <model> or set defaults.model in config.",
  );
}

export async function listModels(config: Config): Promise<void> {
  const models = await getAvailableModels(config);

  if (models.length === 0) {
    console.log("No models available.");
    console.log("  Start Ollama: ollama serve");
    console.log(
      "  Add cloud model: hiac --add-model <provider/model>",
    );
    return;
  }

  const localModels = models.filter((m) => m.source === "local");
  const cloudModels = models.filter((m) => m.source === "cloud");

  if (localModels.length > 0) {
    console.log("Ollama (local):");
    for (const m of localModels) {
      const sizeMB = m.size
        ? ` (${(m.size / 1024 / 1024).toFixed(0)} MB)`
        : "";
      console.log(`  ${m.name}${sizeMB}`);
    }
  }

  if (cloudModels.length > 0) {
    if (localModels.length > 0) console.log();
    console.log("OpenRouter (cloud):");
    for (const m of cloudModels) {
      console.log(`  ${m.name}`);
    }
  }
}
