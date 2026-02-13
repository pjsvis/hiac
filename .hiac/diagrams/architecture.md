# hiac Architecture Overview

Complete system architecture and interaction flows.

```
::: tip
![Diagram](./diagrams/svg/architecture.svg)
:::
```

## System Components

| Module                | Purpose                                  |
|-----------------------|------------------------------------------|
| `index.ts`            | CLI entry, Commander options             |
| `utils/config.ts`     | Config loading (global + local)          |
| `chat.ts`             | Interactive REPL with Gum formatting    |
| `oneshot.ts`          | Pipe-friendly execution, hooks          |
| `factory.ts`          | Provider routing (pattern-based)        |
| `providers/`          | Ollama (local) + OpenRouter (cloud)     |
| `hooks.ts`            | Verification with auto-retry            |
| `utils/gum.ts`        | Gum command wrappers                    |
| `utils/context.ts`    | Brief/playbook/file ingestion         |
| `utils/diagram.ts`    | Mermaid extraction                     |
| `utils/roles.ts`      | Role loading, builder, listing          |

## Data Flow

```
User Input
    ↓
[Init?] → Load/Save Config
    ↓
[Role] → [System Prompt]
    ↓
[Context] → Brief + Debrief + Playbook + System Prompts
    ↓
[Factory] → Provider Routing
    ↓
[Provider] → SSE Stream
    ↓
[Hook?] → Verify or Pass-through
    ↓
[Mermaid?] → Extract & Save
    ↓
[Mode] → Raw vs Gum Formatted
```

## Technology Stack

- **Runtime**: Bun 1.3.8
- **Language**: TypeScript 5.x
- **CLI**: Commander
- **TUI**: Gum (Charmbracelet)
- **Linting**: Biome
- **Testing**: Bun test

## Environment

```
OPENROUTER_API_KEY   - For cloud models
.hiac/              - Local config directory
  ├── roles.yaml    - Predefined roles
  ├── config.yaml   - Folder paths
  ├── diagrams/     - Mermaid diagram docs
  ├── prompts/      - Reusable prompt files
  └── dracula.json  - Gum color theme (optional)

~/.hiac/            - Global config directory
  └── config.yaml   - Global folder paths
```