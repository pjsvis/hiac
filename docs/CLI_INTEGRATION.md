# CLI Tool Integration Guide

Complete guide for integrating external AI CLI tools (Claude, Gemini, Kilo) with hiac.

## Overview

hiac now supports external AI CLI tools through dedicated flags, allowing you to pass packaged context (briefs, playbooks, selected files) to CLIs that lack built-in tool capabilities.

**Two ways to use CLI tools:**
1. **Built-in hiac flags** (`--claude`, `--gemini`, `--kilo`) - Recommended, seamless with hiac features
2. **Direct CLI usage** - Using CLIs standalone with manual context passing

## Supported CLI Tools

| Tool | Version | Purpose | Context Support | Streaming |
|------|---------|---------|----------------|-----------|
| [Claude CLI](#claude-cli) | 2.1.27+ | Anthropic Claude | System prompts, file refs | Yes |
| [Gemini CLI](#gemini-cli) | 0.27.3+ | Google Gemini | Stdin prompts, extensions | Yes (headless) |
| [Kilo CLI](#kilo-cli) | 1.0.14+ | Multiple providers | Prompts, config files | No (interactive only) |

## Using CLI Tools with hiac

### Quick Start

```bash
# Use Claude CLI with hiac
hiac --claude "Summarize this code"

# Use Gemini CLI with specific model
hiac --gemini -m gemini-2.0-flash "Review architecture"
hiac --gemini -m gemini-2.5-pro "Explain this design"

# Interactive chat with Claude
hiac -c --claude

# With context files
hiac --claude --brief briefs/project.md --playbook playbooks/dev.md "What should I build next?"
```

## Installation

### Claude CLI

**Required for `--claude` flag:**

```bash
# Via npm
npm install -g @anthropics/claude-code

# Via Homebrew
brew install claude

# Via Bun
bun install -g @anthropics/claude-code
```

**Configuration:**
```bash
# Set API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Set default model
export ANTHROPIC_DEFAULT_MODEL="claude-sonnet-4"
```

```bash
# Via npm
npm install -g @anthropics/claude-code

# Via Homebrew
brew install claude

# Via Bun
bun install -g @anthropics/claude-code
```

**Configuration:**
- Model selection via environment variables (`.zshrc`)
- `export ANTHROPIC_DEFAULT_MODEL="claude-sonnet-4"`
- `export ANTHROPIC_API_KEY="sk-ant-..."`

### Gemini CLI

```bash
# Via npm
npm install -g gemini-cli

# Via Homebrew
brew install gemini-cli

# Via Bun
bun install -g gemini-cli
```

**Configuration:**
- Model selection via `-m` flag
- `--list-models` to see available models
- API key via environment variable: `GOOGLE_API_KEY`

### Kilo CLI

```bash
# Via Homebrew tap
brew install marcus/tap/td

# Via Bun
bun install -g @marcus/tap/td
```

**Configuration:**
- Model selection via `--prompt` flag
- Credentials managed by kilo
- Use `kilo auth` to configure

## How hiac Passes Context to CLI Tools

### Claude CLI

hiac uses Claude's `--print` flag for headless non-interactive mode:

```typescript
// Implementation approach
// 1. Write prompt to temp file (/tmp/hiac-claude/prompt.txt)
// 2. Call: claude --print -f /tmp/hiac-claude/prompt.txt
// 3. Stream output to user
// 4. Clean up temp file
```

**Features:**
- Full context from briefs, playbooks, system prompts
- Non-interactive streaming output
- Temporary file cleanup

### Gemini CLI

hiac uses Gemini's `-p` (headless stdin) flag:

```typescript
// Implementation approach
// 1. Build prompt from context
// 2. Call: gemini -p -m <model> <prompt>
// 3. Stream output via stdout
```

**Features:**
- Full context support via stdin
- Model selection via `-m` flag
- Headless streaming output

### Kilo CLI

**Status:** Not fully integrated. Kilo requires WebSocket server implementation for streaming.

**Current workaround:** Use Kilo directly:
```bash
kilo --prompt "$(cat briefs/project.md && cat playbooks/dev.md)" "What should I do?"
```

## Usage Examples

### With hiac Flags (Recommended)

```bash
# One-shot with Claude
hiac --claude --brief briefs/architecture.md "Summarize this architecture"

# One-shot with Gemini, specific model
hiac --gemini -m gemini-2.5-pro --playbook playbooks/review.md "Review this design"

# Interactive chat with Claude
hiac -c --claude

# With verification hook
hiac --claude --hook "bun test" "Fix the failing tests"

# Combine context sources
hiac --claude --brief briefs/project.md --playbook playbooks/dev.md "What should I build next?"
```

### Direct CLI Usage (Manual)

These patterns work without hiac integration:

## Model Selection

### Claude CLI Models

**When using `--claude` flag:**
- Model defaults to `claude-sonnet-4`
- Can override with `-m` flag (if supported by Claude CLI)

**Available models:**
- `claude-sonnet-4`
- `claude-3.5-sonnet`
- `claude-3-haiku`

**Check full list:**
```bash
claude claudes  # List available models
```

**Set default via environment:**
```bash
export ANTHROPIC_DEFAULT_MODEL="claude-sonnet-4"
```

### Gemini CLI Models

**When using `--gemini` flag:**
- Model defaults to `gemini-1.5-flash`
- Override with `-m` flag

**Available models:**
- `gemini-2.5-pro` / `gemini-2.5-flash`
- `gemini-2.0-flash-exp`
- `gemini-1.5-pro` / `gemini-1.5-flash`

**List available models:**
```bash
gemini --list-models
```

### Kilo CLI Models

Kilo supports multiple providers:
```bash
kilo models  # List available
```

## CLI Tool Features

### Claude CLI

**Environment Variables:**
- `ANTHROPIC_API_KEY` - Required
- `ANTHROPIC_DEFAULT_MODEL` - Default model
- `ANTHROPIC_DIR` - Cache location

**Key Flags:**
- `--print` - Non-interactive mode (used by hiac)
- `--file <path>` - Load file at startup
- `--append-system-prompt` - Add system prompt
- `-c` - Continue last conversation

**Interactive vs Headless:**
```bash
# Interactive (direct usage)
claude "Discuss the architecture"

# Headless (used by hiac)
claude --print "Summarize this: " < file.txt
```

### Gemini CLI

**Environment Variables:**
- `GOOGLE_API_KEY` - Required
- `GEMINI_MODEL` - Default model

**Key Flags:**
- `-m <model>` - Specify model
- `-p` - Headless mode (used by hiac)
- `--prompt-interactive` - Execute prompt then interactive
- `--approval-mode` - `default`, `auto_edit`, `yolo`, `plan`

**Interactive vs Headless:**
```bash
# Interactive (direct usage)
gemini "Let's discuss the code"

# Headless (used by hiac)
gemini -p "Summarize this code" < file.txt
```

### Kilo CLI

**Environment Variables:**
- Managed internally (use `kilo auth`)

**Key Flags:**
- `--prompt` - Initial prompt
- `--file` - Load files
- `--serve` - Headless server mode

**Note:** Kilo requires WebSocket streaming, which is not yet implemented in hiac integration.

## Implementation Details

### hiac CLI Provider Architecture

**File:** `src/providers/cli-providers.ts`

```typescript
// Base class for all CLI providers
abstract class CLIProvider {
  async *stream(messages, model, options): AsyncIterable<string> {
    const prompt = this.buildPrompt(messages);
    yield* this.streamFromCLI(prompt);
  }
}

// Claude: uses --print flag and temp files
class ClaudeCLIProvider extends CLIProvider {
  async *streamFromCLI(prompt) {
    // 1. Write prompt to /tmp/hiac-claude/prompt.txt
    // 2. Call: claude --print -f /tmp/hiac-claude/prompt.txt
    // 3. Stream output
    // 4. Cleanup
  }
}

// Gemini: uses -p flag with stdin
class GeminiCLIProvider extends CLIProvider {
  async *streamFromCLI(prompt) {
    // 1. Call: gemini -p -m <model> <prompt>
    // 2. Stream output from stdout
  }
}

// Kilo: not yet implemented (needs WebSocket)
class KiloCLIProvider extends CLIProvider {
  async *streamFromCLI(prompt) {
    throw new Error("Kilo requires WebSocket implementation");
  }
}
```

### Factory Routing

**File:** `src/factory.ts`

```typescript
export function getCliProvider(
  claude?: boolean,
  gemini?: boolean,
  kilo?: boolean
): Provider | null {
  const detected = detectCLIs();

  if (claude && detected.claude) return new ClaudeCLIProvider();
  if (gemini && detected.gemini) return new GeminiCLIProvider();
  if (kilo && detected.kilo) return new KiloCLIProvider();

  return null;
}
```

### CLI Detection

```typescript
export function detectCLIs(): {
  claude: boolean;
  gemini: boolean;
  kilo: boolean;
} {
  // Check if each CLI is installed
  // Returns detection status
}
```

## Troubleshooting

### Claude: "No such command or option"
```bash
# Check installed version
claude --version

# Reinstall if needed
brew reinstall claude
```

### Gemini: "Connection error"
```bash
# Check API key
echo $GOOGLE_API_KEY

# Reauthenticate
gemini auth
```

### Kilo: "Model not found"
```bash
# Check which models are available
kilo --prompt "What models can you use?"

# Reconfigure auth if needed
kilo auth
```

### Context Not Being Passed
```bash
# Verify pipe works
echo "test" | claude

# Test system prompt
claude --append-system-prompt "TEST" "Echo this: TEST"
```

## Next Steps

1. Install at least one CLI tool (Claude, Gemini, or Kilo)
2. Configure credentials (API keys)
3. Create wrapper scripts or extend hiac
4. Test context passing with your actual use cases