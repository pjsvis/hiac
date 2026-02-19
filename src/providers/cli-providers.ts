import type { Message, Provider, StreamOptions } from "@src/types.ts";
import { $ } from "bun";

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
    const path = Bun.which("claude");
    if (!path) throw new Error("Claude CLI not found in PATH. Install: npm install -g @anthropics/claude-code");
    super(path, model);
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
    const path = Bun.which("gemini");
    if (!path) throw new Error("Gemini CLI not found in PATH. Install: npm install -g gemini-cli");
    super(path, model);
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
    const path = Bun.which("kilo");
    if (!path) throw new Error("Kilo CLI not found in PATH");
    super(path, "auto");
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

    await proc.exited;

    throw new Error("Kilo CLI streaming requires WebSocket implementation. Use interactive kilo instead.");
  }
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
