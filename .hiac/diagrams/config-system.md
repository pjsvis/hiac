# Configuration System & Prompt Mode

Config loading and guided setup for chat sessions.

```
::: tip
![Diagram](./diagrams/svg/config-system.svg)
:::
```

## Config Hierarchy

```
~/.hiac/config.yaml              (Global - applies everywhere)
    ↓
.hiac/config.yaml                (Local - project-specific override)
    ↓
Final Config                    (Merged result)
```

## Config Format

```yaml
folders:
  briefs: ./briefs
  debriefs: ./debriefs
  playbooks: ./playbooks
  system-prompts: ./system-prompts
```

## Usage

### Initialize
```bash
hiac --init
```

Creates:
- `~/.hiac/config.yaml` with defaults
- Default folder structure in current directory

### Prompt Mode
```bash
hiac
```

Interactive flow:
1. Select role (includes model + system prompt)
2. Multi-select brief files from configured folder
3. Multi-select playbook files from configured folder
4. Enter chat REPL with all selections

### Config Customization

Edit `~/.hiac/config.yaml` to change folder locations:
```yaml
folders:
  briefs: ./docs/briefs
  debriefs: ~/notes/debriefs
  playbooks: ./ops/playbooks
  system-prompts: ./templates
```

Or create `.hiac/config.yaml` in project for overrides.