# Chat Mode

Interactive REPL for conversational AI with formatted Gum output.

```mermaid
flowchart TD
    A[Start Chat] --> B[Check Gum installed]
    B -->|No| C[Error: Install Gum]
    B -->|Yes| D[Initialize Provider]
    D --> E{System Prompt?}
    E -->|Yes| F[Add system to history]
    E -->|No| G[Empty history]
    F --> H[Show Chat Banner]
    G --> H[Show Chat Banner]
    H --> I[User input via Gum write]
    I --> J{Input empty?}
    J -->|Yes| K[Exit]
    J -->|No| L[Add user msg to history]
    L --> M[Stream response from AI]
    M --> N[Collect full response]
    N --> O[Format with Gum]
    O --> P[Display formatted output]
    P --> Q[Add assistant to history]
    Q --> I

    style A fill:#e1f5ff
    style K fill:#ffe1e1
    style C fill:#ffe1e1
```

## UI Cycle

```
┌─────────────────────────────────────┐
│ 💬 hiac chat mode (model: xxx)      │
│    Ctrl+D to send, Ctrl+C to exit   │
│                                      │
│ > [User types message]               │
│    Ctrl+D ↓                          │
│                                      │
│ 🤔 Thinking...                       │
│ ✅ Ready!                            │
│                                      │
│ [Gum-styled response]                │
│                                      │
│ > [Next message...]                  │
└─────────────────────────────────────┘
```

## Formatting Features

- **Width clamp**: Line wrap at 70 characters
- **ANSI preservation**: Colors/styles maintained across line breaks
- **Markdown rendering**: Headers, code blocks, bold/italic