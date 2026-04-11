import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { homedir } from "node:os"
import { fileURLToPath } from "node:url"

export interface ToolkitHostConventions {
  cliCommand: string
  projectConfigPath: string
  projectStateDir: string
  projectPlansDir: string
  projectRulesDir: string
  projectRulesGlob: string
  projectContextDir: string
  sessionStatePath: string
  checkpointsLogPath: string
  sessionsDir: string
  memoryDir: string
  auditsDir: string
  specsDir: string
  blueprintsDir: string
  backlogPath: string
  projectBriefPath: string
  portfolioPath: string
  gotchasPath: string
  constitutionPath: string
  frictionLogPath: string
  beadsReportPath: string
  ledgerDbPath: string
  stagingDir: string
}

export interface ToolkitEnvironment {
  workspaceRoot: string
  toolkitRoot: string
  toolkitContentDir: string
  packsDir: string
  toolkitScriptsDir: string
  opencodeConfigDir: string
  opencodeJsonPath: string
  packageName: string
  toolkitPluginName: string
  toolkitVersion: string
  toolkitDisplayName: string
  toolkitAuthorName: string
  globalRegistryDirName: string
  cliEntrypointPath: string
  coreInstructionPaths: string[]
  hostConventions: ToolkitHostConventions
}

export interface ToolkitEnvironmentOptions {
  toolkitRoot?: string
  packageName?: string
  toolkitPluginName?: string
  toolkitVersion?: string
  toolkitDisplayName?: string
  toolkitAuthorName?: string
  globalRegistryDirName?: string
  cliEntrypointPath?: string
  coreInstructionPaths?: string[]
  hostConventions?: Partial<ToolkitHostConventions>
}

function readJSON(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>
}

const MODULE_TOOLKIT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..")

function resolveToolkitRoot(workspaceRoot: string, override?: string): string {
  if (override) return override

  const workspacePackageJsonPath = join(workspaceRoot, "package.json")
  if (existsSync(workspacePackageJsonPath)) {
    try {
      const workspacePackage = readJSON(workspacePackageJsonPath)
      if (workspacePackage.name === "agent-toolkit") {
        return workspaceRoot
      }
    } catch {
      // Ignore invalid package.json and fall through to the next candidate.
    }
  }

  const nestedToolkitRoot = join(workspaceRoot, "agent-toolkit")
  if (existsSync(nestedToolkitRoot)) {
    return nestedToolkitRoot
  }

  const legacyNestedToolkitRoot = join(workspaceRoot, "agent-toolkit")
  if (existsSync(legacyNestedToolkitRoot)) {
    return legacyNestedToolkitRoot
  }

  return MODULE_TOOLKIT_ROOT
}

function buildDefaultHostConventions(): ToolkitHostConventions {
  return {
    cliCommand: "agent-toolkit",
    projectConfigPath: ".agent-toolkit/config.json",
    projectStateDir: ".agent-toolkit/state",
    projectPlansDir: ".agent-toolkit/plans",
    projectRulesDir: ".agent-toolkit/rules",
    projectRulesGlob: ".agent-toolkit/rules/*.md",
    projectContextDir: ".agent-toolkit-context",
    sessionStatePath: ".agent-toolkit/state/session-state.json",
    checkpointsLogPath: ".agent-toolkit/state/checkpoints.log",
    sessionsDir: ".agent-toolkit/state/sessions",
    memoryDir: ".agent-toolkit/state/memory",
    auditsDir: ".agent-toolkit/plans/audits",
    specsDir: ".agent-toolkit/plans/specs",
    blueprintsDir: ".agent-toolkit/plans/blueprints",
    backlogPath: ".agent-toolkit/plans/backlog.md",
    projectBriefPath: ".agent-toolkit/plans/project-brief.md",
    portfolioPath: ".agent-toolkit/plans/portfolio.md",
    gotchasPath: ".agent-toolkit/plans/GOTCHAS.md",
    constitutionPath: ".agent-toolkit/plans/CONSTITUTION.md",
    frictionLogPath: ".agent-toolkit/plans/FRICTION_LOG.md",
    beadsReportPath: ".agent-toolkit/plans/beads-report.md",
    ledgerDbPath: ".agent-toolkit-context/ledger.db",
    stagingDir: ".agent-toolkit-context/staging",
  }
}

export function createToolkitEnvironment(workspaceRoot: string, options?: ToolkitEnvironmentOptions): ToolkitEnvironment {
  const toolkitRoot = resolveToolkitRoot(workspaceRoot, options?.toolkitRoot)
  let packageMeta: Record<string, unknown> = {}
  try {
    packageMeta = readJSON(join(toolkitRoot, "package.json"))
  } catch {
    packageMeta = {}
  }

  const packageName = options?.packageName
    ?? (typeof packageMeta.name === "string" ? packageMeta.name : "agent-toolkit")
  const toolkitPluginName = options?.toolkitPluginName ?? packageName
  const toolkitVersion = options?.toolkitVersion
    ?? (typeof packageMeta.version === "string" ? packageMeta.version : "0.1.0")
  const toolkitDisplayName = options?.toolkitDisplayName ?? toolkitPluginName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
  const opencodeConfigDir = join(homedir(), ".config", "opencode")

  return {
    workspaceRoot,
    toolkitRoot,
    toolkitContentDir: join(toolkitRoot, "content"),
    packsDir: join(toolkitRoot, "packs"),
    toolkitScriptsDir: join(toolkitRoot, "scripts"),
    opencodeConfigDir,
    opencodeJsonPath: join(opencodeConfigDir, "opencode.json"),
    packageName,
    toolkitPluginName,
    toolkitVersion,
    toolkitDisplayName,
    toolkitAuthorName: options?.toolkitAuthorName ?? "Atlas",
    globalRegistryDirName: options?.globalRegistryDirName ?? packageName,
    cliEntrypointPath: options?.cliEntrypointPath ?? join(toolkitRoot, "bin", "cli.ts"),
    coreInstructionPaths: options?.coreInstructionPaths ?? [],
    hostConventions: {
      ...buildDefaultHostConventions(),
      ...options?.hostConventions,
    },
  }
}
