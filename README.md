# hiac

> **Harness for Intelligence and Automated Context** — A CLI tool for AI-assisted development with closed-loop engineering.

[![npm version](https://badge.fury.io/js/hiac.svg)](https://www.npmjs.com/package/hiac)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.3.8+-fa6e05?logo=bun&logoColor=white)](https://bun.sh)

A modern CLI tool that brings AI-assisted development to your terminal. Seamlessly switch between local Ollama and cloud OpenRouter, pipe-friendly automation, and Gum-powered interactive chat sessions.

## Features

- **Multi-Provider Support**: Local Ollama, cloud OpenRouter, and CLI tools (Claude, Gemini, Kilo)
- **One-Shot Mode**: Pipe-friendly execution for automation
- **Interactive Chat Mode**: Gum-powered REPL for conversational AI
- **Verification Hooks**: Auto-retry with error feedback until tests pass
- **Mermaid Extraction**: Automatically extracts diagrams to `./design/`
- **Context Hydration**: Stack briefs, playbooks, and selected files

## Platform Support

**hiac requires Gum** for interactive features (chat mode, file selection, prompt setup).

Gum is available on **macOS, Linux, and Unix-like systems only**.

- ✅ macOS (via Homebrew)
- ✅ Linux (via apt, dnf, etc.)
- ✅ Windows (via Windows Subsystem for Linux - WSL)
- ❌ Windows Native (no TTY support required by Gum)

**Windows Users:** Install via WSL2 for full Gum functionality:
```powershell
wsl --install
# After WSL setup, install Gum
sudo apt install gum  # Ubuntu/Debian
# Then use from WSL terminal
hiac
```

**Native Windows Support:** One-shot mode without Gum may work via Git Bash in limited scenarios, but interactive features require WSL.

## Installation

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- [Gum](https://github.com/charmbracelet/gum) (required for chat mode and file selection)

```bash
# macOS
brew install gum

# Linux
sudo apt install gum  # or dnf install gum

# Windows
winget install charmbracelet.gum
```

**Optional CLI Tools** (for `--claude`, `--gemini`, `--kilo` flags):
- [Claude CLI](https://github.com/anthropics/claude-code): `brew install claude` or `npm install -g @anthropics/claude-code`
- [Gemini CLI](https://github.com/google-gemini/gemini-cli): `npm install -g gemini-cli`
- [Kilo CLI](https://github.com/marcus/proxy): `brew install marcus/tap/td`

### Install hiac

```bash
bun install -g hiac
```

Initialize configuration:
```bash
hiac --init
```

This creates:
- `~/.hiac/config.yaml` (global config)
- Default folders: `briefs/`, `debriefs/`, `playbooks/`, `system-prompts/`

Or clone and link locally:

```bash
git clone https://github.com/pjsvis/hiac.git
cd hiac
bun install
bun link
hiac --init
```

## Configuration

`hiac` uses a hierarchical config system:

1. **Global**: `~/.hiac/config.yaml` (applies everywhere)
2. **Local**: `.hiac/config.yaml` (project-specific, overrides global)

**Config format:**
```yaml
folders:
  briefs: ./briefs
  debriefs: ./debriefs
  playbooks: ./playbooks
  system-prompts: ./system-prompts
```

Initialize with default folders:
```bash
hiac --init
```

## Usage

### Prompt Mode (No Params)

Run `hiac` without arguments for guided setup:
```bash
hiac
```

Interactive flow:
1. Select role (includes model + system prompt)
2. Multi-select brief files
3. Multi-select playbook files
4. Enter chat REPL

### One-Shot Mode

```bash
# Basic usage
hiac "Explain this code"

# With specific model
hiac -m llama3 "Summarize this file"

# Cloud model (OpenRouter)
hiac -m anthropic/claude-3-haiku "Write a test"

# With Claude CLI
hiac --claude "Summarize this code"

# With Gemini CLI
hiac --gemini -m gemini-2.0-flash "Review this file"

# Pipe input
cat error.log | hiac "What went wrong?"

# With verification hook
hiac "Implement foo()" --hook "bun test"
```

### Interactive Chat Mode

```bash
# Start chat with default model
hiac -c

# Chat with cloud model
hiac -c -m openai/gpt-4o-mini

# Chat with Claude CLI
hiac -c --claude

# Chat with Gemini CLI
hiac -c --gemini

# Chat with dialog saving
hiac -c --save-dialog
```

### File Selection

```bash
# Select files interactively (requires Gum)
hiac "Analyze these files" --select

# With context files
hiac "Review the architecture" --brief ./briefs/architecture.md --playbook ./playbooks/review.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Required for cloud models (OpenRouter) |
| `ANTHROPIC_API_KEY` | Required for Claude CLI |
| `GOOGLE_API_KEY` | Required for Gemini CLI |

```bash
# Cloud models
export OPENROUTER_API_KEY=your-key-here

# Claude CLI
export ANTHROPIC_API_KEY=sk-ant-...

# Gemini CLI
export GOOGLE_API_KEY=your-key-here
```

## Model Routing

| Pattern | Provider |
|---------|----------|
| `llama3`, `mistral`, etc. | Ollama (local) |
| `gpt-4`, `gpt-4o-mini` | OpenRouter (cloud) |
| `anthropic/claude-*` | OpenRouter (cloud) |
| `openai/*` | OpenRouter (cloud) |

### CLI Tool Flags

| Flag | Purpose | Requires |
|------|---------|----------|
| `--claude` | Use Claude CLI | Claude CLI installed |
| `--gemini` | Use Gemini CLI | Gemini CLI installed |
| `--kilo` | Use Kilo CLI | Kilo CLI installed |

CLI tools provide context-aware AI for documents but lack native tool capabilities. Use these flags when you want to pass briefs, playbooks, and files to external CLI tools.

## Verification Hooks

The `--hook` flag enables closed-loop engineering:

1. AI generates code
2. Hook command runs (e.g., `bun test`)
3. On failure, errors feed back to AI
4. AI regenerates with fix
5. Repeats up to 3 times

```bash
hiac "Add validation to the form" --hook "bun test"
```

## Project Structure

```
hiac/
├── index.ts              # CLI entry point
├── src/
│   ├── types.ts          # Core interfaces
│   ├── factory.ts        # Provider routing
│   ├── chat.ts           # Interactive mode
│   ├── oneshot.ts        # Pipe-friendly execution
│   ├── hooks.ts          # Verification logic
│   ├── providers/
│   │   ├── ollama.ts     # Local substrate
│   │   ├── cloud.ts      # OpenRouter substrate
│   │   └── cli-providers.ts  # CLI tool wrappers
│   └── utils/
│       ├── gum.ts        # Gum command wrappers
│       ├── context.ts    # File ingestion
│       └── diagram.ts    # Mermaid extraction
└── .hiac/                # Local personas/hooks
```

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run dev "test prompt"

# Type check
tsc --noEmit

# Lint
bunx biome check src/ --diagnostic-level=error

# Build
bun run build

# Convert Mermaid diagrams to SVG
bun run diagrams
```

### Diagram Conversion

The `bun run diagrams` script converts Mermaid diagrams from `.hiac/diagrams/` to SVG files and embeds them in documentation.

**Requirements:** `@mermaid-js/mermaid-cli` (installed as devDependency)

**Output:**
- SVGs saved to: `docs/diagrams/svg/`
- Mermaid code blocks replaced with SVG image references

**Limitations:** Complex Mermaid syntax may fail to convert. Manual adjustment of problematic diagrams may be required.

## Architecture

For detailed process flows and system design, see the [diagrams documentation](./.hiac/diagrams/README.md) and [comprehensive documentation](./docs/).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © 2026 Peter Smith

---

**Made with Bun, TypeScript, and Gum 💻✨**