import { test, expect, describe } from "bun:test";
import { extractMermaid, type ExtractedDiagram } from "@src/utils/diagram.ts";

describe("extractMermaid", () => {
  test("extracts single mermaid diagram", () => {
    const content = `
Here is a diagram:

\`\`\`mermaid
graph TD
    A --> B
\`\`\`

That was the diagram.
`;

    const diagrams = extractMermaid(content);
    expect(diagrams.length).toBe(1);
    expect(diagrams[0].code).toContain("graph TD");
    expect(diagrams[0].code).toContain("A --> B");
  });

  test("extracts multiple mermaid diagrams", () => {
    const content = `
\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`mermaid
sequenceDiagram
    Alice->>Bob: Hello
\`\`\`
`;

    const diagrams = extractMermaid(content);
    expect(diagrams.length).toBe(2);
    expect(diagrams[0].code).toContain("graph TD");
    expect(diagrams[1].code).toContain("sequenceDiagram");
  });

  test("returns empty array when no diagrams found", () => {
    const content = "No diagrams here, just text.";
    const diagrams = extractMermaid(content);
    expect(diagrams.length).toBe(0);
  });

  test("generates unique filenames", () => {
    const content = `
\`\`\`mermaid
graph TD
    A --> B
\`\`\`

\`\`\`mermaid
graph TD
    C --> D
\`\`\`
`;

    const diagrams = extractMermaid(content);
    expect(diagrams[0].filename).not.toBe(diagrams[1].filename);
  });

  test("handles complex mermaid syntax", () => {
    const content = `
\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`
`;

    const diagrams = extractMermaid(content);
    expect(diagrams.length).toBe(1);
    expect(diagrams[0].code).toContain("flowchart TD");
    expect(diagrams[0].code).toContain("Decision");
  });
});
