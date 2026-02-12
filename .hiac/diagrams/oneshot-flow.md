# One-Shot Mode

The one-shot mode processes a single prompt through AI with optional verification hooks and diagram extraction.

```mermaid
flowchart TD
    A[User Input] --> B{Pipe or Prompt?}
    B -->|Pipe| C[Read stdin]
    B -->|Prompt| D[Use provided prompt]
    C --> E{File Selection?}
    D --> E{File Selection?}
    E -->|Yes| F[Select files via Gum]
    E -->|No| G[Skip file selection]
    F --> H[Hydrate Context<br/>brief, playbook, files, stdin]
    G --> H[Hydrate Context]
    H --> I{System Prompt?}
    I -->|Yes| J[Add system prompt]
    I -->|No| K[Build messages]
    J --> K[Build messages]
    K --> L{Verification Hook?}
    L -->|Yes| M[Verify Loop]
    L -->|No| N[Single Response]
    M --> O[Stream response from AI]
    O --> P[Execute hook command]
    P --> Q{Hook passed?}
    Q -->|Yes| R[Save diagrams<br/>and exit]
    Q -->|No, < 3 attempts| S[Feed errors to AI<br/>regenerate]
    S --> O
    Q -->|No, >= 3 attempts| T[Exit with error]
    N --> U[Stream response to stdout]
    U --> V[Extract diagrams]
    V --> W[Save to ./design/]
    W --> X[Done]

    style A fill:#e1f5ff
    style X fill:#e1ffe1
    style T fill:#ffe1e1
    style R fill:#e1ffe1
```

## Key Flows

### With Verification Hook
1. User provides prompt + `--hook "bun test"`
2. Generate response from AI
3. Run hook command
4. Pass → save diagrams, exit success
5. Fail → feed errors back to AI, retry (max 3 attempts)

### Without Verification Hook
1. User provides prompt (no hook)
2. Stream response to stdout
3. Extract Mermaid diagrams
4. Save to `./design/`