import { $ } from "bun";

const GUM_NOT_FOUND_ERROR = `Gum is not installed. Install it with:
  macOS:   brew install gum
  Linux:   sudo apt install gum  OR  sudo dnf install gum
  Windows: winget install charmbracelet.gum
  Or visit: https://github.com/charmbracelet/gum`;

export async function checkGumInstalled(): Promise<boolean> {
  const result = await $`which gum`.nothrow().quiet();
  return result.exitCode === 0;
}

export async function requireGum(): Promise<void> {
  const installed = await checkGumInstalled();
  if (!installed) {
    console.error(GUM_NOT_FOUND_ERROR);
    process.exit(1);
  }
}

export async function gumFilter(
  options: string[],
  config?: { header?: string; height?: number; multi?: boolean }
): Promise<string[]> {
  await requireGum();

  const args = ["filter"];
  if (config?.header) args.push("--header", config.header);
  if (config?.height) args.push("--height", String(config.height));
  if (config?.multi) args.push("--no-limit");

  const proc = Bun.spawn(["gum", ...args], {
    stdin: Buffer.from(options.join("\n")),
    stdout: "pipe",
    stderr: "inherit",
  });

  const output = await proc.stdout.text();
  await proc.exited;

  return output
    .trim()
    .split("\n")
    .filter((s) => s.length > 0);
}

export async function gumWrite(
  placeholder = "Enter your message (Ctrl+D to send, Ctrl+C to exit): "
): Promise<string> {
  await requireGum();

  const proc = Bun.spawn(["gum", "write", "--placeholder", placeholder], {
    stdin: "inherit",
    stdout: "pipe",
    stderr: "inherit",
  });

  const output = await proc.stdout.text();
  await proc.exited;

  return output.trim();
}

export async function gumFormat(markdown: string): Promise<string> {
  await requireGum();

  const spacedMarkdown = markdown
    .split('\n')
    .map(line => {
      if (line.match(/^#{1,6}\s/)) {
        return line + '\n';
      }
      if (line.match(/^```/)) {
        return line + '\n';
      }
      return line;
    })
    .join('\n');

  const proc = Bun.spawn(["gum", "format", "--type", "markdown"], {
    stdin: Buffer.from(spacedMarkdown),
    stdout: "pipe",
    stderr: "pipe",
  });

  let output = await proc.stdout.text();
  await proc.exited;

  output = wrapAnsiText(output, 70);

  return '\n' + output + '\n';
}

function wrapAnsiText(text: string, width: number): string {
  // ANSI escape sequence pattern
  const ansiRegex = /(\x1b\[[0-9;]*m)/g;
  const lines = text.split('\n');
  const wrapped: string[] = [];

  for (const line of lines) {
    // Parse line into segments (either ANSI codes or plain text)
    const segments: { type: 'text' | 'ansi'; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = ansiRegex.exec(line)) !== null) {
      // Add text before this ANSI code
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: line.substring(lastIndex, match.index)
        });
      }
      // Add the ANSI code
      segments.push({
        type: 'ansi',
        content: match[1]
      });
      lastIndex = match.index + match[1].length;
    }
    
    // Add remaining text
    if (lastIndex < line.length) {
      segments.push({
        type: 'text',
        content: line.substring(lastIndex)
      });
    }

    // Track active ANSI codes
    const activeCodes: string[] = [];
    const result: string[] = [];
    let currentLine = '';
    let currentLength = 0;

    for (const segment of segments) {
      if (segment.type === 'ansi') {
        // Check if this is a reset code
        if (segment.content === '\x1b[0m') {
          activeCodes.length = 0; // Clear all active codes
        } else if (segment.content.startsWith('\x1b[')) {
          // This is an SGR code - add to active
          activeCodes.push(segment.content);
        }
        currentLine += segment.content;
      } else {
        // Wrap this text segment
        for (const char of segment.content) {
          const code = char.charCodeAt(0);
          if (currentLength >= width && code >= 32 && !/\s/.test(char)) {
            // Need to wrap - close active codes, start new line, reopen
            let reset = '\x1b[0m';
            let reopen = activeCodes.join('');
            let closeAgain = activeCodes.length > 0 ? '\x1b[0m' : '';
            
            currentLine += reset + '\n' + reopen;
            result.push(currentLine);
            currentLine = closeAgain;
            currentLength = 0;
          }
          
          currentLine += char;
          if (code >= 32) {
            currentLength++;
          }
        }
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }

    wrapped.push(result.join(''));
  }

  return wrapped.join('\n');
}

export async function gumSpin<T>(
  title: string,
  fn: () => Promise<T>
): Promise<T> {
  await requireGum();

  const proc = Bun.spawn(["gum", "spin", "--title", title, "--show-output"], {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "pipe",
  });

  const result = await fn();

  proc.stdin?.write("done");
  proc.stdin?.end();
  await proc.exited;

  return result;
}
