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
    super("/Users/petersmith/.bun/bin/claude", model);
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

    let output = "";
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
          output += decoder.decode(value, { stream: true });
          yield output;
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
    super("/Users/petersmith/.bun/bin/gemini", model);
  }

  protected buildPrompt(messages: Message[]): string {
    const lastMessage = messages[messages.length - 1];
    return lastMessage.content;
  }

  async *streamFromCLI(prompt: string): AsyncIterable<string> {
    let output = "";
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
          output += decoder.decode(value, { stream: true });
          yield output;
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
    super("/Users/petersmith/.bun/bin/kilo", "auto");
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

export function detectCLIs(): {
  claude: boolean;
  gemini: boolean;
  kilo: boolean;
} {
  const claudePath = "/Users/petersmith/.bun/bin/claude";
  const geminiPath = "/Users/petersmith/.bun/bin/gemini";
  const kiloPath = "/Users/petersmith/.bun/bin/kilo";

  let claude = false;
  let gemini = false;
  let kilo = false;

  try {
    require.resolve(claudePath);
    claude = true;
  } catch {}

  try {
    require.resolve(geminiPath);
    gemini = true;
  } catch {}

  try {
    require.resolve(kiloPath);
    kilo = true;
  } catch {}

  return { claude, gemini, kilo };
}

export async function getCliPath(_app: string): Promise<string | null> {
  const paths = [
    "/Users/petersmith/.bun/bin/claude",
    "/opt/homebrew/bin/claude",
  ];

  for (const path of paths) {
    try {
      require.resolve(path);
      return path;
    } catch {}
  }
  return null;
}
