#!/usr/bin/env bun
import { Command } from "commander";
import { startChat } from "@src/chat.ts";
import { runOneshot } from "@src/oneshot.ts";
import { checkGumInstalled } from "@src/utils/gum.ts";
import { OllamaProvider } from "@src/providers/ollama.ts";
import { printRoles, getRole, buildRole } from "@src/utils/roles.ts";
import packageJson from "./package.json" with { type: "json" };

async function showHelp(): Promise<void> {
  const leftWidth = 38;
  const rightWidth = 42;
  const separator = "  ";

  const helpContent = {
    header: ["hiac", "Harness for Intelligence and Automated Context"],
    sections: [
      {
        title: "USAGE",
        left: "hiac [options] [prompt]",
        right: ""
      },
      {
        title: "CORE OPTIONS",
        left: "-m, --model <model>\n-c, --chat\n-H, --hydrate\n--select\n-f, --files <files...>\n--list-models\n--list-roles\n--build-role\n-r, --role <name>\n--init\n--save-dialog",
        right: "Model (default: kimi-k2.5:cloud)\nInteractive chat mode\nIngest filtered codebase\nSelect files via Gum\nInclude specific files\nList Ollama models\nList roles\nBuild custom role\nUse predefined role\nInitialize configuration\nSave chat dialog at end"
      },
      {
        title: "CONTEXT OPTIONS",
        left: "-b, --brief <file>\n-y, --playbook <file>\n-k, --hook <cmd>\n--system <prompt>",
        right: "Load project brief\nLoad playbook directives\nVerification hook\nSystem prompt"
      },
      {
        title: "EXAMPLES",
        left: "One-shot mode\nInteractive chat\nPrompt mode (guided)\nUse a role\nWith files\nWith hook\nWith hydrate",
        right: "echo \"text\" | hiac\nhiac -c\nhiac --init\nhiac --role coder\nhiac --select\nhiac --hook \"test\"\nhiac -H \"Refactor this\""
      }
    ]
  };

  console.log();
  console.log("  " + "═".repeat(leftWidth + rightWidth + separator.length - 4));
  console.log("  " + helpContent.header[0].padEnd(leftWidth + rightWidth + separator.length - 4));
  console.log("  " + helpContent.header[1]);
  console.log("  " + "═".repeat(leftWidth + rightWidth + separator.length - 4));
  console.log();

  for (const section of helpContent.sections) {
    console.log("  " + section.title);
    console.log("  " + "─".repeat(leftWidth + rightWidth + separator.length - 4));

    const leftLines = section.left.split("\n");
    const rightLines = section.right.split("\n");
    const maxLines = Math.max(leftLines.length, rightLines.length);

    for (let i = 0; i < maxLines; i++) {
      const left = (leftLines[i] || "").padEnd(leftWidth, " ");
      const right = rightLines[i] || "";
      if (section.title === "USAGE") {
        console.log("  " + left);
      } else {
        console.log("  " + left + separator + right);
      }
    }
    console.log();
  }

  console.log("  PREREQUISITES");
  console.log("  " + "─".repeat(leftWidth + rightWidth + separator.length - 4));
  console.log("  Bun >= 1.0.0  │  brew install bun");
  console.log("  Gum (TUI)     │  brew install gum");
  console.log();
}

const program = new Command();

program
  .name("hiac")
  .description("Harness for Intelligence and Automated Context")
  .version(packageJson.version)
  .argument("[prompt...]", "The prompt to send to the AI")
  .option("-m, --model <model>", "Model to use", "kimi-k2.5:cloud")
  .option("-c, --chat", "Start interactive chat mode", false)
  .option("-H, --hydrate", "Open Gum selector to ingest filtered codebase context", false)
  .option("--select", "Select files via gum filter", false)
  .option("--list-models", "List available Ollama models", false)
  .option("--list-roles", "List available roles", false)
  .option("--build-role", "Interactive role builder", false)
  .option("-r, --role <name>", "Use a predefined role (model + system prompt)")
  .option("-p, --persona <name>", "Alias for --role")
  .option("--save-dialog", "Save chat dialog at end of session", false)
  .option("-b, --brief <file>", "Load project brief")
  .option("-y, --playbook <file>", "Load playbook directives")
  .option("-k, --hook <command>", "Verification hook for one-shot mode")
  .option("-f, --files <files...>", "Include specific files as context")
  .option("--system <prompt>", "System prompt for the AI")
  .option("-h, --help", "Show help", false)
  .option("--init", "Initialize hiac configuration", false)
.action(async (prompt, options) => {
    if (options.help) {
      await showHelp();
      return;
    }

    const joinedPrompt = Array.isArray(prompt) ? prompt.join(" ") : prompt;

    if (options.init) {
      await runInit();
      return;
    }

    const hasPromptArgs = joinedPrompt && joinedPrompt.length > 0;
    const selectEnabled = options.select || options.hydrate;
    const hasOtherFlags = options.chat || selectEnabled || options.listModels || options.listRoles || options.buildRole || options.hook || options.brief || options.playbook || options.saveDialog || options.files;

    if (!hasPromptArgs && !hasOtherFlags) {
      await runPromptMode(options);
      return;
    }

    const gumInstalled = await checkGumInstalled();

    if (options.listModels) {
      const ollama = new OllamaProvider();
      const available = await ollama.isAvailable();
      if (!available) {
        console.error("Error: Ollama is not running.");
        console.error("Start it with: ollama serve");
        process.exit(1);
      }
      const models = await ollama.listModels();
      if (models.length === 0) {
        console.log("No models found. Pull one with: ollama pull <model>");
        return;
      }
      console.log("Available Ollama models:");
      for (const m of models) {
        const sizeMB = (m.size / 1024 / 1024).toFixed(0);
        console.log(`  ${m.name} (${sizeMB} MB)`);
      }
      return;
    }

    if (options.listRoles) {
      await printRoles();
      return;
    }

    if (options.buildRole) {
      if (!gumInstalled) {
        console.error("Error: Gum is required for role builder.");
        console.error("Install it with: brew install gum");
        process.exit(1);
      }
      await buildRole();
      return;
    }

    let model = options.model;
    let systemPrompt = options.system;
    const roleName = options.role || options.persona;

    if (roleName) {
      const role = await getRole(roleName);
      if (!role) {
        console.error(`Error: Role '${roleName}' not found.`);
        console.error("Run with --list-roles to see available roles.");
        process.exit(1);
      }
      model = role.model;
      if (systemPrompt) {
        systemPrompt = `${role.system}\n\n${systemPrompt}`;
      } else {
        systemPrompt = role.system;
      }
      console.error(`Using role: ${roleName} (${role.model})`);
    }

    if (options.chat || selectEnabled) {
      if (!gumInstalled) {
        console.error("Error: Gum is required for chat mode and file selection.");
        console.error("Install it with: brew install gum");
        console.error("Or visit: https://github.com/charmbracelet/gum");
        process.exit(1);
      }
    }

    let playbook = options.playbook;
    let brief = options.brief;

    if (options.hydrate) {
      if (!playbook) {
        const defaultPlaybook = ".hiac/playbook.json";
        if (await (await import("@src/utils/context.ts")).fileExists(defaultPlaybook)) {
          playbook = defaultPlaybook;
        }
      }
      if (!brief) {
        const defaultBrief = ".hiac/brief.md";
        if (await (await import("@src/utils/context.ts")).fileExists(defaultBrief)) {
          brief = defaultBrief;
        }
      }
    }

    if (options.chat) {
      let finalSystemPrompt = systemPrompt || "";
      let initialFiles: string[] = options.files || [];
      
      if (selectEnabled) {
        const { selectFiles, hydrateContext } = await import("@src/utils/context.ts");
        const selected = await selectFiles();
        initialFiles = [...initialFiles, ...selected];
        
        const context = await hydrateContext({
          brief: brief,
          playbook: playbook,
          files: initialFiles,
        });
        
        if (context.systemPrompt) {
          finalSystemPrompt = finalSystemPrompt 
            ? `${finalSystemPrompt}\n\n${context.systemPrompt}` 
            : context.systemPrompt;
        }
      } else if (brief || playbook || initialFiles.length > 0) {
        const { hydrateContext } = await import("@src/utils/context.ts");
        const context = await hydrateContext({
          brief: brief,
          playbook: playbook,
          files: initialFiles,
        });
        
        if (context.systemPrompt) {
          finalSystemPrompt = finalSystemPrompt 
            ? `${finalSystemPrompt}\n\n${context.systemPrompt}` 
            : context.systemPrompt;
        }
      }

      await startChat({ 
        model, 
        systemPrompt: finalSystemPrompt, 
        saveDialog: options.saveDialog 
      });
      return;
    }

    let hook = options.hook;
    if (hook) {
      const hooksFile = ".hiac/hooks.json";
      if (await (await import("@src/utils/context.ts")).fileExists(hooksFile)) {
        try {
          const hooks = await Bun.file(hooksFile).json();
          if (hooks[hook]) {
            hook = hooks[hook];
          }
        } catch {
          // Ignore JSON parse errors
        }
      }
    }

    await runOneshot({
      model,
      chat: options.chat,
      select: selectEnabled,
      listModels: options.listModels,
      listRoles: options.listRoles,
      brief: brief,
      playbook: playbook,
      hook: hook,
      system: systemPrompt,
      prompt: joinedPrompt,
      files: options.files,
    });
  });

async function runPromptMode(options: any): Promise<void> {
  const { gumFilter, requireGum } = await import("@src/utils/gum.ts");
  const { loadConfig } = await import("@src/utils/config.ts");
  const rolesModule = await import("@src/utils/roles.ts");

  await requireGum();

  console.log("\n🔧 Let's set up your chat session\n");

  console.log("Select a role:");
  const availableRoles = await rolesModule.listAllRoles();

  const roleNames = Object.keys(availableRoles).map(name => {
    const role = availableRoles[name];
    return `${name} - ${role.model}`;
  });
  roleNames.push("(Skip - No role)");

  const selectedRole = await gumFilter(roleNames, { header: "Select Role", height: 15 });

  let model = options.model;
  let systemPrompt = "";

  if (selectedRole.length > 0 && !selectedRole[0].includes("(Skip")) {
    const roleName = selectedRole[0].split(" - ")[0];
    const role = availableRoles[roleName];
    if (role) {
      model = role.model;
      systemPrompt = role.system;
      console.log(`Using role: ${roleName} (${role.model})`);
    }
  }

  const config = await loadConfig();

  console.log("\nSelect brief files (Ctrl+D to finish):");
  const briefFiles = await selectFilesFromFolder(config.folders.briefs, "Brief files");
  console.log(`Selected ${briefFiles.length} brief file(s)`);

  console.log("\nSelect playbook files (Ctrl+D to finish):");
  const playbookFiles = await selectFilesFromFolder(config.folders.playbooks, "Playbook files");
  console.log(`Selected ${playbookFiles.length} playbook file(s)`);

  console.log("\n✅ Configuration complete. Starting chat...\n");

  await startChat({ model, systemPrompt, saveDialog: false });
}

async function selectFilesFromFolder(folder: string, header: string): Promise<string[]> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const absolutePath = path.join(process.cwd(), folder);

  if (!fs.existsSync(absolutePath)) {
    console.log(`Folder not found: ${folder}`);
    return [];
  }

  const files = fs.readdirSync(absolutePath).filter((f) => {
    const ext = f.split(".").pop() || "";
    return ["md", "txt", "yaml", "yml", "json"].includes(ext);
  });

  if (files.length === 0) {
    console.log(`No files found in ${folder}`);
    return [];
  }

  const { gumFilter } = await import("@src/utils/gum.ts");
  const selected = await gumFilter(files, { header, height: 15, multi: true });

  return selected.map((f) => path.join(absolutePath, f));
}

async function runInit(): Promise<void> {
  const { ensureGlobalConfigDir, writeGlobalConfig, ensureFolders, getGlobalConfigDir } = await import(
    "@src/utils/config.ts"
  );

  console.log("\n🔧 Initializing hiac configuration...\n");

  await ensureGlobalConfigDir();

  const configDir = await getGlobalConfigDir();
  console.log(`Global config directory: ${configDir}`);

  const defaultConfig = {
    folders: {
      briefs: "./briefs",
      debriefs: "./debriefs",
      playbooks: "./playbooks",
      "system-prompts": "./system-prompts",
    },
  };

  await writeGlobalConfig(defaultConfig);

  console.log(`Global config file: ${configDir}/config.yaml`);

  await ensureFolders(defaultConfig, process.cwd());

  console.log("\nDefault folders created:");
  for (const [type, folderPath] of Object.entries(defaultConfig.folders)) {
    console.log(`  ${type}: ${folderPath}`);
  }

  console.log("\n✅ Initialization complete!");
  console.log("\nEdit ~/.hiac/config.yaml to customize folder locations.");
  console.log("Run 'hiac' to start a chat session.\n");
}

program.parse();