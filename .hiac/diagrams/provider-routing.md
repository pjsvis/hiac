# Provider Routing

Automatic routing between local Ollama and cloud OpenRouter based on model name patterns.

```mermaid
flowchart TD
    A[User specifies model] --> B[Pattern Matching]
    B --> C{Model name contains '/' ?}
    C -->|Yes| D[Cloud Provider]
    C -->|No| E{Starts with 'gpt-'?}
    E -->|Yes| F[Cloud Provider]
    E -->|No| G[Ollama Provider]

    D --> H[Check OPENROUTER_API_KEY]
    H --> I{Key exists?}
    I -->|No| J[Error: Set OPENROUTER_API_KEY]
    I -->|Yes| K[Stream from OpenRouter]

    G --> L[Check Ollama running]
    L --> M[Check localhost:11434]
    M --> N{Ollama available?}
    N -->|No| O[Error: Run 'ollama serve']
    N -->|Yes| P[Stream from Ollama]

    K --> Q[SSE Stream]
    P --> Q[SSE Stream]

    style D fill:#e1f5ff
    style F fill:#e1f5ff
    style G fill:#e1ffe1
    style J fill:#ffe1e1
    style O fill:#ffe1e1

    subgraph Cloud Models
        D
        F
    end

    subgraph Local Models
        G
    end
```

## Model Routing Table

| Pattern          | Provider | Example Models        |
|------------------|----------|-----------------------|
| `anthropic/*`    | Cloud    | `claude-3-haiku`      |
| `openai/*`       | Cloud    | `gpt-4`, `gpt-4o-mini`|
| `<provider>/*`   | Cloud    | Any `/` format        |
| `gpt-*`          | Cloud    | `gpt-4`, `gpt-3.5`    |
| Other names      | Ollama   | `llama3`, `mistral`   |

## Configuration

### Cloud Provider
```bash
export OPENROUTER_API_KEY=sk-or-v1-xxx
```

### Local Provider
```bash
ollama serve  # Runs on localhost:11434
ollama pull llama3
ollama list   # See available models
```

## Discovery

### Ollama
```bash
GET /api/tags
Returns: [{ name: "llama3", size: 4096000000 }]
```

### OpenRouter
```bash
GET v1/models via API
Returns: Full catalog with pricing/routing info
```