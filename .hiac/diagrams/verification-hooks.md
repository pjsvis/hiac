# Verification Hooks Auto-Retry

Closed-loop engineering with automatic error feedback and regeneration.

```
::: tip
![Diagram](./diagrams/svg/verification-hooks.svg)
:::
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