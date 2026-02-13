#!/usr/bin/env bun
import { $ } from "bun";
import * as path from "node:path";

const DIAGRAMS_DIR = path.join(process.cwd(), ".hiac", "diagrams");
const SVG_DIR = path.join(process.cwd(), "docs", "diagrams", "svg");

async function extractMermaidCode(filePath: string): Promise<string | null> {
  const content = await Bun.file(filePath).text();
  const mermaidRegex = /```mermaid([\s\S]*?)```/g;
  const match = mermaidRegex.exec(content);

  if (match) {
    return match[1].trim();
  }

  return null;
}

async function convertToSVG(
  mermaidCode: string,
  outputPath: string
): Promise<void> {
  const tempDir = "/tmp/hiac-diagrams";
  await $`mkdir -p ${tempDir}`.nothrow();

  const timestamp = Date.now();
  const tempFile = path.join(tempDir, `diagram-${timestamp}.mmd`);
  await Bun.write(tempFile, mermaidCode);

  const result = await $`bunx mmdc -i ${tempFile} -o ${outputPath} -t default -w 1200`.nothrow();

  await $`rm ${tempFile}`.nothrow();

  if (result.exitCode !== 0) {
    throw new Error(`mmdc conversion failed: ${result.stderr}`);
  }
}

async function embedSVGInMarkdown(
  markdownFilePath: string,
  svgFilePath: string
): Promise<void> {
  const content = await Bun.file(markdownFilePath).text();

  const updatedContent = content.replace(
    /```mermaid[\s\S]*?```/,
    `\`\`\`\n::: tip\n![Diagram](./diagrams/svg/${path.basename(svgFilePath)})\n:::\n\`\`\``
  );

  await Bun.write(markdownFilePath, updatedContent);
}

async function main() {
  console.log("\n🎨 Converting Mermaid diagrams to SVG...\n");

  await $`mkdir -p ${SVG_DIR}`.quiet();

  const files = await $`ls ${DIAGRAMS_DIR}/*.md`.quiet().text();
  const diagramFiles = files
    .split("\n")
    .filter((f) => f && !f.endsWith("README.md"))
    .map((f) => f.trim());

  console.log(`Found ${diagramFiles.length} diagram file(s)\n`);

  for (const filePath of diagramFiles) {
    const fileName = path.basename(filePath, ".md");

    console.log(`Processing: ${fileName}`);

    const mermaidCode = await extractMermaidCode(filePath);

    if (!mermaidCode) {
      console.log(`  ⚠️  No Mermaid code found, skipping\n`);
      continue;
    }

    const svgName = `${fileName}.svg`;
    const svgPath = path.join(SVG_DIR, svgName);

    try {
      await convertToSVG(mermaidCode, svgPath);
      console.log(`  ✅ Converted to ${svgName}`);

      await embedSVGInMarkdown(filePath, svgPath);
      console.log(`  ✅ Embedded in ${path.basename(filePath)}\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      console.error(`  💡 Tip: Complex Mermaid syntax may need manual adjustment\n`);
    }
  }

  console.log("✨ Diagram conversion complete!");
  console.log(
    "\n💡 Tip: Diagrams are now embedded as SVG images. To inline SVG code, use a different embedding strategy if needed.\n"
  );
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});