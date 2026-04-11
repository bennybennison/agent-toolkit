#!/usr/bin/env bun
/**
 * Toolkit-owned optional runtime implementation.
 *
 * Preferred external entrypoint:
 *   agent-toolkit runtime <command>
 */
import { readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { join, dirname, resolve, relative } from "node:path"
import { homedir } from "node:os"
import { getActiveHookDefinitions, HOOK_REGISTRY, type HookProfile } from "../runtime/optional/framework/lib/hook-registry"
import { runMissionApply } from "../runtime/optional/framework/lib/shadow-root/execute-apply"
import { getShadowMissionStatus, startShadowMission, stopShadowMission } from "../runtime/optional/framework/lib/shadow-root/mission-control"
import {
  createManifest,
  loadManifest,
  saveManifest,
  recordArtifact,
  recordDirectory,
  computeFileHash,
  type FrameworkManifest,
  type ArtifactType,
} from "../runtime/optional/framework/lib/manifest"
import { addFrameworkIgnoreBlock, getIgnoreLines } from "../runtime/optional/framework/lib/gitignore"
import { analyzeForDetach, executeDetach, formatDetachPreview } from "../runtime/optional/framework/lib/detach"
import { getGlobalConfigPath, getModeConfig } from "../runtime/optional/framework/lib/framework-config"
import {
  createOptionalRuntimeCompatibilityEnv,
  createOptionalRuntimeToolkitEnv,
} from "agent-toolkit/runtime/lib/optional-runtime-environment.ts"
import { OPTIONAL_RUNTIME_PREFERRED_CLI } from "agent-toolkit/runtime/lib/optional-runtime-identity.ts"
import { formatOptionalRuntimeHelp } from "agent-toolkit/runtime/lib/optional-runtime-help.ts"
import { installOptionalRuntimeGlobal, uninstallOptionalRuntimeGlobal } from "agent-toolkit/runtime/optional/global-install.ts"
import {
  relinkConfiguredOptionalRuntimeProject,
  syncConfiguredOptionalRuntimeProject,
} from "agent-toolkit/runtime/optional/project/adapter-lifecycle.ts"
import {
  attachOptionalRuntimeProject,
  normalizeOptionalRuntimeProfile,
} from "agent-toolkit/runtime/optional/project/attach.ts"
import { migrateOptionalRuntimeProject } from "agent-toolkit/runtime/optional/project/migrate.ts"
import {
  resolveApplyMissionIdOrThrow,
  shadowStartRuntimeCommand,
  shadowStatusRuntimeCommand,
  shadowStopRuntimeCommand,
} from "agent-toolkit/runtime/optional/shadow/commands.ts"
import { renderOptionalRuntimeProjectStatus } from "agent-toolkit/runtime/optional/status.ts"
import {
  reportRuntimeCommand,
  toolsCatalogRuntimeCommand,
  toolsCleanupRuntimeCommand,
  toolsInspectRuntimeCommand,
  toolsInstallRuntimeCommand,
  toolsInstalledRuntimeCommand,
  toolsPruneRuntimeCommand,
} from "agent-toolkit/runtime/optional/tool-commands.ts"
import { CliCommandError, parseTools, type ToolSet } from "agent-toolkit/runtime/lib/optional-runtime-cli-core.ts"
import { isAdapterTarget, type AdapterTarget } from "../runtime/optional/framework/lib/tooling/adapter-targets"
import { getAdapterTargets } from "agent-toolkit/runtime/lib/toolkit-operations.ts"
import { installOpenCodeGlobal, uninstallOpenCodeGlobal } from "agent-toolkit/runtime/lib/opencode-global-install.ts"
import { listProviders, listModels, validateModelConfig, resolveForAgent, isValidAgentRole, isValidMode, AGENT_ROLES, type Mode } from "../runtime/optional/framework/lib/model-routing"

const TOOLKIT_DIR = resolve(dirname(import.meta.dirname!))
const OPTIONAL_FRAMEWORK_ROOT = join(TOOLKIT_DIR, "runtime", "optional", "framework")
const TOOLKIT_ENV = createOptionalRuntimeToolkitEnv(TOOLKIT_DIR)
const FRAMEWORK_ENV = createOptionalRuntimeCompatibilityEnv(TOOLKIT_DIR)

function formatForOpenCodeModel(providerId: string, providerModelName: string): string {
  const prefixMap: Record<string, string> = {
    github_copilot: "github-copilot",
    openai: "openai",
    anthropic: "anthropic",
    ollama: "ollama",
    lm_studio: "lm-studio",
  }
  const prefix = prefixMap[providerId] ?? providerId
  return `${prefix}/${providerModelName}`
}

function resolveOpenCodeModel(role: "builder" | "audit-planner", fallback: string): string {
  const { mode } = getModeConfig()
  const result = resolveForAgent(role, mode)
  if (!result.ok) return fallback
  return formatForOpenCodeModel(result.model.providerId, result.model.providerModelName)
}

function getOpenCodeModels(): { buildModel: string; planModel: string } {
  return {
    buildModel: resolveOpenCodeModel("builder", "github-copilot/claude-sonnet-4.6"),
    planModel: resolveOpenCodeModel("audit-planner", "github-copilot/claude-sonnet-4.6"),
  }
}

/** Run a shell command, compatible with both Bun and Node runtimes. */
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
  } catch (err: any) {
    return { code: err.status ?? 1, stdout: err.stdout ?? "", stderr: err.stderr ?? "" }
  }
}

// ── Helpers ──

function readJSON(path: string): Record<string, any> {
  if (!existsSync(path)) return {}
  return JSON.parse(readFileSync(path, "utf-8"))
}

function removeLegacyFrameworkShortcut(): boolean {
  const legacyShortcut = join(homedir(), ".local", "bin", "af")
  if (!existsSync(legacyShortcut)) return false
  try {
    const contents = readFileSync(legacyShortcut, "utf8")
    if (!contents.includes(TOOLKIT_DIR) && !contents.includes("agent-framework")) {
      return false
    }
    unlinkSync(legacyShortcut)
    return true
  } catch {
    return false
  }
}


// ── Commands ──

function installGlobal() {
  installOptionalRuntimeGlobal({
    toolkitEnv: TOOLKIT_ENV,
    compatibilityEnv: FRAMEWORK_ENV,
    execShell,
    runtimeRoot: TOOLKIT_DIR,
    removeLegacyShortcut: removeLegacyFrameworkShortcut,
  })
}

function attachProject(projectDir: string, profileInput: string, tools: ToolSet[] = ["all"]) {
  attachOptionalRuntimeProject<FrameworkManifest>({
    env: TOOLKIT_ENV,
    runtimeRoot: TOOLKIT_DIR,
    templateRoot: join(OPTIONAL_FRAMEWORK_ROOT, "templates"),
    projectDir,
    profileInput,
    tools,
    openCodeModels: getOpenCodeModels(),
    addIgnoreBlock: addFrameworkIgnoreBlock,
    manifestOps: {
      loadManifest,
      createManifest,
      saveManifest,
      recordArtifact,
      recordDirectory,
      computeFileHash,
    },
  })
}

function uninstallGlobal() {
  uninstallOptionalRuntimeGlobal({
    compatibilityEnv: FRAMEWORK_ENV,
    execShell,
    removeLegacyShortcut: removeLegacyFrameworkShortcut,
  })
}

function shadowStartCommand(missionId: string | undefined): void {
  shadowStartRuntimeCommand(missionId, startShadowMission)
  const activeMissionId = getShadowMissionStatus().missionId
  if (activeMissionId) {
    console.log(`  Staging root: ${join(process.cwd(), ".agent", "state", "staging", activeMissionId)}`)
  }
}

function shadowStopCommand(): void {
  shadowStopRuntimeCommand(stopShadowMission)
}

function shadowStatusCommand(missionIdOverride?: string): void {
  shadowStatusRuntimeCommand(missionIdOverride, getShadowMissionStatus)
}

function applyCommand(missionId: string | undefined, yesFlag: boolean): void {
  const mission = resolveApplyMissionIdOrThrow(missionId, OPTIONAL_RUNTIME_PREFERRED_CLI)

  const exitCode = runMissionApply(mission, yesFlag, {
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  })
  process.exit(exitCode)
}

function migrateProject(projectDir: string) {
  migrateOptionalRuntimeProject({
    projectDir,
    syncProject,
  })
}

function syncProject(projectDir: string, tools: ToolSet[] = ["all"]) {
  syncConfiguredOptionalRuntimeProject({
    env: TOOLKIT_ENV,
    projectDir,
    readJSON,
    tools,
    openCodeModels: getOpenCodeModels(),
  })
}

function relinkProject(projectDir: string) {
  relinkConfiguredOptionalRuntimeProject({
    env: TOOLKIT_ENV,
    projectDir,
    readJSON,
    globalConfigPath: getGlobalConfigPath(),
  })
}

function upgradeFramework() {
  console.log("Agent Toolkit Runtime — Upgrade")
  console.log("===============================\n")

  // 1. Pull latest if in a git repo
  console.log("1. Pulling latest...")
  const pullResult = execShell("git", ["-C", TOOLKIT_DIR, "pull", "--ff-only"], TOOLKIT_DIR)
  if (pullResult.code === 0) {
    const summary = pullResult.stdout.trim().split("\n").pop() ?? ""
    console.log(`   ✓ ${summary || "Already up to date."}`)
  } else {
    console.log("   ⚠ Git pull failed (not a git repo or no remote?). Continuing with local state.")
  }

  // 2. Re-run global install to refresh instruction paths + packs
  console.log("\n2. Refreshing global install...")
  installGlobal()

  console.log("\n✓ Upgrade complete. Run `agent-toolkit runtime sync .` in each project to update adapter surfaces.\n")
}

// ── Model Routing Commands ───────────────────────────────────────────────────

function listProvidersCommand() {
  console.log("Model Routing — Providers\n")
  const providers = listProviders()
  const maxName = Math.max(...providers.map((p) => p.name.length))
  console.log(
    `  ${"ID".padEnd(16)} ${"Name".padEnd(maxName)} ${"Type".padEnd(6)} ${"Transport".padEnd(18)} Enabled`,
  )
  console.log(`  ${"─".repeat(16)} ${"─".repeat(maxName)} ${"─".repeat(6)} ${"─".repeat(18)} ${"─".repeat(7)}`)
  for (const p of providers) {
    const status = p.enabled ? "✓" : "✗"
    console.log(
      `  ${p.id.padEnd(16)} ${p.name.padEnd(maxName)} ${p.type.padEnd(6)} ${p.transport.padEnd(18)} ${status}`,
    )
  }
  console.log()
}

function listModelsCommand() {
  console.log("Model Routing — Models\n")
  const models = listModels()
  console.log(
    `  ${"ID".padEnd(32)} ${"Provider".padEnd(16)} ${"Model Name".padEnd(22)} ${"Tier".padEnd(10)} Avail`,
  )
  console.log(
    `  ${"─".repeat(32)} ${"─".repeat(16)} ${"─".repeat(22)} ${"─".repeat(10)} ${"─".repeat(7)}`,
  )
  for (const m of models) {
    console.log(
      `  ${m.id.padEnd(32)} ${m.providerId.padEnd(16)} ${m.providerModelName.padEnd(22)} ${m.tier.padEnd(10)} ${m.availability}`,
    )
  }
  console.log()
}

function validateModelsCommand() {
  console.log("Model Routing — Validation\n")
  const result = validateModelConfig()

  if (result.valid && result.warnings.length === 0) {
    console.log("  ✓ All model routing configuration is valid.\n")
    return
  }

  if (result.errors.length > 0) {
    console.log(`  Errors (${result.errors.length}):`)
    for (const err of result.errors) {
      console.log(`    ✗ [${err.code}] ${err.message}`)
    }
  }
  if (result.warnings.length > 0) {
    console.log(`  Warnings (${result.warnings.length}):`)
    for (const warn of result.warnings) {
      console.log(`    ⚠ [${warn.code}] ${warn.message}`)
    }
  }
  console.log()

  if (!result.valid) {
    process.exit(1)
  }
}

function resolveModelCommand(agentRole: string | undefined, modeArg: string | undefined) {
  if (!agentRole) {
    console.error(`Usage: ${OPTIONAL_RUNTIME_PREFERRED_CLI} resolve-model <agent-role> [--mode online|offline|hybrid|autonomous|review|planning]`)
    console.error(`\nAvailable roles: ${AGENT_ROLES.join(", ")}`)
    process.exit(1)
  }

  if (!isValidAgentRole(agentRole)) {
    console.error(`Unknown agent role: "${agentRole}"`)
    console.error(`Available roles: ${AGENT_ROLES.join(", ")}`)
    process.exit(1)
  }

  const mode: Mode = modeArg && isValidMode(modeArg) ? modeArg : "online"

  console.log(`\nResolving model for agent "${agentRole}" in "${mode}" mode...\n`)

  const result = resolveForAgent(agentRole, mode)
  if (result.ok) {
    console.log(`  Model ID:       ${result.model.modelId}`)
    console.log(`  Provider:       ${result.model.providerId}`)
    console.log(`  Model Name:     ${result.model.providerModelName}`)
    console.log(`  Transport:      ${result.model.transport}`)
    if (result.model.baseUrl) {
      console.log(`  Base URL:       ${result.model.baseUrl}`)
    }
    console.log(`  Used Fallback:  ${result.usedFallback ? "yes" : "no"}`)
  } else {
    console.error(`  ✗ Resolution failed: ${result.message}`)
    process.exit(1)
  }
  console.log()
}

function toolsCatalogCommand(): void {
  toolsCatalogRuntimeCommand(TOOLKIT_ENV, { detailed: true })
}

function toolsInstalledCommand(projectDir: string): void {
  toolsInstalledRuntimeCommand(TOOLKIT_ENV, projectDir, { detailed: true })
}

function assertGlobalInspectableTarget(target: AdapterTarget): void {
  void target
}

function toolsInspectCommand(targetArg: string | undefined, dirArg: string | undefined, args: string[]): void {
  const target = requireInspectableTarget(targetArg)
  assertGlobalInspectableTarget(target)
  toolsInspectRuntimeCommand({
    env: TOOLKIT_ENV,
    cliCommand: OPTIONAL_RUNTIME_PREFERRED_CLI,
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
    cliCommand: OPTIONAL_RUNTIME_PREFERRED_CLI,
    targetArg,
    dirArg,
    args,
    detailed: true,
  })
}

function toolsInstallCommand(targetArg: string | undefined, dirArg: string | undefined, args: string[]): void {
  toolsInstallRuntimeCommand({
    env: TOOLKIT_ENV,
    cliCommand: OPTIONAL_RUNTIME_PREFERRED_CLI,
    targetArg,
    dirArg,
    args,
    source: "install",
    openCodeModels: targetArg === "opencode" ? getOpenCodeModels() : undefined,
    detailed: true,
  })
}

function toolsPruneCommand(projectDir: string, tools: ToolSet[], applyChanges: boolean): void {
  toolsPruneRuntimeCommand({
    env: TOOLKIT_ENV,
    projectDir,
    tools,
    applyChanges,
    detailed: true,
  })
}

function reportCommand(reportType: string | undefined, args: string[]): void {
  reportRuntimeCommand({ env: TOOLKIT_ENV, reportType, args, execShell, cwd: process.cwd() })
}

function requireInspectableTarget(targetArg: string | undefined): AdapterTarget {
  if (!targetArg || !isAdapterTarget(targetArg)) {
    throw new CliCommandError(`Usage: ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools <inspect|cleanup> <target> [dir]`)
  }
  return targetArg
}

// ── Main ──

const cmd = process.argv[2]

try {
switch (cmd) {
  case "install":
    installGlobal()
    break
  case "attach":
  case "init": {
    const dir = resolve(process.argv[3] || ".")
    const profile = process.argv[4] || "standard"
    const tools = parseTools(process.argv)
    attachProject(dir, profile, tools)
    break
  }
  case "detach": {
    const dir = resolve(process.argv[3] || ".")
    const dryRun = process.argv.includes("--dry-run")
    const keepDocs = process.argv.includes("--keep-docs")
    const exportToIdx = process.argv.indexOf("--export-to")
    const exportTo = exportToIdx >= 0 ? process.argv[exportToIdx + 1] : undefined

    const analysis = analyzeForDetach(dir)
    if (!analysis) {
      console.error("✗ No framework manifest found. Is this project attached?")
      console.error("  Expected: .agent/framework-manifest.json")
      process.exit(1)
      break
    }

    console.log(formatDetachPreview(analysis))

    if (dryRun) {
      console.log("(dry run — no changes made)")
      break
    }

    const result = executeDetach(dir, analysis, {
      keepDocs: keepDocs || !!exportTo,
      exportTo: exportTo ?? "docs",
    })
    console.log(`\n✓ Detached. Removed ${result.removedFiles} files, ${result.removedDirs} directories.`)
    if (result.exportedDocs > 0) {
      console.log(`  Exported ${result.exportedDocs} durable docs to ${exportTo ?? "docs"}/`)
    }
    break
  }
  case "uninstall":
    uninstallGlobal()
    break
  case "relink": {
    const dir = resolve(process.argv[3] || ".")
    relinkProject(dir)
    break
  }
  case "status":
  case "inspect": {
    for (const line of renderOptionalRuntimeProjectStatus({
      env: TOOLKIT_ENV,
      runtimeRoot: TOOLKIT_DIR,
      projectDir: process.cwd(),
      loadManifest,
      readJSON,
      hookRegistryLength: HOOK_REGISTRY.length,
      getActiveHooksCount: (profile, enabledByConfig) => {
        const normalizedProfile: HookProfile =
          profile === "minimal" || profile === "light" || profile === "standard" || profile === "full"
            ? (profile === "light" ? "minimal" : profile) as HookProfile
            : "standard"
        return getActiveHookDefinitions(normalizedProfile, enabledByConfig).length
      },
    })) {
      console.log(line)
    }
    process.exit(0)
  }
  case "tools": {
    const subcommand = process.argv[3] ?? "catalog"
    if (subcommand === "catalog" || subcommand === "list") {
      toolsCatalogCommand()
      break
    }
    if (subcommand === "install") {
      toolsInstallCommand(process.argv[4], process.argv[5], process.argv)
      break
    }
    if (subcommand === "installed" || subcommand === "status") {
      const dir = resolve(process.argv[4] || ".")
      toolsInstalledCommand(dir)
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
      const dir = resolve(process.argv[4] || ".")
      const tools = parseTools(process.argv)
      const applyChanges = process.argv.includes("--yes")
      toolsPruneCommand(dir, tools, applyChanges)
      break
    }
    console.error(`Usage: ${OPTIONAL_RUNTIME_PREFERRED_CLI} tools <catalog|install|installed|inspect|cleanup|prune> ...`)
    process.exit(1)
    break
  }
  case "report": {
    reportCommand(process.argv[3], process.argv.slice(4))
    break
  }
  case "shadow-start": {
    shadowStartCommand(process.argv[3])
    break
  }
  case "shadow-stop": {
    shadowStopCommand()
    break
  }
  case "shadow-status": {
    shadowStatusCommand(process.argv[3])
    break
  }
  case "apply": {
    const missionId = process.argv[3]
    const yesFlag = process.argv.includes("--yes")
    applyCommand(missionId, yesFlag)
    break
  }
  case "sync": {
    const dir = resolve(process.argv[3] || ".")
    const tools = parseTools(process.argv)
    syncProject(dir, tools)
    break
  }
  case "migrate": {
    const dir = resolve(process.argv[3] || ".")
    migrateProject(dir)
    break
  }
  case "upgrade":
    upgradeFramework()
    break
  case "list-providers":
    listProvidersCommand()
    break
  case "list-models":
    listModelsCommand()
    break
  case "validate-models":
    validateModelsCommand()
    break
  case "resolve-model": {
    const agentRole = process.argv[3]
    const modeIdx = process.argv.indexOf("--mode")
    const modeArg = modeIdx >= 0 ? process.argv[modeIdx + 1] : undefined
    resolveModelCommand(agentRole, modeArg)
    break
  }
  default:
    console.log(formatOptionalRuntimeHelp())
}
} catch (error) {
  if (error instanceof CliCommandError) {
    console.error(error.message)
    process.exit(error.exitCode)
  }
  throw error
}
