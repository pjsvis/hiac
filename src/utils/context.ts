import { readFile, access } from "fs/promises";
import { gumFilter } from "./gum.ts";
import { constants } from "fs";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function selectFiles(baseDir = "."): Promise<string[]> {
  const proc = Bun.spawn(["find", baseDir, "-type", "f", "-not", "-path", "*/node_modules/*", "-not", "-path", "*/.git/*", "-not", "-path", "*/dist/*"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const fileList = await proc.stdout.text();
  await proc.exited;

  const files = fileList.trim().split("\n").filter((f) => f.length > 0);

  if (files.length === 0) {
    console.log("No files found.");
    return [];
  }

  const selected = await gumFilter(files, {
    header: "Select files to include:",
    height: 20,
    multi: true,
  });

  return selected;
}

export async function loadFile(path: string): Promise<string> {
  if (!(await fileExists(path))) {
    throw new Error(`File not found: ${path}`);
  }
  return await readFile(path, "utf-8");
}

export async function loadBrief(path: string): Promise<string> {
  const content = await loadFile(path);
  return `## Brief\n\n${content}`;
}

export async function loadPlaybook(path: string): Promise<string> {
  const content = await loadFile(path);
  return `## Playbook\n\n${content}`;
}

export interface HydratedContext {
  systemPrompt: string;
  files: Map<string, string>;
}

export async function hydrateContext(options: {
  brief?: string;
  playbook?: string;
  files?: string[];
  stdin?: string;
}): Promise<HydratedContext> {
  const parts: string[] = [];
  const loadedFiles = new Map<string, string>();

  if (options.brief) {
    parts.push(await loadBrief(options.brief));
  }

  if (options.playbook) {
    parts.push(await loadPlaybook(options.playbook));
  }

  if (options.files && options.files.length > 0) {
    const fileContents: string[] = [];
    for (const file of options.files) {
      const content = await loadFile(file);
      loadedFiles.set(file, content);
      fileContents.push(`### File: ${file}\n\n\`\`\`\n${content}\n\`\`\``);
    }
    parts.push(`## Files\n\n${fileContents.join("\n\n")}`);
  }

  if (options.stdin) {
    parts.push(`## Input\n\n${options.stdin}`);
  }

  return {
    systemPrompt: parts.join("\n\n"),
    files: loadedFiles,
  };
}
