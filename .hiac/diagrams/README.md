# hiac Process Flows & Architecture

Mermaid diagrams documenting hiac's internal processes and system design.

## Diagrams

| File                    | Description                             |
|-------------------------|-----------------------------------------|
| [architecture.md](architecture.md) | Complete system overview & components   |
| [oneshot-flow.md](oneshot-flow.md) | One-shot mode execution flow           |
| [chat-flow.md](chat-flow.md) | Interactive chat mode REPL              |
| [verification-hooks.md](verification-hooks.md) | Auto-retry loop with error feedback     |
| [provider-routing.md](provider-routing.md) | Ollama vs Cloud provider selection     |
| [role-system.md](role-system.md) | Define and use predefined roles         |
| [mermaid-extraction.md](mermaid-extraction.md) | Diagram extraction from AI responses   |

## Quick Reference

### Execution Modes
- **One-shot**: Pipe-friendly single execution with optional hooks
- **Chat**: Interactive REPL with Gum formatting

### Key Flows
1. **Input → Role → Context → Factory → Provider → Stream → Hook/Extract**
2. **Provider routing**: `/` or `gpt-` → Cloud, otherwise → Ollama
3. **Verification**: 3 attempts feeding errors back to AI

### Core Modules
```
index.ts     → CLI entry
chat.ts      → Interactive REPL
oneshot.ts   → Pipe execution
factory.ts   → Provider routing
hooks.ts     → Verification loop
utils/gum.ts → Gum wrappers
utils/context.ts → Context hydration
utils/diagram.ts → Mermaid extraction
utils/roles.ts → Role management
```

## Viewing Diagrams

These markdown files contain Mermaid diagrams that render in:
- GitHub / GitLab
- VS Code (with Mermaid extension)
- Typora
- Obsidian
- Many other markdown editors

Or render with `mmdc` CLI:
```bash
mmdc -i .hiac/diagrams/oneshot-flow.md -o diagram.svg
```