import { $ } from "bun";
import ignore from "ignore";

/**
 * Generates a filtered list of file paths by checking against .hiacignore
 * or applying high-efficiency defaults.
 */
export async function getFilteredFileList(): Promise<string[]> {
  // 1. Gather all files (max-depth 4 to prevent accidental recursive explosions)
  // We exclude common hidden directories like .git and node_modules from the find command itself for efficiency
  const rawFiles = (await $`find . -type f -maxdepth 4 -not -path '*/.*' -not -path './node_modules/*'`.text())
    .split("\n")
    .map(f => f.replace("./", ""))
    .filter(Boolean);

  const ig = ignore();
  const ignoreFile = Bun.file(".hiacignore");
  const hiacIgnoreFile = Bun.file(".hiac/ignore");

  if (await ignoreFile.exists()) {
    ig.add(await ignoreFile.text());
  } else if (await hiacIgnoreFile.exists()) {
    ig.add(await hiacIgnoreFile.text());
  } else {
    // Deductive Minimalism: Exclude known noise by default
    ig.add([".git/", "node_modules/", "bun.lockb", "dist/", ".DS_Store", "*.log", "package-lock.json", "out/", "*.exe", "*.bin"]);
  }

  return ig.filter(rawFiles);
}
