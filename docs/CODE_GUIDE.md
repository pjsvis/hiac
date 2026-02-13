# hiac Code Guide

Quick reference for understanding and working with hiac's codebase.

## Quick Start

```
Clone → Install → Build → Run
```

```bash
git clone https://github.com/pjsvis/hiac.git
cd hiac
bun install
bun run build
bun link
hiac --init
```

## Directory Structure

```
hiac/
├── index.ts              # CLI entry - Commander options, mode routing
├── src/                   # All source code
│   ├── types.ts          # Core TypeScript interfaces
│   ├── factory.ts        # Provider routing (Ollama vs Cloud)
│   ├── chat.ts           # Interactive REPL (Gum formatting)
│   ├── oneshot.ts        # Pipe mode (verification hooks)
│   ├── hooks.ts          # Auto-retry verification logic
│   ├── providers/         # AI provider implementations
│   │   ├── ollama.ts     # Local Ollama (localhost:11434)
│   │   └── cloud.ts      # Cloud OpenRouter
│   └── utils/             # Utility modules
│       ├── gum.ts        # Gum TUI wrappers
│       ├── config.ts     # Configuration loading/saving
│       ├── dialog.ts     # Dialog saving
│       ├── context.ts    # Context file loading
│       └── diagram.ts   # Mermaid extraction
├── tests/                # Test files
├── scripts/              # Build tools
│   └── convert-diagrams.ts  # Mermaid → SVG converter
├── .hiac/                # Local config
│   ├── roles.yaml        # Predefined roles
│   ├── diagrams/         # Mermaid flow diagrams
│   └── prompts/          # Reusable system prompts
├── docs/                 # Generated docs
│   └── diagrams/svg/    # Converted SVGs
├── debriefs/             # Post-task documentation
└── package.json          # Dependencies & scripts
```

## Code Patterns

### 1. Async Error Handling with `await-to-js`

```typescript
import to from "await-to-js";

// Instead of try-catch
const [error, result] = await to(asyncOperation());
if (error) {
  console.error(`Error: ${error}`);
  return null;  // or handle error
}
// Use result
```

### 2. Configuration Loading

```typescript
import { loadConfig } from "@src/utils/config.ts";

// Get effective config (local overrides global)
const config = await loadConfig();

// Access folder paths
config.folders.briefs        // ./briefs
config.folders.debriefs      // ./debriefs
config.folders.playbooks     // ./playbooks
config.folders["system-prompts"]  // ./system-prompts
```

### 3. Provider Streaming

```typescript
import { getProvider } from "@src/factory.ts";

const provider = getProvider("llama3");  // Auto-routes to Ollama
const stream = await provider.stream(messages, "llama3");

for await (const chunk of stream) {
  process.stdout.write(chunk);  // Stream raw
}
```

### 4. Gum Interactive Input

```typescript
import { gumWrite, gumFilter, requireGum } from "@src/utils/gum.ts";

await requireGum();  // Exit if Gum missing - REQUIRED

// Single-line input
const input = await gumWrite("Enter value:");

// Multi-select from list
const files = await gumFilter(fileList, {
  header: "Select Files",
  height: 15,
  multi: true  // Allow multiple selections
});
```

### 5. Role Loading

```typescript
import { getRole, listAllRoles } from "@src/utils/roles.ts";

// Get single role
const role = await getRole("coder");
if (role) {
  console.log(`Model: ${role.model}`);
  console.log(`System: ${role.system}`);
}

// Get all roles
const roles = await listAllRoles();
for (const [name, config] of Object.entries(roles)) {
  console.log(`${name}: ${config.model}`);
}
```

### 6. Dialog Saving

```typescript
import { saveDialog } from "@src/utils/dialog.ts";

const history = [
  { role: "system", content: "You are helpful..." },
  { role: "user", content: "Hello" },
  { role: "assistant", content: "Hi there!" }
];

const filepath = await saveDialog(history);
// → Creates ./dialogs/YYYY-MM-DD_HH-mm-SS-dialog.md
```

## Adding a New Feature

Example: Add `--temperature` flag to control AI response randomness

1. **Add to CLI options** (`index.ts`):
```typescript
.option("--temperature <n>", "Response temperature (0-1)", "0.7")
```

2. **Update types** (`types.ts`):
```typescript
export interface CLIOptions {
  // ... existing
  temperature?: number;
}
```

3. **Pass to provider** (factory.ts or oneshot.ts):
```typescript
const stream = await provider.stream(messages, model, {
  temperature: options.temperature  // Pass to provider
});
```

4. **Test:**
```bash
bun run dev "test" --temperature 0.5
```

## Adding a New Role

1. Run role builder:
```bash
hiac --build-role
```

2. Follow Gum prompts:
   - Select model (local or cloud)
   - Enter system prompt (multi-line)
   - Enter role name
   - Enter description

Saved to: `.hiac/roles.yaml`

3. Use role:
```bash
hiac --role coder "Fix this bug"
```

## Modifying Defaults

### Change Default Model

Edit `index.ts` Commander options:
```typescript
.option("-m, --model <model>", "Model to use", "llama3")  // Change default
```

### Add New Config Option

Edit `.hiac/config.yaml`:
```yaml
folders:
  briefs: ./briefs
  debriefs: ./debriefs
  playbooks: ./playbooks
  "system-prompts": ./system-prompts
  code: ./src           # Add new folder type
```

Update `types.ts`:
```typescript
export interface Config {
  folders: {
    briefs: string;
    debriefs: string;
    playbooks: string;
    "system-prompts": string;
    code?: string;      // Optional
  };
}
```

## Testing

### Run All Tests
```bash
bun test
```

### Run Specific Test
```bash
bun test tests/ollama.test.ts
```

### With Coverage
```bash
bun test --coverage
```

## Common Tasks

### Add New Gum Function

Edit `utils/gum.ts`:
```typescript
export async function gumSpin(
  title: string,
  fn: () => Promise<void>
): Promise<void> {
  const proc = Bun.spawn(["gum", "spin", "--title", title], {
    stdout: "inherit",
    stderr: "inherit",
  });
  await fn();
  proc.kill(9);
}
```

### Debugging

Enable detailed logs:
```bash
BUN_LOG_LEVEL=debug bun run dev "test"
```

### Linting Fixes

Auto-fix all issues:
```bash
bunx biome check --write .
```

## Type Safety

Never suppress TypeScript errors:
```typescript
// ❌ DON'T DO THIS
const data: any = response;

// ✅ DO THIS
interface Data {
  field: string;
}
const data = response as Data;
```

## Platform Requirements

**Required:**
- Bun 1.3.8+
- Gum (macOS/Linux only, not Windows)

**Optional (for features):**
- `OPENROUTER_API_KEY` environment variable (for cloud models)

## Key Diagrams

For visual understanding of flows, see:
- [Architecture Overview](../.hiac/diagrams/architecture.md)
- [One-Shot Flow](../.hiac/diagrams/oneshot-flow.md)
- [Chat Flow](../.hiac/diagrams/chat-flow.md)
- [Verification Hooks](../. hiac/diagrams/verification-hooks.md)
- [Config System](../.hiac/diagrams/config-system.md)
- [Role System](../.hiac/diagrams/role-system.md)

## Troubleshooting

### Gum Not Found
```bash
brew install gum  # macOS
sudo apt install gum  # Linux
```

### Ollama Not Available
```bash
ollama serve  # Start Ollama
ollama pull llama3  # Pull a model
```

### Build Fails
```bash
bun install           # Install deps
tsc --noEmit         # Check types
bun run build        # Build
```

### Tests Fail
```bash
bun test             # Run tests
bunx biome check src/  # Check for lint issues
```

## Development Workflow

1. Make changes
2. Type check: `tsc --noEmit`
3. Lint: `bunx biome check --write .`
4. Test: `bun test`
5. Build: `bun run build`
6. Publish: `npm publish`

## Resources

- [Architecture Documentation](ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Change Log](../CHANGELOG.md)
- [Mermaid Diagrams](../.hiac/diagrams/)