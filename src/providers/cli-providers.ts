import type { Message, Provider, StreamOptions } from "@src/types.ts";
import { $ } from "bun";
import { existsSync } from "node:fs";

export interface CLIProviderOptions {
  path: string;
  model?: string;
}

export abstract class CLIProvider implements Provider {
  protected cliPath: string;
  protected model: string;

  constructor(path: string, model?: string) {
    this.cliPath = path;
    this.model = model || "";
  }

  async *stream(
    messages: Message[],
    _model: string,
    _options?: StreamOptions
  ): AsyncIterable<string> {
    const prompt = this.buildPrompt(messages);
    yield* this.streamFromCLI(prompt);
  }

  protected abstract buildPrompt(messages: Message[]): string;
  protected abstract streamFromCLI(prompt: string): AsyncIterable<string>;
}

export class ClaudeCLIProvider extends CLIProvider {
  constructor(model: string = "claude-sonnet-4") {
    const cliPath = findCLI("claude");
    super(cliPath, model);
  }

  protected buildPrompt(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content;
  }

  async *streamFromCLI(prompt: string): AsyncIterable<string> {
    const tempDir = "/tmp/hiac-claude";
    await $`mkdir -p ${tempDir}`.quiet();

    const tempFile = `${tempDir}/prompt.txt`;
    await Bun.write(tempFile, `Please respond with the complete answer. Do not ask follow-up questions.\n\n${prompt}`);

    const proc = Bun.spawn([this.cliPath, "--print", "-f", tempFile], {
      stdout: "pipe",
      stderr: "inherit",
    });

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          // Yield only the new chunk, not accumulated output
          yield decoder.decode(value, { stream: true });
        }
      }
    } finally {
      await reader.cancel();
      await $`rm -f ${tempFile}`.quiet();
    }

    await proc.exited;
  }
}

export class GeminiCLIProvider extends CLIProvider {
  constructor(model: string = "gemini-1.5-flash") {
    const cliPath = findCLI("gemini");
    super(cliPath, model);
  }

  protected buildPrompt(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content;
  }

  async *streamFromCLI(prompt: string): AsyncIterable<string> {
    const proc = Bun.spawn([this.cliPath, "-p", "-m", this.model, prompt], {
      stdout: "pipe",
      stderr: "inherit",
    });

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          // Yield only the new chunk, not accumulated output
          yield decoder.decode(value, { stream: true });
        }
      }
    } finally {
      await reader.cancel();
    }

    await proc.exited;
  }
}

export class KiloCLIProvider extends CLIProvider {
  constructor() {
    const cliPath = findCLI("kilo");
    super(cliPath, "auto");
  }

  protected buildPrompt(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content;
  }

  async *streamFromCLI(prompt: string): AsyncIterable<string> {
    yield "Error: Kilo streaming not yet implemented. Use kilo interactive directly.\n";
    
    const proc = Bun.spawn([this.cliPath, prompt], {
      stdout: "inherit",
      stderr: "inherit",
    });

    await proc.text();

    throw new Error("Kilo CLI streaming requires WebSocket implementation. Use interactive kilo instead.");
  }
}

/**
 * Find CLI in PATH using Bun.which(), with fallback locations
 * Synchronous - uses PATH resolution then checks common locations
 */
function findCLI(name: string): string {
  // Try Bun.which first (cross-platform PATH resolution)
  const found = Bun.which(name);
  if (found) return found;

  // Fallback to common macOS Homebrew/Linux locations
  const homebrewPaths = [
    `/opt/homebrew/bin/${name}`,
    `/usr/local/bin/${name}`,
    `${process.env.HOME}/.bun/bin/${name}`,
  ];

  for (const path of homebrewPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // Return the name itself as last resort (will fail at runtime if not in PATH)
  return name;
}

export function detectCLIs(): {
  claude: boolean;
  gemini: boolean;
  kilo: boolean;
} {
  return {
    claude: Bun.which("claude") !== null,
    gemini: Bun.which("gemini") !== null,
    kilo: Bun.which("kilo") !== null,
  };
}
