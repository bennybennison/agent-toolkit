#!/usr/bin/env bun
import { resolve, dirname } from "node:path"
import { existsSync, readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { homedir } from "node:os"
import {
  applyToolkitTarget,
  formatToolkitPackSummary,
  getAdapterTargets,
  getToolkitContentInventory,
  resolveToolkitPacks,
  syncToolkitSharedSkills,
} from "../runtime/lib/toolkit-operations"
import { createToolkitEnvironment } from "../runtime/lib/toolkit-environment"
import { OPTIONAL_RUNTIME_PREFERRED_CLI } from "../runtime/lib/optional-runtime-identity"
import { formatOptionalRuntimeHelp } from "../runtime/lib/optional-runtime-help"
import {
  ExecShellFn,
} from "../runtime/lib/optional-runtime-tool-commands"
import {
  CliCommandError,
  parseProfileArg,
  parseScopeArg,
  parseTools,
  shouldGenerate,
  type ToolSet,
} from "../runtime/lib/optional-runtime-cli-core"
import { installOpenCodeGlobal, uninstallOpenCodeGlobal } from "../runtime/lib/opencode-global-install"
import {
  reportRuntimeCommand,
  toolsCatalogRuntimeCommand,
  toolsCleanupRuntimeCommand,
  toolsInspectRuntimeCommand,
  toolsInstallRuntimeCommand,
  toolsInstalledRuntimeCommand,
  toolsPruneRuntimeCommand,
} from "../runtime/optional/tool-commands"
import { listToolkitCommands } from "../runtime/lib/tooling/command-catalog"
import { listToolkitRecipes } from "../runtime/lib/tooling/recipe-catalog"
import { isAdapterTarget, type AdapterTarget } from "../runtime/lib/tooling/adapter-targets"

const TOOLKIT_DIR = resolve(dirname(import.meta.dirname!))
const TOOLKIT_ENV = createToolkitEnvironment(TOOLKIT_DIR)
const TOOLKIT_RUNTIME_MAIN = resolve(TOOLKIT_DIR, "bin", "runtime-main.ts")

function execShell(cmd: string, args: string[], cwd: string): { code: number; stdout: string; stderr: string } {
  if (typeof globalThis.Bun !== "undefined") {
    const result = Bun.spawnSync([cmd, ...args], { cwd, stdout: "pipe", stderr: "pipe" })
    return {
      code: result.exitCode,
      stdout: new TextDecoder().decode(result.stdout as Uint8Array ?? new Uint8Array()),
      stderr: new TextDecoder().decode(result.stderr as Uint8Array ?? new Uint8Array()),
    }
  }
  try {
    const stdout = execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
    return { code: 0, stdout: stdout ?? "", stderr: "" }
  } catch (error: any) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" }
  }
}

function resolveOptionalRuntimeInvocation(): { cmd: string; args: string[]; cwd: string } | undefined {
  const explicitRuntimeCli = process.env.AGENT_TOOLKIT_RUNTIME_CLI
  if (explicitRuntimeCli) {
    return { cmd: "bun", args: [explicitRuntimeCli], cwd: process.cwd() }
  }
  if (existsSync(TOOLKIT_RUNTIME_MAIN)) {
    return { cmd: "bun", args: [TOOLKIT_RUNTIME_MAIN], cwd: process.cwd() }
  }
  return undefined
}

function applyProjectTargets(projectDir: string, profile: string, tools: ToolSet[]): void {
  const activePacks = resolveToolkitPacks(TOOLKIT_ENV, projectDir, profile)
  console.log(`Resolved ${activePacks.length} packs:`)
  console.log(formatToolkitPackSummary(activePacks))

  const sharedSkills = syncToolkitSharedSkills({
    env: TOOLKIT_ENV,
    scope: "project",
    rootDir: projectDir,
    activePacks,
  })
  if (sharedSkills.filesWritten > 0) {
    console.log(`Shared skills: ${sharedSkills.filesWritten} seeded in .agents/skills/`)
  }

  const openCodeModels = {
    buildModel: "github-copilot/claude-sonnet-4.6",
    planModel: "github-copilot/claude-sonnet-4.6",
  }

  let generated = 0

  for (const target of getAdapterTargets()) {
    if (!shouldGenerate(tools, target)) continue
    const result = applyToolkitTarget({
      env: TOOLKIT_ENV,
      target,
      scope: "project",
      rootDir: projectDir,
      activePacks,
      source: "attach",
      openCodeModels,
    })
    generated += result.filesWritten
    console.log(`${target}: ${result.generatedPaths.join(", ") || "no files written"}`)
  }

  console.log(`Toolkit sync complete. Generated ${generated} file(s).`)
}

function installOpenCodeGlobalCommand(): void {
  const result = installOpenCodeGlobal({
    env: TOOLKIT_ENV,
    execShell,
  })
  const activePacks = resolveToolkitPacks(TOOLKIT_ENV, homedir(), "standard")
  const sharedSkills = syncToolkitSharedSkills({
    env: TOOLKIT_ENV,
    scope: "global",
    rootDir: homedir(),
    activePacks,
  })

  console.log(`Plugin: ${result.pluginAdded ? "added" : "already registered"}`)
  console.log(`Instructions added: ${result.addedInstructionPaths.length}`)
  console.log(`Legacy symlinks removed: ${result.removedLegacySymlinks}`)
  if (sharedSkills.filesWritten > 0) {
    console.log(`Shared skills seeded: ${sharedSkills.filesWritten}`)
  }
  if (result.shortcutInstalled) {
    console.log(`CLI shortcut: ${result.shortcutPath}`)
  }
}

function uninstallGlobal(): void {
  uninstallOpenCodeGlobal({
    env: TOOLKIT_ENV,
    execShell,
  })
  console.log("Toolkit global install removed.")
}

function attachProject(projectDir: string, profile: string, tools: ToolSet[]): void {
  console.log(`Attaching toolkit to ${projectDir}`)
  applyProjectTargets(projectDir, profile, tools)
}

function syncProject(projectDir: string, tools: ToolSet[]): void {
  const profile = parseProfileArg(process.argv, "standard")
  console.log(`Syncing toolkit surfaces in ${projectDir}`)
  applyProjectTargets(projectDir, profile, tools)
}

function statusCommand(projectDir: string, profile: string): void {
  const inventory = getToolkitContentInventory(TOOLKIT_ENV)
  const commands = listToolkitCommands(TOOLKIT_ENV)
  const recipes = listToolkitRecipes(TOOLKIT_ENV)
  const activePacks = resolveToolkitPacks(TOOLKIT_ENV, projectDir, profile)

  console.log(`Toolkit root: ${TOOLKIT_ENV.toolkitRoot}`)
  console.log(`Workspace:    ${projectDir}`)
  console.log(`Profile:      ${profile}`)
  console.log(`Skills:       ${inventory.skills.length}`)
  console.log(`Agents:       ${inventory.agents.length}`)
  console.log(`Legacy cmds:  ${inventory.commands.length}`)
  console.log(`Commands:     ${commands.length}`)
  console.log(`Recipes:      ${recipes.length}`)
  console.log(`Packs:`)
  console.log(formatToolkitPackSummary(activePacks))
}

function recipesCatalogCommand(): void {
  const recipes = listToolkitRecipes(TOOLKIT_ENV)
  for (const recipe of recipes) {
    console.log(`${recipe.id}\t${recipe.capabilityCeiling}\t${recipe.interactionPolicy}\t${recipe.description}`)
  }
}

function recipesShowCommand(id: string | undefined): void {
  if (!id) {
    throw new CliCommandError("Usage: agent-toolkit recipes show <id>")
  }

  const recipe = listToolkitRecipes(TOOLKIT_ENV).find((entry) => entry.id === id)
  if (!recipe) {
    throw new CliCommandError(`Unknown recipe: ${id}`)
  }

  console.log(`id: ${recipe.id}`)
  console.log(`description: ${recipe.description}`)
  console.log(`interactionPolicy: ${recipe.interactionPolicy}`)
  console.log(`capabilityCeiling: ${recipe.capabilityCeiling}`)
  console.log(`contracts: ${recipe.requiredContracts.join(", ") || "-"}`)
  console.log(`skills: ${recipe.suggestedSkills.join(", ") || "-"}`)
  console.log(`specialists: ${recipe.allowedSpecialists.join(", ") || "-"}`)
  console.log("")
  console.log(readFileSync(recipe.sourcePath, "utf8"))
}

function toolsCatalogCommand(): void {
  toolsCatalogRuntimeCommand(TOOLKIT_ENV)
}

function toolsInstalledCommand(projectDir: string): void {
  toolsInstalledRuntimeCommand(TOOLKIT_ENV, projectDir)
}

function printGlobalInstallWarning(target: AdapterTarget): void {
  console.log(`Local-first policy: prefer project installs for ${target} unless you explicitly want shared global state.`)
}

function assertGlobalInspectableTarget(target: AdapterTarget): void {
  void target
}

function toolsInspectCommand(targetArg: string | undefined, dirArg: string | undefined, args: string[]): void {
  const target = requireInspectableTarget(targetArg)
  assertGlobalInspectableTarget(target)
  toolsInspectRuntimeCommand({
    env: TOOLKIT_ENV,
    cliCommand: "agent-toolkit",
    targetArg,
    dirArg,
    args,
  })
}

function toolsCleanupCommand(targetArg: string | undefined, dirArg: string | undefined, args: string[]): void {
  const target = requireInspectableTarget(targetArg)
  assertGlobalInspectableTarget(target)
  toolsCleanupRuntimeCommand({
    env: TOOLKIT_ENV,
    cliCommand: "agent-toolkit",
    targetArg,
    dirArg,
    args,
  })
}

function toolsInstallCommand(targetArg: string | undefined, dirArg: string | undefined, args: string[]): void {
  toolsInstallRuntimeCommand({
    env: TOOLKIT_ENV,
    cliCommand: "agent-toolkit",
    targetArg,
    dirArg,
    args,
    source: "install",
    openCodeModels: {
      buildModel: "github-copilot/claude-sonnet-4.6",
      planModel: "github-copilot/claude-sonnet-4.6",
    },
  })
}

function installCommand(targetArg: string | undefined, dirArg: string | undefined, args: string[]): void {
  if (targetArg && !isAdapterTarget(targetArg) && !dirArg) {
    const projectDir = resolve(targetArg)
    const profile = parseProfileArg(args, "standard")
    console.log(`Installing toolkit in ${projectDir} for all local tool surfaces`)
    attachProject(projectDir, profile, parseTools(args))
    return
  }

  if (!targetArg || !isAdapterTarget(targetArg)) {
    console.error(`Usage: agent-toolkit install <${getAdapterTargets().join("|")}|dir> [dir] [--scope project|global] [--profile standard] [--packs id,id]`)
    console.error("Examples:")
    console.error("  agent-toolkit install .                         # install all local tool surfaces")
    console.error("  agent-toolkit install copilot . --scope project")
    console.error("  agent-toolkit install opencode . --scope project")
    console.error("  agent-toolkit install codex . --scope project")
    console.error("  agent-toolkit install opencode --scope global   # explicit shared state")
    process.exit(1)
  }

  const scope = parseScopeArg(args, "project")
  const resolvedDirArg = dirArg && !dirArg.startsWith("--") ? dirArg : undefined
  if (targetArg === "opencode" && scope === "global") {
    printGlobalInstallWarning(targetArg)
    installOpenCodeGlobalCommand()
    return
  }

  toolsInstallCommand(targetArg, resolvedDirArg, args)
}

function toolsPruneCommand(projectDir: string, tools: ToolSet[], applyChanges: boolean): void {
  toolsPruneRuntimeCommand({
    env: TOOLKIT_ENV,
    projectDir,
    tools,
    applyChanges,
  })
}

function reportCommand(reportType: string | undefined, args: string[]): void {
  reportRuntimeCommand({
    env: TOOLKIT_ENV,
    reportType,
    args,
    execShell: execShell as ExecShellFn,
    cwd: process.cwd(),
  })
}

function requireInspectableTarget(targetArg: string | undefined): AdapterTarget {
  if (!targetArg || !isAdapterTarget(targetArg)) {
    throw new CliCommandError(`Usage: agent-toolkit tools <inspect|cleanup> <target> [dir]`)
  }
  return targetArg
}

function runtimeHelpCommand(): void {
  console.log(formatOptionalRuntimeHelp())
}

function runtimeCommand(args: string[]): void {
  const subcommand = args[0]
  if (!subcommand || subcommand === "help" || subcommand === "--help" || subcommand === "-h") {
    runtimeHelpCommand()
    return
  }

  const invocation = resolveOptionalRuntimeInvocation()
  if (!invocation) {
    console.error("No optional runtime module is available.")
    console.error("Install the legacy compatibility package or add a runtime module path via AGENT_TOOLKIT_RUNTIME_CLI.")
    process.exit(1)
  }

  const result = execShell(invocation.cmd, [...invocation.args, subcommand, ...args.slice(1)], invocation.cwd)
  if (result.code !== 0) {
    console.error(result.stderr || result.stdout || `Runtime command failed: ${subcommand}`)
    process.exit(result.code || 1)
  }
  process.stdout.write(result.stdout)
}

const cmd = process.argv[2] ?? "help"

try {
switch (cmd) {
  case "install":
    installCommand(process.argv[3], process.argv[4], process.argv)
    break
  case "uninstall":
    uninstallGlobal()
    break
  case "attach":
  case "init": {
    const dir = resolve(process.argv[3] || ".")
    const profile = parseProfileArg(process.argv, process.argv[4] && !process.argv[4].startsWith("--") ? process.argv[4] : "standard")
    attachProject(dir, profile, parseTools(process.argv))
    break
  }
  case "sync": {
    const dir = resolve(process.argv[3] || ".")
    syncProject(dir, parseTools(process.argv))
    break
  }
  case "status":
  case "inspect": {
    const dir = resolve(process.argv[3] || ".")
    const profile = parseProfileArg(process.argv, "standard")
    statusCommand(dir, profile)
    break
  }
  case "tools": {
    const subcommand = process.argv[3] ?? "catalog"
    if (subcommand === "catalog" || subcommand === "list") {
      toolsCatalogCommand()
      break
    }
    if (subcommand === "install") {
      const rawDirArg = process.argv[5]
      toolsInstallCommand(process.argv[4], rawDirArg && !rawDirArg.startsWith("--") ? rawDirArg : undefined, process.argv)
      break
    }
    if (subcommand === "installed" || subcommand === "status") {
      toolsInstalledCommand(resolve(process.argv[4] || "."))
      break
    }
    if (subcommand === "inspect") {
      toolsInspectCommand(process.argv[4], process.argv[5], process.argv)
      break
    }
    if (subcommand === "cleanup") {
      toolsCleanupCommand(process.argv[4], process.argv[5], process.argv)
      break
    }
    if (subcommand === "prune") {
      toolsPruneCommand(resolve(process.argv[4] || "."), parseTools(process.argv), process.argv.includes("--yes"))
      break
    }
    console.error("Usage: agent-toolkit tools <catalog|install|installed|inspect|cleanup|prune> ...")
    process.exit(1)
  }
  case "recipes": {
    const subcommand = process.argv[3] ?? "catalog"
    if (subcommand === "catalog" || subcommand === "list") {
      recipesCatalogCommand()
      break
    }
    if (subcommand === "show") {
      recipesShowCommand(process.argv[4])
      break
    }
    console.error("Usage: agent-toolkit recipes <catalog|show> ...")
    process.exit(1)
  }
  case "report":
    reportCommand(process.argv[3], process.argv.slice(4))
    break
  case "runtime":
    runtimeCommand(process.argv.slice(3))
    break
  default:
    console.log(`agent-toolkit

Commands:
  install              Install one toolkit target explicitly, or install all locally with 'install .'
  attach [dir]         Generate toolkit adapter surfaces in a project
  init [dir]           Alias for attach
  sync [dir]           Regenerate toolkit adapter surfaces
  uninstall            Remove global toolkit OpenCode registration
  status [dir]         Show toolkit package and pack status
  runtime <command>    Run the optional runtime/enforcement layer (preferred entrypoint)
  tools catalog        List pack/catalog entries
  recipes catalog      List first-class toolkit recipes
  recipes show <id>    Show recipe metadata and source
  tools install        Install one adapter target directly (project/local by default)
  tools installed [d]  Show project installs first, then explicit global installs
  tools inspect        Show global host entries with selectable keys
  tools cleanup        Remove global host entries by mode or selection
  tools prune [d]      Remove managed local adapter targets not in --tools
  report <type>        Run toolkit report scripts (session-audit, codex-session-audit, copilot-session-audit, optimise, optimise-compare, review-framework)

Runtime examples:
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} attach .
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} sync .
  ${OPTIONAL_RUNTIME_PREFERRED_CLI} status
  agent-toolkit runtime upgrade

Flags:
  --profile <name>     Profile to resolve packs with (default: standard)
  --tools <list>       Comma-separated: ${getAdapterTargets().join(",")},all
  --scope <scope>      project or global (default: project)
  --packs <list>       Explicit pack ids for tools install
`)
}
} catch (error) {
  if (error instanceof CliCommandError) {
    console.error(error.message)
    process.exit(error.exitCode)
  }
  throw error
}
