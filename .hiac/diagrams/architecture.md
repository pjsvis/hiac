# hiac Architecture Overview

Complete system architecture and interaction flows.

```mermaid
flowchart TB
    subgraph CLI Entry
        A[User<br/>hiac [options] [prompt]]
    end

    A --> B{Mode Selection}
    B -->|--chat<br/>--select| C[Chat Mode]
    B -->|default| D[One-Shot Mode]

    C --> E[Gum REPL]
    D --> F[Direct Processing]

    subgraph Common Components
        G[Factory<br/>Provider Routing]
        H[Context Hydration]
        I[Gum Utilities]
        J[Hooks Module]
        K[Mermaid Extraction]
    end

    E --> L{Role System}
    F --> L{Role System}
    L --> G

    subgraph Role System
        M[Load roles.yaml]
        N[File references<br/>@file:xxx.md]
        O[Role Builder]
        P[List Roles]
    end

    G -->|Pattern match| V{Cloud?}
    V -->|Yes| W[OpenRouter<br/>OllamaCloud]
    V -->|No| X[Ollama<br/>localhost:11434]

    W --> Y[SSE Stream]
    X --> Y[SSE Stream]

    E --> I
    F --> I
    I --> H

    H --> Q{Files?}
    Q -->|Yes| R[Gum Filter]
    Q -->|No| S[Brief + Playbook]
    R --> S
    S --> T[Messages Build]

    Y --> U{Verification Hook?}
    U -->|Yes| J
    U -->|No| K

    J --> Z[Auto-Retry Loop]
    Z --> AA[Done]
    K --> AB[Save Diagrams]
    AB --> AA

    subgraph Gum Components
        AC[gumFilter]
        AD[gumWrite]
        AE[gumFormat]
        AF[gumSpin]
    end

    subgraph Output Modes
        AG[Raw Stream<br/>One-Shot]
        AH[Gum Formatted<br/>Chat]
    end

    style A fill:#e1f5ff
    style AA fill:#e1ffe1
    style Y fill:#fff5e1
```

## System Components

| Module       | Purpose                                |
|--------------|----------------------------------------|
| `index.ts`   | CLI entry, Commander options           |
| `chat.ts`    | Interactive REPL with Gum formatting   |
| `oneshot.ts` | Pipe-friendly execution, hooks         |
| `factory.ts` | Provider routing (pattern-based)       |
| `providers/` | Ollama (local) + OpenRouter (cloud)    |
| `hooks.ts`   | Verification with auto-retry           |
| `utils/gum.ts`| Gum command wrappers                  |
| `utils/context.ts`| Brief/playbook/file ingestion      |
| `utils/diagram.ts` | Mermaid extraction                |
| `utils/roles.ts` | Role loading, builder, listing     |

## Data Flow

```
User Input
    ↓
[Role] → [System Prompt]
    ↓
[Context] → Brief + Playbook + Files
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
  ├── diagrams/     - Mermaid diagram docs
  ├── prompts/      - Reusable prompt files
  └── dracula.json  - Gum color theme (optional)
```