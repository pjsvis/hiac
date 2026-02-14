import type { Message, Provider } from "@src/types.ts";
import { getProvider } from "@src/factory.ts";
import { gumWrite, requireGum, gumFormat } from "@src/utils/gum.ts";
import to from "await-to-js";

export async function startChat(options: {
  model: string;
  systemPrompt?: string;
  saveDialog?: boolean;
  provider?: Provider;
}): Promise<void> {
  await requireGum();

  const provider = options.provider || getProvider(options.model);
  const history: Message[] = [];

  const cleanup = async () => {
    if (options.saveDialog && history.length > 0) {
      const dialogModule = await import("@src/utils/dialog.ts");
      await dialogModule.saveDialog(history);
    }
  };

  const handleExit = () => {
    cleanup().then(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', handleExit);

  console.log(`\n💬 hiac chat mode (model: ${options.model})`);
  console.log("   Ctrl+D to send, Ctrl+C to exit\n");

while (true) {
      const input = await gumWrite();
      if (!input.trim()) {
        console.log("Exiting...");
        break;
      }

      history.push({ role: "user", content: input });

      console.log(`\n👤 You: ${input}`);

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

        const [formatError, formatted] = await to(gumFormat(fullResponse));

        if (formatError) {
          console.error(`\n❌ Error formatting output: ${formatError.message}`);
          console.log(fullResponse);
        } else {
          process.stdout.write("\n\n");
          console.log(formatted);
          process.stdout.write("\n\n");
        }

        history.push({ role: "assistant", content: fullResponse });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`\n❌ Error: ${errorMessage}`);
        history.pop();
        continue;
      }
    }

  await cleanup();
  process.removeListener('SIGINT', handleExit);
}