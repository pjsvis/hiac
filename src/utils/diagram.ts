import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g;

export interface ExtractedDiagram {
  code: string;
  filename: string;
}

export function extractMermaid(content: string): ExtractedDiagram[] {
  const diagrams: ExtractedDiagram[] = [];
  const matches = content.matchAll(MERMAID_REGEX);

  let index = 0;
  for (const match of matches) {
    const code = match[1].trim();
    const timestamp = Date.now();
    const filename = `diagram-${timestamp}-${index}.mmd`;
    diagrams.push({ code, filename });
    index++;
  }

  return diagrams;
}

export async function saveDiagrams(
  diagrams: ExtractedDiagram[],
  outputDir = "./design"
): Promise<string[]> {
  if (diagrams.length === 0) return [];

  await mkdir(outputDir, { recursive: true });

  const savedPaths: string[] = [];
  for (const diagram of diagrams) {
    const path = join(outputDir, diagram.filename);
    await writeFile(path, diagram.code, "utf-8");
    savedPaths.push(path);
  }

  return savedPaths;
}

export async function extractAndSaveDiagrams(
  content: string,
  outputDir?: string
): Promise<string[]> {
  const diagrams = extractMermaid(content);
  return saveDiagrams(diagrams, outputDir);
}
