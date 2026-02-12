# hiac

> **Harness for Intelligence and Automated Context** — A CLI tool for AI-assisted development with closed-loop engineering.

[![npm version](https://badge.fury.io/js/hiac.svg)](https://www.npmjs.com/package/hiac)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.3.8+-fa6e05?logo=bun&logoColor=white)](https://bun.sh)

A modern CLI tool that brings AI-assisted development to your terminal. Seamlessly switch between local Ollama and cloud OpenRouter, pipe-friendly automation, and Gum-powered interactive chat sessions.

## Features

- **Multi-Provider Support**: Seamlessly switch between local Ollama and cloud OpenRouter
- **One-Shot Mode**: Pipe-friendly execution for automation
- **Interactive Chat Mode**: Gum-powered REPL for conversational AI
- **Verification Hooks**: Auto-retry with error feedback until tests pass
- **Mermaid Extraction**: Automatically extracts diagrams to `./design/`
- **Context Hydration**: Stack briefs, playbooks, and selected files

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

### Install hiac

```bash
bun install -g hiac
```

Or clone and link locally:

```bash
git clone https://github.com/pjsvis/hiac.git
cd hiac
bun install
bun link
```

## Usage

### One-Shot Mode

```bash
# Basic usage
hiac "Explain this code"

# With specific model
hiac -m llama3 "Summarize this file"

# Cloud model (OpenRouter)
hiac -m anthropic/claude-3-haiku "Write a test"

# Pipe input
cat error.log | hiac "What went wrong?"

# With verification hook
hiac "Implement foo()" --hook "bun test"
```

### Interactive Chat Mode

```bash
# Start chat with default model (llama3)
hiac -c

# Chat with cloud model
hiac -c -m openai/gpt-4o-mini
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

```bash
export OPENROUTER_API_KEY=your-key-here
```

## Model Routing

| Pattern | Provider |
|---------|----------|
| `llama3`, `mistral`, etc. | Ollama (local) |
| `gpt-4`, `gpt-4o-mini` | OpenRouter (cloud) |
| `anthropic/claude-*` | OpenRouter (cloud) |
| `openai/*` | OpenRouter (cloud) |

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
│   │   └── cloud.ts      # OpenRouter substrate
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
```

## Architecture

For detailed process flows and system design, see the [diagrams documentation](./.hiac/diagrams/README.md).

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © 2026 Peter Smith

---

**Made with Bun, TypeScript, and Gum 💻✨**