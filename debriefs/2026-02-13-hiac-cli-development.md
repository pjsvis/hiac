---
date: 2026-02-13
tags:
  - feature
  - cli
  - config
  - refactoring
  - testing
  - documentation
agent: claude
environment: local
---

## Debrief: hiac CLI Tool Development

## Accomplishments

- **Initial hiac CLI Implementation**: Created complete CLI tool with multi-provider support (Ollama local, OpenRouter cloud), one-shot pipe-friendly mode, interactive Gum-powered chat REPL, verification hooks with auto-retry, and Mermaid diagram extraction.

- **Configuration System**: Implemented hierarchical config system with global (`~/.hiac/config.yaml`) and local (`.hiac/config.yaml`) config support, `hiac --init` command for setup, and folder configuration for briefs, debriefs, playbooks, and system-prompts.

- **Prompt Mode**: Created guided setup mode (no-params behavior) with role selection via Gum filter, multi-select for brief/playbook files, and direct entry to chat REPL.

- **Dialog Saving**: Added `--save-dialog` flag for saving chat sessions as markdown to `./dialogs/` directory with timestamps and role labeling.

- **Error Handling Refactoring**: Implemented `await-to-js` pattern across codebase for cleaner async error handling, minimizing try-catch blocks to only wrap error-prone operations.

- **Documentation**: Created 7 Mermaid diagram files (architecture.md, oneshot-flow.md, chat-flow.md, config-system.md, verification-hooks.md, provider-routing.md, role-system.md, mermaid-extraction.md) and comprehensive documentation (README.md, CONTRIBUTING.md, CHANGELOG.md, .npmignore).

- **Test Suite**: All 17 tests passing, build succeeding (0.35 MB), TypeScript compilation clean.

## Problems

- **TypeScript Compilation Errors**: Line 168 constant reassignment issues resolved by changing `const model` and `const systemPrompt` to `let` declarations in index.ts.

- **File Corruption**: src/chat.ts became empty and index.ts had syntax errors during sed command attempts. Resolution rebuilt corrupted sections properly.

- **Import Issues**: src/hooks.ts imported non-existent types (HookResult, ContextOptions, ProviderConfig from types.ts). Fixed by adding local interface definitions.

- **Bun/TTY Issues**: Gum commands failed in development environment due to no TTY (`/dev/tty: device not configured`). Solution: require actual terminal for interactive testing.

- **Line Wrap Not Working**: wrapAnsiText function had flawed ANSI preservation logic. Rewrote to properly track active codes, reset/reopen across line breaks.

- **Duplicate Code Lines**: RunPromptMode function had leftover duplicate code (lines 248-297) causing syntax errors. Cleaned up by removing redundant statements.

- **Try-Catch Scope Issues**: Initial chat.ts wrapped entire function in try-finally, causing TypeScript errors. Refactored to minimize try-catch scope to only error-prone operations.

## Lessons Learned

- **Constant Reassignment**: Always check if `const` declarations are being reassigned before error hunting; `let` declarations save debugging time.

- **File Backup Important**: Failed sed commands can corrupt files; use built-in edit tool instead of bash with sed for file modifications.

- **Minimal Try-Catch Best Practice**: Try-catch blocks should wrap only error-prone operations (provider calls, async reads) rather than entire functions; keeps code readable and debuggable.

- **await-to-js Pattern**: Using `const [error, result] = await to(promise())` pattern eliminates verbose try-catch blocks for simple error handling, but still needed for critical operations that need specific handling.

- **Gum Requires TTY**: Interactive commands like Gum write/filter require actual terminal; development environments without TTY can't test interactive modes. Solution: test in real terminal.

- **Config Hierarchy**: Global config for system-wide defaults, local config for project overrides; merging order: local overrides global, use DEFAULT_CONFIG as fallback.

- **Role-First UX**: Selecting roles first (which include model + system prompt) reduces user friction vs selecting model then role separately; cleaner, fewer steps.

- **Parallel Agents Helpful**: Search-mode with parallel explore and librarian agents gathers comprehensive context faster than manual tool usage; useful for retrospectives and complex tasks.

## Verification Proof

- **TypeScript**: `tsc --noEmit` passed with zero errors
- **Build**: `bun run build` succeeded (0.35 MB bundle)
- **Tests**: All 17 tests passing (35 expect() calls)
- **Lint**: Biome checks clean
- **Package Config**: .npmignore configured correctly, package.json ready for npm publication
- **Config Test**: `hiac --init` creates global config and default folders correctly