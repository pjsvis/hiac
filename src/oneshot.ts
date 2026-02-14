import type { Message, CLIOptions, Provider } from "@src/types.ts";
import { getProvider } from "@src/factory.ts";
import { hydrateContext } from "./utils/context.ts";
import { extractAndSaveDiagrams } from "@src/utils/diagram.ts";
import { verifyWithRetry } from "@src/hooks.ts";
import { selectFiles } from "@src/utils/context.ts";

export async function runOneshot(options: CLIOptions & { provider?: Provider }): Promise<void> {
  const provider = options.provider || getProvider(options.model);
  const messages: Message[] = [];

  let stdinContent: string | undefined;
  if (!process.stdin.isTTY) {
    stdinContent = await Bun.stdin.text();
  }

  let files: string[] | undefined;
  if (options.select) {
    const { requireGum } = await import("@src/utils/gum.ts");
    await requireGum();
    files = await selectFiles();
  }

  const context = await hydrateContext({
    brief: options.brief,
    playbook: options.playbook,
    files,
    stdin: stdinContent,
  });

  const systemParts: string[] = [];
  if (options.system) {
    systemParts.push(options.system);
  }
  if (context.systemPrompt) {
    systemParts.push(context.systemPrompt);
  }
  if (systemParts.length > 0) {
    messages.push({
      role: "system",
      content: systemParts.join("\n\n"),
    });
  }

  if (!options.prompt && !stdinContent && !files?.length) {
    console.error("Error: No prompt or input provided.");
    console.error("Usage: hiac \"your prompt\" or pipe input via stdin");
    process.exit(1);
  }

  const userPrompt = options.prompt || "Process the provided input.";
  messages.push({ role: "user", content: userPrompt });

  if (options.hook) {
    const result = await verifyWithRetry(
      provider,
      messages,
      options.model,
      options.hook
    );

    if (!result.passed) {
      console.error(
        `\n❌ Verification failed after ${result.attempts} attempts.`
      );
      console.error(`Last error: ${result.lastError}`);
      process.exit(1);
    }

    console.log(`\n✅ Verification passed after ${result.attempts} attempt(s).`);

    if (result.output) {
      await extractAndSaveDiagrams(result.output);
    }
  } else {
    let output = "";
    process.stderr.write("🤔 Thinking...");
    const stream = await provider.stream(messages, options.model);

    let firstChunk = true;
    for await (const chunk of stream) {
      if (firstChunk) {
        process.stderr.write("\r✅ Ready!      \n");
        firstChunk = false;
      }
      output += chunk;
      process.stdout.write(chunk);
    }

    process.stdout.write("\n");

    const savedDiagrams = await extractAndSaveDiagrams(output);
    if (savedDiagrams.length > 0) {
      console.error(`\n📄 Extracted ${savedDiagrams.length} diagram(s) to ./design/`);
    }
  }
}
