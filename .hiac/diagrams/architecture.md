# hiac Architecture Overview

Complete system architecture and interaction flows.

```mermaid
flowchart TB
    subgraph CLI Entry
        A[User<br>hiac [options] [prompt]]
    end

    A --> B{Mode Selection}
    B -->|--init| INIT[Initialize Config]
    B -->|no params| PM[Prompt Mode]
    B -->|prompt args| OS[One-Shot Mode]
    B -->|--chat<br>--select| CM[Chat Mode]

    INIT --> CONFIG[Load Config<br>~/.hiac/config.yaml]
    CONFIG --> FOLDERS[Create Default Folders<br>briefs, debriefs, playbooks, system-prompts]

    PM --> GUIDE[Guided Setup]
    GUIDE --> MODEL[Select Model]
    MODEL --> ROLE[Select Role]
    ROLE --> BRIEF[Sel Brief Files<br>Multi-select]
    ROLE --> PLAYBOOK[Sel Playbook Files<br>Multi-select]
    ROLE --> SYS[Sel System Prompts<br>Multi-select]
    BRIEF --> CHATREP
    PLAYBOOK --> CHATREP
    SYS --> CHATREP
    CHATREP[Gum REPL]

    CM --> CHATREP
    OS --> FLOW[Direct Processing]

    subgraph Common Components
        G[Factory<br>Provider Routing]
        H[Context Hydration]
        I[Gum Utilities]
        J[Hooks Module]
        K[Mermaid Extraction]
        CFG[Config Loader<br>Global + Local]
    end

    CHATREP --> L{Role System}
    FLOW --> L{Role System}
    L --> G

    subgraph Role System
        M[Load roles.yaml]
        N[File references<br>@file:xxx.md]
        O[Role Builder]
        P[List Roles]
    end

    G -->|Pattern match| V{Cloud?}
    V -->|Yes| W[OpenRouter<br>OllamaCloud]
    V -->|No| X[Ollama<br>localhost:11434]

    W --> Y[SSE Stream]
    X --> Y[SSE Stream]

    CHATREP --> I
    FLOW --> I
    I --> H
    CFG --> H

    H --> Q{Files?}
    Q -->|Yes| R[Gum Filter<br>Multi-select]
    Q -->|No| S[Brief + Playbook]
    R --> T[Briefs<br>Debriefs<br>Playbooks<br>System Prompts]
    T --> U[Messages Build]

    Y --> Z{Verification Hook?}
    Z -->|Yes| J
    Z -->|No| K

    J --> AA[Auto-Retry Loop]
    AA --> AB[Done]
    K --> AC[Save Diagrams]
    AC --> AB

    subgraph Gum Components
        AD[gumFilter]
        AE[gumWrite]
        AF[gumFormat]
        AG[gumSpin]
    end

    subgraph Output Modes
        AH[Raw Stream<br>One-Shot]
        AI[Gum Formatted<br>Chat]
    end

    style A fill:#e1f5ff
    style AB fill:#e1ffe1
    style Y fill:#fff5e1
    style INIT fill:#fff5e1
    style CONFIG fill:#e1ffe1
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