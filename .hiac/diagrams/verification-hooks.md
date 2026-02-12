# Verification Hooks Auto-Retry

Closed-loop engineering with automatic error feedback and regeneration.

```mermaid
flowchart TD
    A[Start Verification] --> B[Get Provider]
    B --> C[Build Messages]
    C --> D[attempts = 0]
    D --> E{attempts < max 3?}
    E -->|No| F[Exit: Failure]
    E -->|Yes| G[attempts++]
    G --> H[[Generate Response<br/>from AI]]
    H --> I[Stream to stdout]
    I --> J[Execute Hook Command]
    J --> K{Hook passed?}
    K -->|Yes| L[Exit: Success]
    K -->|No| M[Capture stderr/stdout]
    M --> N[Add feedback message:<br/>"Hook failed with error..."]
    N --> O[Add to messages:<br/>assistant + user feedback]
    O --> P{attempts < max 3?}
    P -->|No| F
    P -->|Yes| G

    style L fill:#e1ffe1
    style F fill:#ffe1e1
    style H fill:#e1f5ff
    style J fill:#fff5e1
```

## Retry Logic

| Attempt | Action                                   |
|---------|------------------------------------------|
| 1       | Generate → Verify → Pass or Fail         |
| 2       | If fail: Feed errors → Regenerate → Verify |
| 3       | If fail: Feed errors → Regenerate → Verify |
| 4       | If fail: Exit with last error             |

## Feedback Message Format

```typescript
{
  role: "user",
  content: `The verification hook failed with the following error:

${lastError}

Please fix the issues and try again.`
}
```

## Example Usage

```bash
# Generate code + run tests
hiac "Implement user validation" --hook "bun test"

# Workflow:
# 1. AI generates code
# 2. Run `bun test` → FAILS
# 3. Feed test errors to AI
# 4. AI regenerates with fix
# 5. Run `bun test` → PASSES ✅
```