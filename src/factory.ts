import type { Provider } from "@src/types.ts";
import { OllamaProvider } from "@src/providers/ollama.ts";
import { CloudProvider } from "@src/providers/cloud.ts";

/**
 * Factory function to get the appropriate provider based on model name.
 *
 * Routing logic:
 * - Models containing "/" (e.g., "anthropic/claude-3-opus") -> CloudProvider
 * - Models starting with "gpt-" (e.g., "gpt-4") -> CloudProvider
 * - All other models -> OllamaProvider (local)
 */
export function getProvider(model: string): Provider {
  const isCloudModel = model.includes("/") || model.startsWith("gpt-");

  if (isCloudModel) {
    return new CloudProvider();
  }

  return new OllamaProvider();
}

/**
 * Check if a model requires cloud provider
 */
export function isCloudModel(model: string): boolean {
  return model.includes("/") || model.startsWith("gpt-");
}
