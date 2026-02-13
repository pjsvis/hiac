# hiac Documentation Index

Complete documentation for the hiac CLI tool.

## Documentation Files

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Comprehensive system design, component overview, and data flows |
| [CODE_GUIDE.md](CODE_GUIDE.md) | Quick reference for code patterns, common tasks, and development workflow |
| [../README.md](../README.md) | User-facing documentation: installation, usage, examples |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines for developers |
| [../CHANGELOG.md](../CHANGELOG.md) | Version history and release notes |
| [../.hiac/diagrams/](../.hiac/diagrams/) | Mermaid flow diagrams for all system processes |

## Diagram Documentation

See [diagrams README](../.hiac/diagrams/README.md) for:
- List of all flow diagrams
- When to use each diagram
- How to view Mermaid diagrams

### Available Diagrams

| Diagram | Description |
|---------|-------------|
| [Architecture](../.hiac/diagrams/architecture.md) | Complete system overview with all components |
| [One-Shot Flow](../.hiac/diagrams/oneshot-flow.md) | One-shot mode execution with verification hooks |
| [Chat Flow](../.hiac/diagrams/chat-flow.md) | Interactive REPL flow and Gum formatting |
| [Config System](../.hiac/diagrams/config-system.md) | Configuration loading and prompt mode |
| [Verification Hooks](../.hiac/diagrams/verification-hooks.md) | Auto-retry loop with error feedback |
| [Provider Routing](../.hiac/diagrams/provider-routing.md) | Ollama vs Cloud provider selection |
| [Role System](../.hiac/diagrams/role-system.md) | Role definitions, building, and usage |
| [Mermaid Extraction](../.hiac/diagrams/mermaid-extraction.md) | Diagram extraction from AI responses |

## Quick Links

### For Users
- **Getting Started**: [README.md](../README.md)
- **Installation**: [README.md#Installation](../README.md#installation)
- **Usage Examples**: [README.md#Usage](../README.md#usage)
- **Configuration**: [README.md#Configuration](../README.md#configuration)

### For Developers
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Code Patterns**: [CODE_GUIDE.md](CODE_GUIDE.md)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Visual Flows**: [diagrams/](../.hiac/diagrams/)

### For Troubleshooting
- **Platform Requirements**: [README.md#platform-support](../README.md#platform-support)
- **Common Issues**: [CODE_GUIDE.md#troubleshooting](CODE_GUIDE.md#troubleshooting)
- **Gum Installation**: [README.md#installation](../README.md#installation)

## Documentation Generation

### Mermaid → SVG Conversion

Convert diagrams to SVG images:
```bash
bun run diagrams
```

Output: `docs/diagrams/svg/` with image references embedded in markdown files.

### Limitations

Complex Mermaid syntax may fail to convert. Manual adjustment of problematic diagrams may be required.

## Project Status

- **Version**: 0.2.0
- **Build Status**: ✅ Passing
- **Tests**: 17/17 passing
- **Platform**: macOS/Linux (Gum required)
- **Bundle Size**: 0.35 MB