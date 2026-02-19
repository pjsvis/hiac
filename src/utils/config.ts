import { $ } from "bun";
import * as path from "node:path";
import to from "await-to-js";

export interface Config {
  folders: {
    briefs: string;
    debriefs: string;
    playbooks: string;
    "system-prompts": string;
  };
  defaults?: {
    model?: string;
  };
  openrouter?: {
    models?: string[];
  };
}

const GLOBAL_CONFIG_DIR = path.join(process.env.HOME || "", ".hiac");
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, "config.yaml");

const DEFAULT_CONFIG: Config = {
  folders: {
    briefs: "./briefs",
    debriefs: "./debriefs",
    playbooks: "./playbooks",
    "system-prompts": "./system-prompts",
  },
  defaults: {
    model: "kimi-k2.5:cloud",
  },
  openrouter: {
    models: [],
  },
};

export async function loadGlobalConfig(): Promise<Config | null> {
  const [readError, content] = await to(Bun.file(GLOBAL_CONFIG_FILE).text());
  if (readError) return null;

  const yamlModule = await import("yaml");
  const [parseError, parsed] = await to(Promise.resolve(yamlModule.parse(content) as Config));
  if (parseError) return null;

  return parsed as Config;
}

export async function loadLocalConfig(): Promise<Config | null> {
  const localPath = path.join(process.cwd(), ".hiac", "config.yaml");
  const [readError, content] = await to(Bun.file(localPath).text());
  if (readError) return null;

  const yamlModule = await import("yaml");
  const [parseError, parsed] = await to(Promise.resolve(yamlModule.parse(content) as Config));
  if (parseError) return null;

  return parsed as Config;
}

export async function loadConfig(): Promise<Config> {
  const local = await loadLocalConfig();
  const global = await loadGlobalConfig();
  return local || global || DEFAULT_CONFIG;
}

export async function ensureGlobalConfigDir(): Promise<void> {
  const [error] = await to($`mkdir -p ${GLOBAL_CONFIG_DIR}`);
  if (error) {
    console.error(`Failed to create global config directory: ${error}`);
    throw error;
  }
}

export async function writeGlobalConfig(config: Config): Promise<void> {
  const [ensureError] = await to(ensureGlobalConfigDir());
  if (ensureError) throw ensureError;

  const yaml = await import("yaml");
  const content = yaml.stringify(config, { indent: 2 });
  const [writeError] = await to(Bun.write(GLOBAL_CONFIG_FILE, content));
  if (writeError) throw writeError;
}

export async function ensureFolders(config: Config, basePath: string = process.cwd()): Promise<void> {
  for (const folderPath of Object.values(config.folders)) {
    const absolutePath = path.join(basePath, folderPath);
    const [error] = await to($`mkdir -p ${absolutePath}`);
    if (error) {
      console.error(`Failed to create folder ${absolutePath}: ${error}`);
    }
  }
}

export async function getGlobalConfigDir(): Promise<string> {
  return GLOBAL_CONFIG_DIR;
}

export async function addOpenRouterModel(modelName: string): Promise<void> {
  if (!modelName.includes("/")) {
    console.error(`Error: '${modelName}' doesn't look like an OpenRouter model.`);
    console.error("Expected format: provider/model (e.g., anthropic/claude-sonnet-4)");
    console.error("Ollama models are detected automatically — no registration needed.");
    process.exit(1);
  }

  let config = await loadGlobalConfig();
  if (!config) {
    config = { ...DEFAULT_CONFIG };
  }

  if (!config.openrouter) {
    config.openrouter = { models: [] };
  }
  if (!config.openrouter.models) {
    config.openrouter.models = [];
  }

  if (config.openrouter.models.includes(modelName)) {
    console.log(`Model '${modelName}' is already registered.`);
    return;
  }

  config.openrouter.models.push(modelName);
  await writeGlobalConfig(config);
  console.log(`Added '${modelName}' to OpenRouter models.`);
}

export async function removeOpenRouterModel(modelName: string): Promise<void> {
  let config = await loadGlobalConfig();
  if (!config?.openrouter?.models) {
    console.log(`Model '${modelName}' not found in config.`);
    return;
  }

  const idx = config.openrouter.models.indexOf(modelName);
  if (idx === -1) {
    console.log(`Model '${modelName}' not found in config.`);
    return;
  }

  config.openrouter.models.splice(idx, 1);
  await writeGlobalConfig(config);
  console.log(`Removed '${modelName}' from OpenRouter models.`);
}