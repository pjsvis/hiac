import type { Message, Provider } from "@src/types.ts";
import { getProvider } from "@src/factory.ts";
import { gumWrite, requireGum, gumFormat } from "@src/utils/gum.ts";
import { glowRender, checkGlowInstalled } from "@src/utils/glow.ts";
import to from "await-to-js";
import { $ } from "bun";

/**
 * Copy text to clipboard
 * Supports: macOS (pbcopy), Linux (xclip/xsel)
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    if (process.platform === "darwin") {
      // macOS
      const proc = Bun.spawn(["pbcopy"], {
        stdin: Buffer.from(text),
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc.exited;
    } else if (process.platform === "linux") {
      // Linux - try xclip first, then xsel
      const proc = Bun.spawn(["xclip", "-selection", "clipboard"], {
        stdin: Buffer.from(text),
        stdout: "pipe",
        stderr: "pipe",
      });
      await proc.exited;
    }
  } catch (error) {
    // Silent fail - clipboard is a convenience feature
    // Don't interrupt the flow if it fails
  }
}

/**
 * Render markdown content using Glow, with fallback to Gum format
 * @param markdown - The markdown content to render
 * @param fallbackMethod - Name of the fallback method for error messages
 */
async function renderMarkdown(
  markdown: string,
  fallbackMethod: string = "Gum format",
): Promise<void> {
  // Try Glow first if installed
  const [checkError, glowAvailable] = await to(checkGlowInstalled());

  if (!checkError && glowAvailable) {
    const [renderError] = await to(glowRender(markdown));

    if (!renderError) {
      // Glow succeeded - copy to clipboard
      await copyToClipboard(markdown);
      return;
    }

    // Glow failed, fall back to Gum
    console.error(
      `\n⚠️  Glow rendering failed (${renderError.message}), falling back to ${fallbackMethod}`,
    );
  }

  // Fall back to Gum format
  const [formatError, formatted] = await to(gumFormat(markdown));

  if (formatError) {
    console.error(`\n❌ Error formatting output: ${formatError.message}`);
    console.log(markdown);
  } else {
    process.stdout.write("\n\n");
    console.log(formatted);
    process.stdout.write("\n\n");
    // Copy to clipboard for Gum rendering too
    await copyToClipboard(markdown);
  }
}

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

  process.on("SIGINT", handleExit);

  // Check which renderer will be used
  const [checkError, glowAvailable] = await to(checkGlowInstalled());
  const renderer = !checkError && glowAvailable ? "Glow (paged)" : "Gum format";
  console.log(`\n💬 hiac chat mode (model: ${options.model})`);
  console.log(`   Rendering: ${renderer}`);
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

      // Render using Glow with fallback to Gum
      await renderMarkdown(fullResponse, "Gum format");

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
  process.removeListener("SIGINT", handleExit);
}
