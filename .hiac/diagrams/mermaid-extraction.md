# Mermaid Diagram Extraction

Automatically extracts Mermaid diagrams from AI responses and saves to `./design/`.

```
::: tip
![Diagram](./diagrams/svg/mermaid-extraction.svg)
:::
```

## Regex Pattern

```javascript
/```mermaid([\s\S]*?)```/g
```

Matches:
- Opening ```mermaid
- Any content (including newlines)
- Closing ```

## Naming Convention

```
./design/<timestamp>.svg

Example:
./design/2026-02-12_11-43-00.svg
./design/2026-02-12_11-43-01.svg
```

## Example

### AI Response
```markdown
Here's the architecture:

```mermaid
flowchart TD
  A[Bun] --> B[TypeScript]
  B --> C[Gum]
```

Let me know if you need changes.
```

### Extraction Results
```
📄 Extracted 1 diagram(s) to ./design/

File: ./design/2026-02-12_11-43-00.svg
Content:
flowchart TD
  A[Bun] --> B[TypeScript]
  B --> C[Gum]
```

### Future Enhancement

The extracted `.svg` files are currently just the Mermaid source code. They could be rendered using:

```bash
mmdc -i diagram.mmd -o diagram.svg
```

(mmdc = Mermaid CLI)