# Changelog

All notable changes to hiac will be documented in this file.

## [0.2.0] - 2026-02-13

### Added
- Configuration system with global (~/.hiac/config.yaml) and local (.hiac/config.yaml) config
- `hiac --init` command to initialize config and default folders
- Prompt mode: `hiac` (no params) → guided setup prior to chat
- Multi-select for brief, playbook, and system-prompt files via Gum
- Debriefs folder for task wrap-up reports
- Config merging: local overrides global settings
- New diagram: config-system.md

## [0.1.0] - 2026-02-12

### Added
- Multi-provider support (Ollama local, OpenRouter cloud)
- One-shot mode with pipe-friendly execution
- Interactive chat mode with Gum-powered REPL
- Verification hooks with auto-retry (up to 3 attempts)
- Mermaid diagram extraction to `./design/`
- Context hydration (briefs, playbooks, file selection)
- Role system with predefined roles (coder, reviewer, architect, etc.)
- Interactive role builder via Gum
- Gum format integration with 70-char line width
- ANSI preservation across line breaks
- File selection via Gum filter
- `--list-models` command for Ollama models
- `--list-roles` command for available roles
- `--build-role` command for custom role creation
- `--role` flag for using predefined roles
- `--system` flag for system prompt injection
- Model routing based on name patterns
- `@file:` references in roles.yaml

### Documentation
- Comprehensive README.md
- Mermaid diagrams for all process flows
- Contributing guidelines

---

## Version Format

We follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug-fixes (backwards compatible)