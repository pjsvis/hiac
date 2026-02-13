import * as path from "node:path";
import to from "await-to-js";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function saveDialog(history: Message[]): Promise<string> {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:T]/g, "-")
    .split(".")[0];

  const dialogsDir = path.join(process.cwd(), "dialogs");

  const fs = await import("node:fs");

  const [mkdirError] = await to(
    new Promise<void>((resolve) => {
      fs.mkdirSync(dialogsDir, { recursive: true });
      resolve();
    })
  );
  if (mkdirError) {
    console.error(`Failed to create dialogs directory: ${mkdirError}`);
    throw mkdirError;
  }

  const filename = `${timestamp}-dialog.md`;
  const filepath = path.join(dialogsDir, filename);

  let markdown = `# Chat Dialog\n\n`;
  markdown += `Saved: ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;

  for (const msg of history) {
    if (msg.role === "system") {
      markdown += `**System:**\n\n${msg.content}\n\n---\n\n`;
    } else if (msg.role === "user") {
      markdown += `**User:**\n\n${msg.content}\n\n---\n\n`;
    } else if (msg.role === "assistant") {
      markdown += `**Assistant:**\n\n${msg.content}\n\n---\n\n`;
    }
  }

  const [writeError] = await to(Bun.write(filepath, markdown));
  if (writeError) throw writeError;

  console.log(`\n💾 Dialog saved to: ${filepath}`);

  return filepath;
}