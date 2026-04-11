import { existsSync } from "node:fs"
import { join } from "node:path"
import type { ToolkitEnvironment } from "../../lib/toolkit-environment"
import {
  applyToolkitTarget,
  resolveToolkitPacks,
  syncToolkitSharedSkills,
  type ResolvedToolkitPack,
} from "../../lib/toolkit-operations"
import { CliCommandError, shouldGenerate, type ToolSet } from "../../lib/optional-runtime-cli-core"

export interface RuntimeOpenCodeModels {
  buildModel: string
  planModel: string
}

type RuntimeProjectConfigReader = (path: string) => Record<string, any>

interface RuntimeProjectLifecycleOptions {
  env: ToolkitEnvironment
  projectDir: string
  activePacks: ResolvedToolkitPack[]
  log?: (line: string) => void
}

function resolveConfiguredProjectPacks(
  env: ToolkitEnvironment,
  projectDir: string,
  readJSON: RuntimeProjectConfigReader,
): ResolvedToolkitPack[] {
  const config = readJSON(join(projectDir, ".agent", "config.json"))
  const profile = normalizeOptionalRuntimeProfile(String(config.profile ?? "standard"))
  return resolveToolkitPacks(env, projectDir, profile)
}

export function syncConfiguredOptionalRuntimeProject(
  options: {
    env: ToolkitEnvironment
    projectDir: string
    readJSON: RuntimeProjectConfigReader
    tools?: ToolSet[]
    openCodeModels: RuntimeOpenCodeModels
    log?: (line: string) => void
  },
): void {
  syncOptionalRuntimeProject({
    env: options.env,
    projectDir: options.projectDir,
    activePacks: resolveConfiguredProjectPacks(options.env, options.projectDir, options.readJSON),
    tools: options.tools,
    openCodeModels: options.openCodeModels,
    log: options.log,
  })
}

export function relinkConfiguredOptionalRuntimeProject(
  options: {
    env: ToolkitEnvironment
    projectDir: string
    readJSON: RuntimeProjectConfigReader
    globalConfigPath: string
    log?: (line: string) => void
  },
): void {
  relinkOptionalRuntimeProject({
    env: options.env,
    projectDir: options.projectDir,
    activePacks: resolveConfiguredProjectPacks(options.env, options.projectDir, options.readJSON),
    globalConfigPath: options.globalConfigPath,
    log: options.log,
  })
}

export function syncOptionalRuntimeProject(
  options: RuntimeProjectLifecycleOptions & {
    tools?: ToolSet[]
    openCodeModels: RuntimeOpenCodeModels
  },
): void {
  const log = options.log ?? console.log
  const tools = options.tools ?? ["all"]
  const projectConfigPath = join(options.projectDir, options.env.hostConventions.projectConfigPath)

  if (!existsSync(projectConfigPath)) {
    throw new CliCommandError(`No ${options.env.hostConventions.projectConfigPath} found. Is this project attached?`)
  }

  log("Agent Toolkit Runtime — Sync")
  log("============================")
  log(`Project:  ${options.projectDir}`)
  log(`Tools:    ${tools.join(", ")}`)
  log("")

  const sharedSkills = syncToolkitSharedSkills({
    env: options.env,
    scope: "project",
    rootDir: options.projectDir,
    activePacks: options.activePacks,
  })
  if (sharedSkills.filesWritten > 0) {
    log(`Shared skills: ${sharedSkills.filesWritten} seeded in .agents/skills/`)
  }

  if (shouldGenerate(tools, "opencode")) {
    log("1. OpenCode adapter...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "opencode",
      scope: "project",
      rootDir: options.projectDir,
      activePacks: options.activePacks,
      source: "sync",
      openCodeModels: options.openCodeModels,
    })
    log(`   ✓ ${result.filesWritten} file written`)
  }

  if (shouldGenerate(tools, "copilot")) {
    log("")
    log("2. Copilot adapter (.github/)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "copilot",
      scope: "project",
      rootDir: options.projectDir,
      activePacks: options.activePacks,
      source: "sync",
    })
    log(`   ✓ ${result.filesWritten} files written`)
  }

  if (shouldGenerate(tools, "vscode")) {
    log("")
    log("3. VS Code settings (.vscode/)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "vscode",
      scope: "project",
      rootDir: options.projectDir,
      activePacks: options.activePacks,
      source: "sync",
    })
    log(`   ✓ ${result.filesWritten} files written`)
  }

  if (shouldGenerate(tools, "codex")) {
    log("")
    log("4. Codex adapter (plugins/ + marketplace)...")
    const result = applyToolkitTarget({
      env: options.env,
      target: "codex",
      scope: "project",
      rootDir: options.projectDir,
      activePacks: options.activePacks,
      source: "sync",
    })
    log(`   ✓ ${result.filesWritten} files written`)
  }

  log("")
  log("✓ Sync complete.")
  log("")
}

export function relinkOptionalRuntimeProject(
  options: RuntimeProjectLifecycleOptions & {
    globalConfigPath: string
  },
): void {
  const log = options.log ?? console.log
  const projectConfigPath = join(options.projectDir, options.env.hostConventions.projectConfigPath)

  if (!existsSync(projectConfigPath)) {
    throw new CliCommandError(`No ${options.env.hostConventions.projectConfigPath} found. Is this project attached?`)
  }

  log("Agent Toolkit Runtime — Relink")
  log("==============================")
  log(`Project:  ${options.projectDir}`)
  log("")

  if (existsSync(options.globalConfigPath)) {
    log("1. Global install verified ✓")
  } else {
    log(`1. ⚠ Global config not found — run \`${options.env.hostConventions.cliCommand} install\` first`)
  }

  const copilotResult = applyToolkitTarget({
    env: options.env,
    target: "copilot",
    scope: "project",
    rootDir: options.projectDir,
    activePacks: options.activePacks,
    source: "sync",
  })
  log("")
  log(`2. Copilot adapter: ${copilotResult.filesWritten} files refreshed`)

  const vscodeResult = applyToolkitTarget({
    env: options.env,
    target: "vscode",
    scope: "project",
    rootDir: options.projectDir,
    activePacks: options.activePacks,
    source: "sync",
  })
  log("")
  log(`3. VS Code settings refreshed (${vscodeResult.filesWritten} files)`)

  const codexResult = applyToolkitTarget({
    env: options.env,
    target: "codex",
    scope: "project",
    rootDir: options.projectDir,
    activePacks: options.activePacks,
    source: "sync",
  })
  log("")
  log(`4. Codex plugin refreshed (${codexResult.filesWritten} files)`)
  log("")
  log("✓ Relink complete.")
  log("")
}
