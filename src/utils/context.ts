import { readFile, access } from "fs/promises";
import { gumFilter } from "./gum.ts";
import { constants } from "fs";
import { getFilteredFileList } from "./ignore.ts";

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function selectFiles(): Promise<string[]> {
  const filteredFiles = await getFilteredFileList();

  if (filteredFiles.length === 0) {
    console.log("No high-signal files found.");
    return [];
  }

  const selected = await gumFilter(filteredFiles, {
    header: "Select files to include (high-signal):",
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
  return `### BRIEF\n${content}`;
}

export async function loadPlaybook(path: string): Promise<string> {
  const content = await loadFile(path);
  return `### PLAYBOOK\n${content}`;
}

export interface HydratedContext {
  systemPrompt: string;
  files: Map<string, string>;
}

export async function ingestCodebase(filePaths: string[]): Promise<string> {
  let codebaseBuffer = "";

  for (const path of filePaths) {
    const file = Bun.file(path);
    if (await file.exists()) {
      const content = await file.text();
      // Structured representation (OH-021)
      codebaseBuffer += `\n[FILE: ${path}]\n${content}\n[END: ${path}]\n`;
    }
  }

  return codebaseBuffer;
}

export async function hydrateContext(options: {
  brief?: string;
  playbook?: string;
  files?: string[];
  stdin?: string;
}): Promise<HydratedContext> {
  const parts: string[] = [];
  const loadedFiles = new Map<string, string>();

  if (options.playbook) {
    parts.push(await loadPlaybook(options.playbook));
  }

  if (options.brief) {
    parts.push(await loadBrief(options.brief));
  }

  if (options.files && options.files.length > 0) {
    const codebaseContext = await ingestCodebase(options.files);
    parts.push(`### CODEBASE CONTEXT\n${codebaseContext}`);
    
    for (const path of options.files) {
      if (await fileExists(path)) {
        loadedFiles.set(path, await readFile(path, "utf-8"));
      }
    }
  }

  if (options.stdin) {
    parts.push(`### INPUT\n${options.stdin}`);
  }

  return {
    systemPrompt: parts.join("\n\n"),
    files: loadedFiles,
  };
}
