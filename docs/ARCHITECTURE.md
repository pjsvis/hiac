# hiac Architecture Documentation

Complete guide to hiac's system design, component structure, and implementation patterns.

## Overview

hiac is a CLI tool for AI-assisted development that provides:
- Multi-provider support (Ollama local, OpenRouter cloud)
- Interactive chat mode with Gum formatting
- Pipe-friendly one-shot mode with verification hooks
- Configuration management and role-based prompts

## System Architecture

The system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│           CLI Entry Point               │
│              (index.ts)                 │
└──────────────┬──────────────────────────┘
               │
               ├─→ Configuration System
               │   (utils/config.ts)
               │   └─→ Global + Local config
               │
               ├─→ Provider Factory
               │   (factory.ts)
               │   └─→ Ollama | Cloud routing
               │
               ├─→ One-Shot Mode
               │   (oneshot.ts)
               │   └─→ Verification Hooks
               │
               └─→ Chat Mode
                   (chat.ts)
                   └─→ Gum-Enhanced REPL
```

See [Architecture Flow Diagram](../.hiac/diagrams/architecture.md) for detailed interactions.

## Core Components

### 1. CLI Entry Point (`index.ts`)

**Responsibilities:**
- Parse command-line arguments via Commander
- Route to appropriate mode (prompt, chat, oneshot, init)
- Load and merge configuration files
- Display formatted help system

**Key Functions:**
```typescript
- runPromptMode(): Interactive guided setup
- runInit(): Initialize configuration
- showHelp(): Formatted two-column help display
```

### 2. Configuration System (`utils/config.ts`)

**Purpose:** Provide hierarchical config management with local overrides for global settings.

**Hierarchy:**
```
~/.hiac/config.yaml (global)
    ↓
.hiac/config.yaml (local override if exists)
    ↓
DEFAULT_CONFIG (fallback)
```

**Config Structure:**
```yaml
folders:
  briefs: ./briefs
  debriefs: ./debriefs
  playbooks: ./playbooks
  system-prompts: ./system-prompts
```

**Functions:**
```typescript
- loadGlobalConfig(): Read ~/.hiac/config.yaml
- loadLocalConfig(): Read .hiac/config.yaml
- loadConfig(): Merge local + global + DEFAULT
- ensureGlobalConfigDir(): Create ~/.hiac/
- writeGlobalConfig(): Save config with YAML
- ensureFolders(): Create all configured folders
```

**Usage:**
```typescript
// Get effective config
const config = loadConfig();

// Use folder paths
const briefPath = config.folders.briefs;
```

### 3. Provider Factory (`factory.ts`)

**Purpose:** Route requests to appropriate provider based on model name patterns.

**Routing Logic:**
```typescript
Model Name Pattern → Provider
-----------------------------------
contains '/'        → Cloud (OpenRouter)
starts with 'gpt-'  → Cloud (OpenRouter)
other names        → Ollama (local)
```

**Provider Interface:**
```typescript
interface Provider {
  stream(messages: Message[], model: string, options?: StreamOptions): AsyncIterable<string>
}
```

**Providers:**
- `OllamaProvider`: localhost:11434, listModels() endpoint
- `CloudProvider`: OpenRouter API with OPENROUTER_API_KEY

### 4. One-Shot Mode (`oneshot.ts`)

**Purpose:** Pipe-friendly single command execution with optional verification hooks.

**Flow:**
```mermaid
stdin/prompt → Context Hydration → Provider Stream → Hook Verification → Diagram Extraction
```

**Key Operations:**
1. Read stdin (if piped)
2. Hydrate context (briefs, playbooks, selected files)
3. Add system prompt
4. Stream from provider
5. Run verification hook (if provided)
6. Extract Mermaid diagrams
7. Write to stdout (raw formatting for one-shot)

**Verification Workflow:**
See [Verification Hooks Diagram](../.hiac/diagrams/verification-hooks.md) for auto-retry logic.

### 5. Chat Mode (`chat.ts`)

**Purpose:** Interactive REPL with Gum formatting and dialog saving.

**Features:**
- Gum-powered user input (`gumWrite`)
- Real-time streaming display
- Gum markdown formatting with 70-char wrap
- ANSI preservation across line breaks
- Dialog saving to `./dialogs/`
- SIGINT handler for clean exit

**UI Flow:**
```
👤 You: [input]
🤔 Thinking...
✅ Ready!
[AI response formatted with Gum]
```

**Cleanup Guaranteed:**
```typescript
try {
  while (true) {
    // Interactive loop with error handling
  }
} finally {
  await cleanup();  // Save dialog if enabled
}
```

See [Chat Flow Diagram](../.hiac/diagrams/chat-flow.md) for details.

### 6. Verification Hooks (`hooks.ts`)

**Purpose:** Closed-loop engineering with auto-retry.

**Retry Logic:**
```typescript
MAX_RETRIES = 3

Loop:
  1. Generate response from AI
  2. Execute hook command
  3. Pass → DONE
  4. Fail → Feed errors back to AI as user message
  5. Retry (up to 3 attempts)
```

**Feedback Message:**
```typescript
{
  role: "user",
  content: `The verification hook failed with the following error:

${lastError}

Please fix the issues and try again.`
}
```

See [Verification Hooks Diagram](../.hiac/diagrams/verification-hooks.md).

### 7. Gum Utilities (`utils/gum.ts`)

**Purpose:** Wrap Gum TUI commands with convenience functions.

**Functions:**
```typescript
- checkGumInstalled(): Verify `which gum`
- requireGum(): Exit if Gum missing
- gumFilter(options, config): Multi-select via Gum
- gumWrite(): Multi-line input via Gum write
- gumFormat(markdown): Format + wrap at 70 chars
- wrapAnsiText(text, width): Preserve ANSI codes when wrapping
```

**Line Wrapping:**
Parses line into segments (ANSI codes vs text), tracks active codes, and reopens codes after line breaks for proper preservation.

### 8. Context Hydration (`utils/context.ts`)

**Purpose:** Load and merge context files into system prompt.

**Sources:**
```typescript
interface ContextOptions {
  brief?: string;      // Project brief
  playbook?: string;  // Playbook directives
  files?: string[];   // Selected files
  stdin?: string;     // Piped input
}

// Returns merged context as concatenated text
```

### 9. Diagram Extraction (`utils/diagram.ts`)

**Purpose:** Extract Mermaid diagrams from AI responses.

**Regex:**
```javascript
/```mermaid([\s\S]*?)```/g
```

**Output:**
- Extracted to `./design/<timestamp>.svg`
- User notification of saved files

See [Mermaid Extraction Diagram](../.hiac/diagrams/mermaid-extraction.md).

### 10. Role System (`utils/roles.ts`)

**Purpose:** Predefined personas with model + system prompt.

**Roles Structure:**
```yaml
roles:
  coder:
    model: kimi-k2.5:cloud
    system: |
      You are an expert software engineer...
      @file:rust-expert.md
```

**File References:**
```yaml
@file:filename.md  →  Resolve to .hiac/prompts/filename.md content
```

**Functions:**
```typescript
- getRole(name): Load role from .hiac/roles.yaml
- listRoles(): Get all role names
- buildRole(): Interactive Gum-based role builder
- listAllRoles(): Return all roles as Record<string, Role>
```

See [Role System Diagram](../.hiac/diagrams/role-system.md).

### 11. Dialog Saving (`utils/dialog.ts`)

**Purpose:** Save chat sessions as timestamped markdown files.

**Output Format:**
```markdown
# Chat Dialog

Saved: 2026-02-13T11:43:00.000Z

---

**System:**
[system prompt]

---

**User:**
[user message]

---

**Assistant:**
[AI response]

---

```

**Location:** `./dialogs/YYYY-MM-DD_HH-mm-SS-dialog.md`

## Data Flow

### One-Shot Mode
```
User Input
  ↓
[Role → System Prompt]  (Optional if --role provided)
  ↓
[Context → Brief + Playbook + Files]
  ↓
[Factory → Provider Routing]
  ↓
[Provider → SSE Stream]
  ↓
[Hook?] → Verify or Pass-Through
  ↓
[Mermaid?] → Extract & Save
  ↓
[Mode] → Raw Output (no formatting)
```

### Chat Mode
```
User Input via Gum
  ↓
[Role → Model + System Prompt]
  ↓
[Context → Briefs + Playbooks]
  ↓
[Factory → Provider]
  ↓
[Stream + Collect]
  ↓
[Gum Format → 70-char wrap]
  ↓
[Display + Add to history]
  ↓
[Loop until exit]
  ↓
[Cleanup → Save dialog if --save-dialog]
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun 1.3.8+ |
| Language | TypeScript 5.x |
| CLI Framework | Commander |
| TUI | Gum (Charmbracelet) |
| Linting | Biome |
| Testing | Bun test |
| Package Manager | Bun |

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, npm config |
| `tsconfig.json` | TypeScript compiler options, path aliases |
| `biome.json` | Linting rules, formatting |
| `~/.hiac/config.yaml` | Global folder configuration |
| `.hiac/config.yaml` | Local folder configuration (optional) |
| `.hiac/roles.yaml` | Predefined role definitions |

## Error Handling Pattern: `await-to-js`

Used throughout codebase for clean async error handling:

```typescript
// Before try-catch
const [error, result] = await to(asyncOperation());
if (error) {
  // Handle error
}
return result;
```

Benefits:
- Eliminates verbose try-catch blocks
- Cleaner code structure
- Consistent error handling

## File Naming Convention

| Pattern | Example |
|---------|---------|
| Main entry | `index.ts` |
| Modules | `module.ts` (lowercase) |
| Utilities | `utils/` subdirectory |
| Providers | `providers/` subdirectory |
| Tests | `*.test.ts` |
| Config | `*.json`, `*.yaml` |

## Prompt Mode Flow

Run `hiac` with no arguments for guided setup:

1. **Select Role** (includes model + system prompt)
2. **Multi-Select Brief Files** from configured folder
3. **Multi-Select Playbook Files** from configured folder
4. **Enter Chat REPL** with all selections applied

See [Config System Diagram](../.hiac/diagrams/config-system.md).

## Deployment

Build and test:
```bash
bun install
bun run build
bun test
npm publish
```

Package contents:
- `dist/index.js` (bundled CLI)
- `README.md` (documentation)
- `LICENSE` (MIT)

## Next Steps

- Explore [diagrams](../.hiac/diagrams/) for visual process flows
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
- Review [CHANGELOG.md](../CHANGELOG.md) for version history