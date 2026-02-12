import { readFile, access, writeFile, readdir } from "fs/promises";
import { constants } from "fs";
import { parse, stringify } from "yaml";
import type { Role } from "@src/types.ts";
import { OllamaProvider } from "@src/providers/ollama.ts";
import { gumFilter } from "./gum.ts";
import { join } from "path";

const DEFAULT_ROLES_PATH = ".hiac/roles.yaml";
const PROMPTS_DIR = "prompts";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveFileReference(
  value: string,
  basePath: string
): Promise<string> {
  const FILE_PREFIX = "@file:";
  if (!value.startsWith(FILE_PREFIX)) {
    return value;
  }

  const filePath = value.slice(FILE_PREFIX.length).trim();
  const fullPath = join(basePath, filePath);

  if (!(await fileExists(fullPath))) {
    throw new Error(
      `File not found for role: ${filePath} (resolved to ${fullPath})`
    );
  }

  return await readFile(fullPath, "utf-8");
}

export async function loadRoles(
  path: string = DEFAULT_ROLES_PATH
): Promise<Map<string, Role>> {
  const roles = new Map<string, Role>();

  if (!(await fileExists(path))) {
    return roles;
  }

  const content = await readFile(path, "utf-8");
  const parsed = parse(content) as Record<string, Role>;
  const baseDir = path.substring(0, path.lastIndexOf("/")) || ".";

  for (const [name, role] of Object.entries(parsed)) {
    const resolvedRole: Role = {
      model: role.model,
      system: await resolveFileReference(role.system, baseDir),
      description: role.description
        ? await resolveFileReference(role.description, baseDir)
        : undefined,
    };
    roles.set(name, resolvedRole);
  }

  return roles;
}

export async function getRole(
  name: string,
  path?: string
): Promise<Role | undefined> {
  const roles = await loadRoles(path);
  return roles.get(name);
}

export async function listRoles(path?: string): Promise<string[]> {
  const roles = await loadRoles(path);
  return Array.from(roles.keys());
}

export async function printRoles(path?: string): Promise<void> {
  const roles = await loadRoles(path);

  if (roles.size === 0) {
    console.log("No roles defined.");
    console.log(`Create roles in ${DEFAULT_ROLES_PATH}`);
    return;
  }

  console.log("Available roles:\n");
  for (const [name, role] of roles) {
    console.log(`  ${name}`);
    console.log(`    Model: ${role.model}`);
    if (role.description) {
      console.log(`    Description: ${role.description}`);
    }
    console.log();
  }
}

export async function saveRole(
  name: string,
  role: Role,
  path: string = DEFAULT_ROLES_PATH
): Promise<void> {
  const roles = await loadRoles(path);
  roles.set(name, role);

  const roleRecord: Record<string, Role> = {};
  for (const [key, value] of roles) {
    roleRecord[key] = value;
  }

  const yaml = stringify(roleRecord);
  await writeFile(path, yaml, "utf-8");
}

export async function buildRole(): Promise<void> {
  console.log("\n🔨 Role Builder\n");

  const ollama = new OllamaProvider();
  const available = await ollama.isAvailable();

  let selectedModel: string;

  if (available) {
    const models = await ollama.listModels();
    if (models.length === 0) {
      console.log("No models found. Using default.");
      selectedModel = "kimi-k2.5:cloud";
    } else {
      const modelNames = models.map((m) => m.name);
      console.log(`\nSelect a model (${modelNames.length} available):\n`);
      const result = await gumFilter(modelNames, {
        header: "Select model:",
        height: 15,
      });
      selectedModel = result[0] || "kimi-k2.5:cloud";
    }
  } else {
    console.log("Ollama not available. Using cloud model.");
    selectedModel = "kimi-k2.5:cloud";
  }

  console.log(`Selected model: ${selectedModel}\n`);

  let systemPrompt = "";
  const hasPromptsDir = await fileExists(PROMPTS_DIR);
  let useExistingPrompt = false;

  if (hasPromptsDir) {
    const entries = await readdir(PROMPTS_DIR);
    const promptFiles = entries.filter((f) => f.endsWith(".md"));

    if (promptFiles.length > 0) {
      console.log(`Found ${promptFiles.length} prompt(s) in prompts/\n`);
      const choices = ["Write custom prompt", ...promptFiles];
      const result = await gumFilter(choices, {
        header: "Select prompt source:",
        height: 10,
      });

      if (result[0] && result[0] !== "Write custom prompt") {
        const promptPath = join(PROMPTS_DIR, result[0]);
        systemPrompt = await readFile(promptPath, "utf-8");
        console.log(`Loaded prompt from: ${result[0]}\n`);
        useExistingPrompt = true;
      }
    }
  }

  if (!useExistingPrompt) {
    console.log("Enter system prompt:");
    systemPrompt = await gumInput("Describe the role's behavior...");
  }

  console.log("\nEnter role name (lowercase, no spaces):");
  const roleName = await gumInput("my-custom-role");

  if (!roleName || roleName.trim() === "") {
    console.error("Role name is required.");
    process.exit(1);
  }

  const existingRoles = await loadRoles();
  if (existingRoles.has(roleName)) {
    console.error(`\nRole '${roleName}' already exists.`);
    const overwrite = await gumFilter(["Yes", "No"], {
      header: "Overwrite?",
      height: 5,
    });
    if (overwrite[0] !== "Yes") {
      console.log("Cancelled.");
      return;
    }
  }

  console.log("\nEnter role description:");
  const description = await gumInput("Brief description of this role...");

  const role: Role = {
    model: selectedModel,
    system: systemPrompt,
    description: description || undefined,
  };

  await saveRole(roleName, role);

  console.log(`\n✅ Role '${roleName}' saved!`);
  console.log(`   Model: ${selectedModel}`);
  console.log(`   Use with: hiac --role ${roleName}`);
}

async function gumInput(placeholder: string): Promise<string> {
  const proc = Bun.spawn(["gum", "input", "--placeholder", placeholder], {
    stdin: "inherit",
    stdout: "pipe",
    stderr: "inherit",
  });

  const output = await proc.stdout.text();
  await proc.exited;

  return output.trim();
}
