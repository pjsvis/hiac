To pass a codebase to **`hiac`** effectively, we must move from "dumping raw data" to **Structured Ingestion**. Following the **Lindquist** trajectory, we use **Gum** to handle the high-entropy selection of files, turning the codebase into a curated "context stack."

Here are the three primary methods for passing your codebase, ranked from "Manual" to "Automated."

### 1. The "Gum Filter" Method (Tactical Selection)

This is the most ergonomic way to pass specific parts of a codebase. Instead of passing every file (which creates "conceptual noise"), you use a fuzzy-finder to pick the relevant modules.

**Implementation logic:**
The `hiac --select` flag triggers a sub-process:

```bash
# What happens under the hood when you run: hiac --select "Refactor this"
files=$(find . -maxdepth 3 -not -path '*/.*' | gum filter --no-limit)
hiac "Refactor this" --files "$files"

```

**Why this works:** It adheres to **Deductive Minimalism (COG-12)**. You only pass the "stuff" that matters for the specific "thing" you are building.

---

### 2. The "Context Hydration" Stack (Brief + Playbook + Code)

For complex tasks, you pass the codebase as part of a layered prompt. This is the **Compositional Prompting** pattern.

**The Command:**

```bash
hiac --brief ./TODO.md --playbook ./standards.json --files "./src/*.ts" "Execute the brief"

```

**The Hierarchy:**

1. **Playbook:** Sets the "Rules of Mentation" (how the AI should think).
2. **Brief:** Sets the "Goal" (what the AI should do).
3. **Files:** Provides the "Substrate" (the code to act upon).

---

### 3. The "Recursive Hook" Feed (Self-Healing Ingestion)

If you are passing the codebase to fix errors, you don't just pass the code—you pass the **Execution Trace**.

**The Workflow:**

1. You run `hiac` with a `--hook`.
2. The hook (e.g., `bun test`) fails.
3. `hiac` automatically re-ingests the codebase *plus* the `stderr` from the failure.
4. The AI receives the code and the "reason it is broken" simultaneously.

---

### 4. Technical Implementation: `src/utils/context.ts`

To formalize this in your code, your ingestion logic should look like this:

```typescript
import { $ } from "bun";

export async function ingestCodebase(filePaths: string[]): Promise<string> {
  let codebaseBuffer = "";

  for (const path of filePaths) {
    const file = Bun.file(path);
    if (await file.exists()) {
      const content = await file.text();
      // Wrapping files in tags helps the Substrate distinguish between them
      codebaseBuffer += `\n--- START FILE: ${path} ---\n${content}\n--- END FILE: ${path} ---\n`;
    }
  }

  return codebaseBuffer;
}

```

### Ctx Observation: Avoiding "Context Bloat"

Passing an entire monorepo to a model often triggers **Conceptual Entropy**. I recommend using a `.hiacignore` file (logic similar to `.gitignore`) to ensure that `node_modules`, lockfiles, and binaries are never passed to the substrate.

**Opinion:** Always prioritize passing **Interfaces/Types** over raw implementation if the model only needs to understand *how* to call a module rather than *how* it works internally.

**Would you like me to draft a `.hiacignore` utility to automate the filtering of "junk stuff" from your codebase ingestion?**

---

Assimilating the requirement for **Deductive Minimalism (COG-12)**. To pass a codebase without drowning the substrate in "conceptual noise," we must implement a filtering mechanism.

A `.hiacignore` utility ensures that we only ingest "high-signal" code, excluding "low-signal" artifacts like build folders, lockfiles, and binaries.

### 1. The Filtering Logic: `.hiacignore`

By default, **`hiac`** should look for a `.hiacignore` file. If missing, it should fallback to standard exclusions (e.g., `node_modules`, `.git`).

**`src/utils/context.ts` Implementation:**

```typescript
import { $ } from "bun";
import { ignore } from "ignore"; // Standard gitignore-style parsing

export async function getFilteredFiles(): Promise<string[]> {
  // 1. Get all files in the current scope
  const allFiles = (await $`find . -type f -maxdepth 4`.text())
    .split("\n")
    .filter(Boolean);

  // 2. Load .hiacignore (or default to .gitignore)
  const ignoreFile = Bun.file(".hiacignore");
  const ig = ignore();
  
  if (await ignoreFile.exists()) {
    ig.add(await ignoreFile.text());
  } else {
    // Default safety exclusions
    ig.add([".git/", "node_modules/", "bun.lockb", "dist/", ".DS_Store"]);
  }

  // 3. Filter the list
  return ig.filter(allFiles.map(f => f.replace("./", "")));
}

```

### 2. Ergonomic Integration: `hiac --select`

With the filtering logic in place, we combine it with **Gum** to allow you to "hand-pick" the filtered results. This prevents passing 50 files when only 3 are relevant to the change.

**The Ingestion Flow:**

```typescript
// Inside src/oneshot.ts or src/chat.ts
if (options.select) {
  const filteredList = await getFilteredFiles();
  
  // Pass filtered list to Gum for the final human choice
  const selected = await $`echo "${filteredList.join("\n")}" | gum filter --no-limit --placeholder="Select files for context..."`
    .text();
    
  const paths = selected.trim().split("\n").filter(Boolean);
  const codebaseContext = await ingestCodebase(paths);
  
  // Prepend this to the prompt
  prompt = `CONTEXT:\n${codebaseContext}\n\nUSER QUERY: ${prompt}`;
}

```

### 3. Ctx Opinion: Personas as "Context Filters"

Passing the codebase is only half the battle. You should also pass a **Persona** that knows *how* to look at that code.

For example, a **"Security Architect"** persona file (`.hiac/personas/security.json`) would prioritize looking at `auth.ts` or `db.ts`, while a **"Frontend Dev"** persona would focus on components.

**Proposed Directory Structure for Project Context:**

* `.hiac/ignore`: Project-specific exclusions.
* `.hiac/playbook.json`: Project-specific coding standards.
* `.hiac/hooks.json`: The default command for `--hook` (e.g., `"test": "bun test"`).

---

### Final Recommendation: The "Project Hydration" Command

To make this effortless, we can create a "hydration" command:
`hiac --hydrate`

This would:

1. Read `.hiac/playbook.json`.
2. Open `gum filter` with `.hiacignore` applied.
3. Combine them into a single high-context prompt.

**Shall I finalize the `getFilteredFiles` utility and the `.hiacignore` defaults for the `hiac` codebase?**

---

Assimilating the requirement for **Deductive Minimalism (COG-12)**. To ensure **hiac** operates with high signal-to-noise ratios, we will finalize the **`.hiacignore`** utility.

This utility acts as a "conceptual sieve," preventing the ingestion of low-entropy "junk stuff" (like `node_modules` or `.git` blobs) that would otherwise clutter the substrate’s context window and degrade the quality of its "things" (output).

### 1. Finalized `.hiacignore` Default Configuration

The tool will search for a `.hiacignore` file in the current working directory. If absent, it will apply these **Hardened Defaults** to ensure safety and efficiency:

```text
# .hiacignore defaults
.git/
node_modules/
bun.lockb
package-lock.json
dist/
out/
.DS_Store
*.log
*.exe
*.bin

```

---

### 2. Implementation: `src/utils/ignore.ts`

We use the `ignore` package for standard `.gitignore`-style pattern matching, providing a familiar and durable interface.

```typescript
import { $ } from "bun";
import ignore from "ignore";

/**
 * Generates a filtered list of file paths by checking against .hiacignore
 * or applying high-efficiency defaults.
 */
export async function getFilteredFileList(): Promise<string[]> {
  // 1. Gather all files (max-depth 4 to prevent accidental recursive explosions)
  const rawFiles = (await $`find . -type f -maxdepth 4`.text())
    .split("\n")
    .map(f => f.replace("./", ""))
    .filter(Boolean);

  const ig = ignore();
  const ignoreFile = Bun.file(".hiacignore");

  if (await ignoreFile.exists()) {
    ig.add(await ignoreFile.text());
  } else {
    // Deductive Minimalism: Exclude known noise by default
    ig.add([".git/", "node_modules/", "bun.lockb", "dist/", ".DS_Store", "*.log"]);
  }

  return ig.filter(rawFiles);
}

```

---

### 3. High-Ergonomic Selection: The `hiac --hydrate` Loop

By integrating the filter with **Gum**, we create a "Hydration" workflow. This allows you to select only the relevant code for the current task from a pre-cleaned list.

**The Logic for `src/utils/context.ts`:**

```typescript
import { $ } from "bun";
import { getFilteredFileList } from "./ignore";

export async function hydrateContext(): Promise<string> {
  const filteredFiles = await getFilteredFileList();
  
  // Hand-off to Gum for the human-in-the-loop selection
  const selectedFiles = await $`echo "${filteredFiles.join("\n")}" | gum filter --no-limit --placeholder="Select files for hiac context..."`
    .nothrow()
    .text();

  const paths = selectedFiles.trim().split("\n").filter(Boolean);
  let contextBuffer = "";

  for (const path of paths) {
    const content = await Bun.file(path).text();
    // Structured representation (OH-021)
    contextBuffer += `\n[FILE: ${path}]\n${content}\n[END: ${path}]\n`;
  }

  return contextBuffer;
}

```

---

### 4. Sequence Diagram: The Hydration Workflow

This formalizes the movement of data from the local filesystem through the filter and into the **hiac** mentation engine.

```mermaid
sequenceDiagram
    participant FS as File System
    participant I as Ignore Logic
    participant G as Gum (Select)
    participant H as hiac (Bun)
    participant S as Substrate (AI)

    H->>FS: Scan for files
    FS-->>H: List of all files
    H->>I: Filter against .hiacignore
    I-->>H: High-signal file list
    H->>G: gum filter (Fuzzy search)
    G-->>H: User-selected files
    H->>FS: Read file contents
    H->>H: Package into Context Stack
    H->>S: Send Prompt + Context

```

### Ctx Observation: Operational Superiority

By making the codebase ingestion "Human-Selected but Tool-Filtered," you prevent **Conceptual Entropy**. The model is never confused by an old build artifact or a massive lockfile. It receives only the "Things" it needs to act.

**This concludes the technical architecture of the `hiac` ingestion system. Shall I provide the final command-line flag definitions to tie `--hydrate` into your main entry point?**

To finalize the **`hiac`** interface, we will integrate the `--hydrate` flag. This command serves as the "Ignition Protocol" for your session, automatically invoking the filtered file selector and prepending the results to your prompt.

### 1. The Command Flag Definitions

Integrating these into your `src/index.ts` (using `commander`) allows for a fluid, ergonomic invocation of context.

```typescript
program
  .option("-H, --hydrate", "Open Gum selector to ingest filtered codebase context")
  .option("-b, --brief <path>", "Include a project brief file")
  .option("-y, --playbook <path>", "Include a tactical playbook (CDA/CL)")
  .option("-k, --hook <command>", "Run a recursive verification hook (e.g., 'bun test')")
  .option("-p, --persona <name>", "Load a specific persona profile from .hiac/personas/");

```

---

### 2. The Logic Flow (Implementation)

This is how **`hiac`** assembles the final "Mentation Stack" before sending it to the substrate.

```typescript
// Inside index.ts action handler
let finalPrompt = "";

// 1. Layer the Playbook (The Rules)
if (options.playbook) {
  const playbook = await Bun.file(options.playbook).text();
  finalPrompt += `### PLAYBOOK\n${playbook}\n\n`;
}

// 2. Layer the Brief (The Goal)
if (options.brief) {
  const brief = await Bun.file(options.brief).text();
  finalPrompt += `### BRIEF\n${brief}\n\n`;
}

// 3. Hydrate the Codebase (The Substrate)
if (options.hydrate) {
  const codeContext = await hydrateContext(); // Uses our filtered Gum selector
  finalPrompt += `### CODEBASE CONTEXT\n${codeContext}\n\n`;
}

// 4. Add the specific Instruction
finalPrompt += `### INSTRUCTION\n${userPromptArg}`;

// Execute via One-Shot or Chat with Hook support
if (options.hook) {
  await runWithHook(finalPrompt, options.hook, provider, model);
} else {
  // Standard execution...
}

```

---

### 3. Usage Patterns (The "Lindquist" Workflow)

| Goal | Command |
| --- | --- |
| **Verified Refactor** | `hiac -H -k "bun test" "Refactor the Auth service"` |
| **Architecture Audit** | `hiac -H -y ./security-playbook.json "Identify vulnerabilities"` |
| **New Feature Draft** | `hiac -b ./specs/feature-x.md -H "Implement this"` |

### 4. Ctx Final Observation: Reducing Cognitive Load

The beauty of this assembly is that you no longer need to remember which files are relevant or worry about over-filling the context window with `node_modules`. You simply run `hiac -H`, type a few letters in the **Gum** filter to pick your files, and the tool handles the "Transformation of Stuff into Things."

By adding **Mermaid** extraction (as discussed), the tool becomes a self-documenting engine. Every time you "Hydrate" and prompt, you have the option to receive a verified, diagrammed solution.

---

### Next Step

Your **`hiac`** codebase is now architecturally complete. Would you like me to generate a **Standard Playbook template** (`playbook.json`) that you can place in your `.hiac/` folder to begin testing the **Mentational Humility** of your local models?

---

Assimilating the final directive. To ensure **hiac** functions as a high-fidelity engine for reducing conceptual entropy, we will establish a canonical **Playbook** template.

This template is designed to be placed in `.hiac/playbook.json`. It provides the "Rules of Mentation" that the substrate must follow when processing your codebase, ensuring that even under high pressure, the output remains structured, verified, and humble.

### 1. The Canonical `playbook.json`

This playbook leverages the **Conceptual Lexicon (CL) v1.79** and **CDA #63** logic we have developed.

```json
{
  "version": "1.0.0",
  "persona_reference": "Ctx",
  "directives": [
    {
      "id": "PB-01",
      "instruction": "Transform all 'stuff' (error logs, raw code, loose requirements) into 'things' (type-safe TypeScript, Mermaid diagrams, structured docs)."
    },
    {
      "id": "PB-02",
      "instruction": "Adhere to Deductive Minimalism: Arrive at solutions by subtracting incorrect or redundant components rather than adding complexity."
    },
    {
      "id": "PB-03",
      "instruction": "When a --hook is active, treat failures as high-priority feedback. Analyze the stderr, identify the specific logical flaw, and pivot the strategy immediately."
    },
    {
      "id": "PB-04",
      "instruction": "All architectural changes must be accompanied by a Mermaid diagram if the complexity exceeds T2 (Moderate)."
    }
  ],
  "code_standards": {
    "runtime": "Bun",
    "language": "TypeScript (Strict)",
    "styling": "Clean, functional, and modular."
  }
}

```

---

### 2. Implementation: The Logic of Selection

When you run `hiac -H -y .hiac/playbook.json`, the tool uses the following sequence to build the final mental model for the AI:

1. **Identity:** Load the Playbook (sets the behavioral constraints).
2. **Filter:** Invoke `.hiacignore` to strip away the noise.
3. **Hydrate:** Present the filtered list via **Gum** for human selection.
4. **Execute:** Pass the combined stack to the substrate.

---

### 3. Usage: The "Lindquist" Standard Workflow

Now that the tool is fully assembled, your daily "Refactor/Fix" loop becomes a single ergonomic command:

**Command:**
`hiac -H -y .hiac/playbook.json -k "bun test" "Refactor the context ingestion to be more efficient"`

**What happens:**

1. **Select:** You pick `src/utils/context.ts` and `src/utils/ignore.ts`.
2. **Mentate:** Claude/Llama reads the playbook and the files.
3. **Verify:** It attempts a refactor. **hiac** runs `bun test`.
4. **Correct:** If the test fails, **hiac** feeds the error back.
5. **Finish:** You get a verified refactor and a updated Mermaid diagram of the ingestion flow.

---

### 4. Ctx Final Observation: Operational State Achieved

You have successfully transitioned from a third-party, sunsetted CLI (**mods**) to a bespoke, high-performance harness (**hiac**).

By colocating your keystrokes, enforcing strict dependencies (Gum), and implementing recursive verification loops, you have created a tool that embodies the principles of the **Scottish Enlightenment**: it is empirical, analytical, and pragmatically resourceful.

**The hiac engine is now at Full Operational State. What is your first objective?**