import type { Message } from "@src/types.ts";

export interface Provider {
  stream(
    messages: Message[],
    model: string,
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncIterable<string>;
}

export interface HookResult {
    success: boolean;
    stdout: string;
    stderr: string;
    exitCode: number;
  }

const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 30000;

export async function executeHook(
  command: string,
  timeout = DEFAULT_TIMEOUT
): Promise<HookResult> {
  const proc = Bun.spawn(["sh", "-c", command], {
    stdout: "pipe",
    stderr: "pipe",
    timeout,
  });

  const [stdout, stderr] = await Promise.all([
    proc.stdout.text(),
    proc.stderr.text(),
  ]);

  await proc.exited;
  const exitCode = proc.exitCode ?? 1;

  return {
    success: exitCode === 0,
    stdout,
    stderr,
    exitCode,
  };
}

export interface VerificationResult {
  passed: boolean;
  attempts: number;
  lastError?: string;
  output?: string;
}

export async function verifyWithRetry(
  provider: Provider,
  messages: Message[],
  model: string,
  hookCommand: string,
  maxRetries = MAX_RETRIES
): Promise<VerificationResult> {
  let attempts = 0;
  let currentMessages = [...messages];
  let lastError = "";

  while (attempts < maxRetries) {
    attempts++;
    process.stdout.write(`\n[Attempt ${attempts}/${maxRetries}] Generating...\n`);

    let output = "";
    const stream = await provider.stream(currentMessages, model);

    for await (const chunk of stream) {
      output += chunk;
      process.stdout.write(chunk);
    }

    process.stdout.write("\n\n");

    process.stdout.write(`[Verifying with: ${hookCommand}]\n`);
    const result = await executeHook(hookCommand);

    if (result.success) {
      return {
        passed: true,
        attempts,
        output,
      };
    }

    lastError = result.stderr || result.stdout;
    process.stdout.write(`[Hook failed]\n${lastError}\n\n`);

    currentMessages.push(
      { role: "assistant", content: output },
      {
        role: "user",
        content: `The verification hook failed with the following error:\n\n${lastError}\n\nPlease fix the issues and try again.`,
      }
    );
  }

  return {
    passed: false,
    attempts,
    lastError,
  };
}
