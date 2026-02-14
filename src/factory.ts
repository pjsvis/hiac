import type { Provider } from "@src/types.ts";
import { OllamaProvider } from "@src/providers/ollama.ts";
import { CloudProvider } from "@src/providers/cloud.ts";
import {
  ClaudeCLIProvider,
  GeminiCLIProvider,
  KiloCLIProvider,
  detectCLIs,
} from "@src/providers/cli-providers.ts";

export function getCliProvider(
  claude?: boolean,
  gemini?: boolean,
  kilo?: boolean
): Provider | null {
  const detected = detectCLIs();

  if (claude && detected.claude) {
    return new ClaudeCLIProvider();
  }

  if (gemini && detected.gemini) {
    return new GeminiCLIProvider();
  }

  if (kilo && detected.kilo) {
    return new KiloCLIProvider();
  }

  return null;
}

export function getProvider(model: string): Provider {
  const isCloudModel = model.includes("/") || model.startsWith("gpt");

  if (isCloudModel) {
    return new CloudProvider();
  }

  return new OllamaProvider();
}

export function isCloudModel(model: string): boolean {
  return model.includes("/") || model.startsWith("gpt");
}
