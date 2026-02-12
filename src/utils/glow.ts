import { $ } from "bun";
import { access } from "fs/promises";

const GLOW_NOT_FOUND_ERROR = `Glow is not installed. Install it with:
  macOS:   brew install glow
  Linux:   sudo apt install glow  OR  dnf install glow
  Windows: winget install charmbracelet.glow
  Or visit: https://github.com/charmbracelet/glow`;

const CUSTOM_STYLE_PATH = ".hiac/dracula.json";

export async function checkGlowInstalled(): Promise<boolean> {
  const result = await $`which glow`.nothrow().quiet();
  return result.exitCode === 0;
}

export async function requireGlow(): Promise<void> {
  const installed = await checkGlowInstalled();
  if (!installed) {
    console.error(GLOW_NOT_FOUND_ERROR);
    process.exit(1);
  }
}

async function customStyleExists(): Promise<boolean> {
  try {
    await access(CUSTOM_STYLE_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function glowRender(markdown: string): Promise<void> {
  await requireGlow();

  const hasCustomStyle = await customStyleExists();
  const args = hasCustomStyle 
    ? ["glow", "-s", CUSTOM_STYLE_PATH, "-"]
    : ["glow", "-"];

  const proc = Bun.spawn(args, {
    stdin: Buffer.from(markdown),
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;
}

export async function glowRenderFile(path: string): Promise<void> {
  await requireGlow();

  const hasCustomStyle = await customStyleExists();
  const args = hasCustomStyle
    ? ["glow", "-s", CUSTOM_STYLE_PATH, path]
    : ["glow", path];

  const proc = Bun.spawn(args, {
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;
}
