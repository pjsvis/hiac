---
date: 2026-02-19
tags: [feature, cli, refactoring, bugfix, configuration]
agent: claude
environment: local
---

## Debrief: Unified Model Registry & Pre-existing Fixes

## Accomplishments

- **Unified model registry:** Implemented a merged model list combining live Ollama inventory (auto-detected) with user-managed OpenRouter models stored in `~/.hiac/config.yaml`. Picker displays source-tagged entries (`[local]`/`[cloud]`) via Gum filter.
- **Model resolution chain:** Replaced the hardcoded default (`kimi-k2.5:cloud`) with a 5-step resolution chain: explicit `-m` value → role model → config `defaults.model` → interactive Gum picker (TTY) → error (non-TTY). Handles edge cases cleanly (CLI providers skip resolution, piped input gets sensible errors).
- **`-m ?` picker trigger:** Users can force the interactive model picker regardless of config defaults by passing `-m ?`.
- **`--add-model` flag:** One-shot command to register OpenRouter models in global config. Validates the `provider/model` format and deduplicates.
- **Config schema extension:** Added `defaults.model` and `openrouter.models` sections to the Config interface with full backward compatibility (existing configs without these fields still parse).
- **Unified buildRole:** Role builder now uses the same merged model picker instead of Ollama-only selection.
- **Fixed pre-existing issues:** Removed unused `$` import in chat.ts, fixed `proc.text()` → `proc.exited` in cli-providers.ts (stdout was `"inherit"`, not `"pipe"`), added scoped test env var for CloudProvider routing tests.
- **Brief archival:** Moved 8 completed/deprecated design briefs to `briefs/archive/`.

## Problems

- **TypeScript type narrowing with `let` annotations:** Declaring `let model: string | undefined` and then assigning from `resolveModel()` (which returns `string`) doesn't narrow the variable type in TS. Resolved by splitting into a mutable input variable and a final `const resolvedModel` with deterministic assignment via ternary.
- **Commander default masking:** Commander's default value mechanism (`"kimi-k2.5:cloud"`) meant `options.model` was always populated, making it impossible to detect "user didn't specify a model." Solved by removing the Commander default entirely and moving it to config.

## Lessons Learned

- **Test environment isolation matters:** The factory routing tests were silently failing in any environment without `OPENROUTER_API_KEY`. Tests that only verify routing logic shouldn't depend on external credentials — `beforeAll`/`afterAll` env var scoping is the clean pattern.
- **Config defaults belong in config, not CLI flags:** Hardcoded Commander defaults create a maintenance burden and prevent runtime customization. The resolution chain pattern (explicit → config → interactive → error) is more robust and user-friendly.
