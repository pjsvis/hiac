import type { Message } from "@src/types.ts";
import { getProvider } from "@src/factory.ts";
import { gumWrite, requireGum, gumFormat } from "@src/utils/gum.ts";

export async function startChat(options: {
  model: string;
  systemPrompt?: string;
}): Promise<void> {
  await requireGum();

  const provider = getProvider(options.model);
  const history: Message[] = [];

  if (options.systemPrompt) {
    history.push({ role: "system", content: options.systemPrompt });
  }

  console.log(`\n💬 hiac chat mode (model: ${options.model})`);
  console.log("   Ctrl+D to send, Ctrl+C to exit\n");

  while (true) {
    const input = await gumWrite();
    if (!input.trim()) {
      console.log("Exiting...");
      break;
    }

    history.push({ role: "user", content: input });

    process.stdout.write("\n");
    let fullResponse = "";
    process.stderr.write("🤔 Thinking...");

    try {
      const stream = await provider.stream(history, options.model);

      let firstChunk = true;
      for await (const chunk of stream) {
        if (firstChunk) {
          process.stderr.write("\r✅ Ready!      \n");
          firstChunk = false;
        }
        fullResponse += chunk;
      }

      const formatted = await gumFormat(fullResponse);
      process.stdout.write("\n\n");
      console.log(formatted);

      process.stdout.write("\n\n");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`\n❌ Error: ${errorMessage}`);
      history.pop();
      continue;
    }

    history.push({ role: "assistant", content: fullResponse });
  }
}