# Contributing to hiac

Thank you for your interest in contributing to hiac!

## Development Setup

```bash
# Clone and install
git clone https://github.com/pjsvis/hiac.git
cd hiac
bun install

# Run local development
bun run dev "test prompt"

# Run tests
bun test

# Type check
tsc --noEmit

# Lint
bunx biome check --write .
```

## Code Style

- **Language**: TypeScript 5.x
- **Runtime**: Bun 1.3.8+
- **Linting**: Biome (use `bunx biome check --write`)
- **Style**: 2-space indentation, camelCase

## Project Structure

```
hiac/
├── index.ts              # CLI entry point
├── package.json          # Package config
├── tsconfig.json         # TypeScript config
├── biome.json            # Linting rules
├── LICENSE               # MIT license
├── README.md             # User documentation
├── src/
│   ├── types.ts          # Core interfaces
│   ├── factory.ts        # Provider routing
│   ├── chat.ts           # Interactive REPL
│   ├── oneshot.ts        # Pipe execution
│   ├── hooks.ts          # Verification logic
│   ├── providers/
│   │   ├── ollama.ts     # Local provider
│   │   └── cloud.ts      # Cloud provider
│   └── utils/
│       ├── gum.ts        # Gum wrappers
│       ├── context.ts    # Context hydration
│       ├── diagram.ts    # Mermaid extraction
│       └── roles.ts      # Role management
├── tests/                # Test files
└── .hiac/                # Local config
    ├── roles.yaml        # Predefined roles
    ├── diagrams/         # Mermaid diagrams
    └── prompts/          # Reusable prompts
```

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/ollama.test.ts

# Run tests with coverage
bun test --coverage
```

**Before submitting PR:**
- All tests must pass (`bun test`)
- TypeScript must compile without errors (`tsc --noEmit`)
- Code must pass Biome checks (`bunx biome check`)

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and lint
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Issue Reporting

When reporting issues, include:
- hiac version (`hiac --version`)
- Bun version (`bun --version`)
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Feature Requests

For new features:
- Describe the use case clearly
- Consider if it fits the project scope
- Open an issue for discussion first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Agent Lifecycle & Cleanup

When using AI coding agents (sidecar/pi), follow this checklist before marking work complete.

### During Implementation (Session Hygiene)

- [ ] **Use td** to track task state (`td start`, `td review`, `td close`)
- [ ] **Stay in session** - use same sidecar context to avoid drift
- [ ] **Commit often** - push changes; don't let work pile up uncommitted

### After PR Merge (Mandatory Cleanup)

- [ ] **Delete source branch** (GitHub UI or `git push origin --delete branch-name`)
- [ ] **Close td tasks** - mark implemented tasks as reviewed/closed
- [ ] **Check for orphaned worktrees**

```bash
git worktree list
# Remove any stale worktrees:
git worktree remove /path/to/worktree
```

- [ ] **Check for orphaned branches**

```bash
# Local stale branches (merged into main):
git branch --merged main | grep -v main | xargs git branch -d

# Remote stale branches:
git fetch --prune
```

### Periodic Hygiene (Weekly/Sprint)

```bash
# Check for backup files accidentally committed
find . -name "*.bak" -o -name "*.orig" -o -name "*.swp"

# Check for untracked debris
git status --short

# Review open PRs - close or merge stale ones
gh pr list --state open

# Review td tasks - close stale review items
td list
```

### Why This Matters

Without cleanup:
- Worktrees accumulate → git becomes confused about "where am I?"
- Branches accumulate → PR list becomes unreadable
- Tasks accumulate → "what's actually left to do?" becomes unanswerable

Treat agents like contractors: they create work, but someone must close the loop.