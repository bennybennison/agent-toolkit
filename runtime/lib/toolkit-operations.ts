import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { homedir, platform } from "node:os"
import { basename, dirname, extname, join, relative, resolve } from "node:path"
import { generateCopilotSurface } from "../../adapters/copilot/generate"
import { generateCodexSurface } from "../../adapters/codex/generate"
import { generateOpenCodeSurface } from "../../adapters/opencode/generate"
import { generateVSCodeSurface } from "../../adapters/vscode/generate"
import { collectPackInstructionPathsWithOptions, formatPackSummary, resolvePacks, type ResolvedPack } from "./pack-resolver"
import { type ToolkitEnvironment } from "./toolkit-environment"
import { getToolkitTemplateTokens, renderToolkitTemplate } from "./template-render"
import { ADAPTER_TARGETS, getAdapterTargets, type AdapterTarget } from "./tooling/adapter-targets"
import { listToolCatalog, type ToolCatalogEntry } from "./tooling/catalog"
import {
  getProjectInstalledTargets,
  loadGlobalInstallRegistry,
  loadProjectInstallRegistry,
  recordInstalledTarget,
  saveGlobalInstallRegistry,
  saveProjectInstallRegistry,
  type InstalledTargetRecord,
} from "./tooling/install-registry"
import { collectGeneratedFileHashes } from "./tooling/file-state"
import {
  applyGlobalToolCleanup,
  inspectGlobalToolSurface,
  planGlobalToolCleanup,
  type GlobalCleanupMode,
  type GlobalToolCleanupPlan,
  type GlobalToolCleanupResult,
  type GlobalToolInventory,
} from "./tooling/global-surface"
import { applyProjectTargetPrune, planProjectTargetPrune } from "./tooling/prune"
import { loadToolManifestsFromResolvedPacks } from "./tooling/tool-manifests"

export interface ToolkitTargetResult {
  filesWritten: number
  generatedPaths: string[]
  generatedFileHashes: Record<string, string>
}

export interface ToolkitOpenCodeModelSelection {
  buildModel?: string
  planModel?: string
}

export interface ToolkitInstalledTargets {
  globalInstalls: InstalledTargetRecord[]
  projectInstalls: InstalledTargetRecord[]
}

export interface ToolkitContentInventory {
  skills: string[]
  agents: string[]
  commands: string[]
}

export interface ToolkitSharedSkillResult {
  filesWritten: number
  generatedPaths: string[]
}

export type {
  GlobalCleanupMode,
  GlobalToolCleanupPlan,
  GlobalToolCleanupResult,
  GlobalToolInventory,
}

export function resolveToolkitPacks(
  env: ToolkitEnvironment,
  projectDir: string,
  profile: string,
  explicitPacks?: string[],
): ResolvedPack[] {
  return resolvePacks({
    packsDir: env.packsDir,
    projectDir,
    profile,
    explicitPacks,
  })
}

export function formatToolkitPackSummary(packs: ResolvedPack[]): string {
  return formatPackSummary(packs)
}

export function getDefaultToolkitGlobalRoot(env: ToolkitEnvironment, target: AdapterTarget): string {
  if (target === "codex") return homedir()
  if (target === "opencode") return env.opencodeConfigDir
  if (target === "copilot") return join(homedir(), ".config", env.globalRegistryDirName, "copilot")
  if (target === "vscode") {
    if (platform() === "darwin") {
      return join(homedir(), "Library", "Application Support", "Code", "User")
    }
    if (platform() === "win32") {
      return join(homedir(), "AppData", "Roaming", "Code", "User")
    }
    return join(homedir(), ".config", "Code", "User")
  }
  return homedir()
}

const OPEN_CODE_PROJECT_COMMAND_PACK_IDS = new Set([
  "commands-session",
  "commands-discovery",
  "commands-product",
])

const OPEN_CODE_LOCAL_INSTRUCTION_PREFIXES = [
  ".agent-toolkit/state/opencode-instructions/",
  ".agent-toolkit/rules/",
  ".agent/state/opencode-instructions/",
  ".agent/rules/",
]

const OPEN_CODE_PROJECT_RULE_FILES = new Set([
  "documentation.md",
  "execution-discipline.md",
  "file-size-caps.md",
  "modular-code.md",
  "security.md",
])

type SharedSkillDocument = {
  name: string
  content: string
}

const AUTHORED_SHARED_SKILLS_DIR = ["skills"] as const
const SHARED_STARTER_SKILLS_DIR = ["adapters", "codex", "templates", "skills"] as const

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n*/, "").trim()
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}

  const values: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/)
    if (!pair) continue
    values[pair[1].trim()] = pair[2].trim()
  }
  return values
}

function humanizeSkillName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function normalizeSharedSkillBody(body: string): string {
  return body
    .replace(/\]\((?:\.\/)?([a-z0-9-]+)\.md\)/gi, "](../$1/SKILL.md)")
    .replace(/\]\((?:\.\/)?skills\/([a-z0-9-]+)\.md\)/gi, "](../$1/SKILL.md)")
}

function deriveSharedSkillDescription(body: string, fallbackName: string): string {
  const lines = body.split("\n")
  let inCodeBlock = false
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (!line || inCodeBlock || line.startsWith("#")) continue
    if (line.startsWith("- ") || line.startsWith("* ") || /^[0-9]+\./.test(line)) continue
    return line.replace(/\s+/g, " ").trim()
  }
  return `Reusable ${humanizeSkillName(fallbackName)} workflow skill.`
}

function buildSharedSkillDocument(raw: string, fallbackName: string): SharedSkillDocument {
  const frontmatter = parseFrontmatter(raw)
  const name = normalizeFrontmatterScalar(frontmatter.name || frontmatter.skill) || fallbackName
  const body = normalizeSharedSkillBody(stripFrontmatter(raw))
  const description = deriveSharedSkillDescription(body, name)
  return {
    name,
    content: [
      "---",
      `name: ${JSON.stringify(name)}`,
      `description: ${JSON.stringify(description)}`,
      "---",
      "",
      body,
      "",
    ].join("\n"),
  }
}

function normalizeFrontmatterScalar(value?: string): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.replace(/^['"]|['"]$/g, "")
}

function isTruthyFrontmatterValue(value?: string): boolean {
  const normalized = normalizeFrontmatterScalar(value)?.toLowerCase()
  return normalized === "true" || normalized === "yes" || normalized === "1"
}

function collectAuthoredSkillDocs(env: ToolkitEnvironment, activePacks: ResolvedPack[]): SharedSkillDocument[] {
  const skillsRoot = join(env.toolkitRoot, ...AUTHORED_SHARED_SKILLS_DIR)
  if (!existsSync(skillsRoot)) return []

  const activePackIds = new Set(activePacks.map((pack) => pack.id))
  const docs: SharedSkillDocument[] = []

  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const skillPath = join(skillsRoot, entry.name, "SKILL.md")
    if (!existsSync(skillPath)) continue

    const raw = renderToolkitTemplate(readFileSync(skillPath, "utf8"), env)
    const frontmatter = parseFrontmatter(raw)
    const packId = normalizeFrontmatterScalar(frontmatter.pack)
    const starter = isTruthyFrontmatterValue(frontmatter.starter)

    if (!starter && (!packId || !activePackIds.has(packId))) continue
    docs.push(buildSharedSkillDocument(raw, entry.name))
  }

  return docs
}

function collectPackSkillDocs(env: ToolkitEnvironment, activePacks: ResolvedPack[]): SharedSkillDocument[] {
  const docs: SharedSkillDocument[] = []
  for (const pack of activePacks) {
    if (pack.manifest.category !== "skills") continue
    for (const entry of readdirSync(pack.dir, { withFileTypes: true })) {
      if (!entry.isFile() || extname(entry.name) !== ".md" || entry.name === "pack.json") continue
      const sourcePath = join(pack.dir, entry.name)
      const raw = renderToolkitTemplate(readFileSync(sourcePath, "utf8"), env)
      docs.push(buildSharedSkillDocument(raw, basename(entry.name, ".md")))
    }
  }
  return docs
}

function collectStarterSkillDocs(env: ToolkitEnvironment): SharedSkillDocument[] {
  const starterRoot = join(env.toolkitRoot, ...SHARED_STARTER_SKILLS_DIR)
  if (!existsSync(starterRoot)) return []

  const docs: SharedSkillDocument[] = []
  for (const entry of readdirSync(starterRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const skillPath = join(starterRoot, entry.name, "SKILL.md")
    if (!existsSync(skillPath)) continue
    const raw = readFileSync(skillPath, "utf8")
      .replaceAll("__DISPLAY_NAME__", env.toolkitDisplayName)
      .replaceAll("__PLUGIN_NAME__", env.toolkitPluginName)
    docs.push(buildSharedSkillDocument(raw, entry.name))
  }
  return docs
}

export function syncToolkitSharedSkills(options: {
  env: ToolkitEnvironment
  scope: "project" | "global"
  rootDir: string
  activePacks: ResolvedPack[]
}): ToolkitSharedSkillResult {
  const { env, scope, rootDir, activePacks } = options
  const skillsRoot = scope === "global"
    ? join(homedir(), ".agents", "skills")
    : join(rootDir, ".agents", "skills")

  mkdirSync(skillsRoot, { recursive: true })

  const generatedPaths: string[] = []
  let filesWritten = 0
  const authoredDocs = collectAuthoredSkillDocs(env, activePacks)
  const authoredNames = new Set(authoredDocs.map((skill) => skill.name))
  const packFallbackDocs = collectPackSkillDocs(env, activePacks).filter((skill) => !authoredNames.has(skill.name))
  const starterFallbackDocs = collectStarterSkillDocs(env).filter((skill) => !authoredNames.has(skill.name))
  const skillDocs = [...authoredDocs, ...packFallbackDocs, ...starterFallbackDocs]
  const seen = new Set<string>()

  for (const skill of skillDocs) {
    if (seen.has(skill.name)) continue
    seen.add(skill.name)

    const outputPath = join(skillsRoot, skill.name, "SKILL.md")
    if (existsSync(outputPath)) continue

    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, skill.content, "utf8")
    filesWritten++
    generatedPaths.push(scope === "global" ? relative(homedir(), outputPath) : relative(rootDir, outputPath))
  }

  return { filesWritten, generatedPaths }
}

function selectOpenCodeProjectPacks(activePacks: ResolvedPack[]): ResolvedPack[] {
  return activePacks.filter((pack) => (
    pack.id === "agents-visible"
    || pack.manifest.category === "rules"
    || OPEN_CODE_PROJECT_COMMAND_PACK_IDS.has(pack.id)
  ))
}

function renderOpenCodeProjectInstructionAssets(
  env: ToolkitEnvironment,
  projectDir: string,
  activePacks: ResolvedPack[],
): string[] {
  const renderedRoot = join(projectDir, env.hostConventions.projectStateDir, "opencode-instructions")
  const projectPacks = selectOpenCodeProjectPacks(activePacks)
  const instructionSources = [
    ...env.coreInstructionPaths,
    ...collectPackInstructionPathsWithOptions(projectPacks, { agentExposure: "visible-only" }),
  ].filter((sourcePath) => {
    if (!sourcePath.includes("/packs/rules-common/")) return true
    return OPEN_CODE_PROJECT_RULE_FILES.has(basename(sourcePath))
  })
  const generatedPaths: string[] = []

  rmSync(renderedRoot, { recursive: true, force: true })

  for (const sourcePath of instructionSources) {
    let relPath = relative(env.toolkitRoot, sourcePath)
    if (!relPath || relPath.startsWith("..")) {
      relPath = sourcePath.split("/").pop() ?? "instruction.md"
    }

    const outputPath = join(renderedRoot, relPath)
    mkdirSync(dirname(outputPath), { recursive: true })
    const rendered = renderToolkitTemplate(readFileSync(sourcePath, "utf8"), env)
    writeFileSync(outputPath, rendered, "utf8")
    generatedPaths.push(relative(projectDir, outputPath))
  }

  return generatedPaths
}

function getManagedOpenCodeInstructionPrefixes(env: ToolkitEnvironment): string[] {
  const prefixes = new Set(OPEN_CODE_LOCAL_INSTRUCTION_PREFIXES)
  prefixes.add(`${env.hostConventions.projectStateDir}/opencode-instructions/`)
  prefixes.add(`${env.hostConventions.projectRulesDir}/`)
  return [...prefixes]
}

export function applyToolkitTarget(options: {
  env: ToolkitEnvironment
  target: AdapterTarget
  scope: "project" | "global"
  rootDir: string
  activePacks: ResolvedPack[]
  source: "attach" | "sync" | "install"
  openCodeModels?: ToolkitOpenCodeModelSelection
}): ToolkitTargetResult {
  const { env, target, scope, rootDir, activePacks, source, openCodeModels } = options
  let filesWritten = 0
  let generatedPaths: string[] = []

  if (target === "codex") {
    const codexResult = generateCodexSurface({
      rootDir,
      pluginName: env.toolkitPluginName,
      displayName: env.toolkitDisplayName,
      packageVersion: env.toolkitVersion,
      authorName: env.toolkitAuthorName,
      marketplaceName: env.toolkitPluginName,
      marketplaceDisplayName: scope === "global" ? `${env.toolkitDisplayName} Global` : `${env.toolkitDisplayName} Local`,
      activePacks,
    })
    filesWritten = codexResult.filesWritten
    generatedPaths = codexResult.paths
  } else if (target === "vscode") {
    const vscodeResult = generateVSCodeSurface(rootDir, {
      mode: scope === "global" ? "global" : "project",
      toolManifests: loadToolManifestsFromResolvedPacks(activePacks),
      templateTokens: getToolkitTemplateTokens(env),
    })
    filesWritten = vscodeResult.filesWritten
    generatedPaths = vscodeResult.paths
  } else if (target === "copilot") {
    const copilotResult = generateCopilotSurface(rootDir, {
      templateTokens: getToolkitTemplateTokens(env),
      mode: scope === "global" ? "global" : "project",
    })
    filesWritten = copilotResult.filesWritten
    generatedPaths = copilotResult.paths
  } else if (target === "opencode") {
    if (scope === "global") {
      throw new Error("Use the OpenCode global install flow for global setup")
    }
    const renderedInstructionPaths = renderOpenCodeProjectInstructionAssets(env, rootDir, activePacks)
    mkdirSync(join(rootDir, env.hostConventions.projectRulesDir), { recursive: true })
    const opencodeResult = generateOpenCodeSurface(rootDir, {
      buildModel: openCodeModels?.buildModel,
      planModel: openCodeModels?.planModel,
      instructions: [env.hostConventions.projectRulesGlob, ...renderedInstructionPaths],
      legacyInstructionPrefixes: [".opencode/"],
      managedInstructionPrefixes: getManagedOpenCodeInstructionPrefixes(env),
    })
    filesWritten = 1 + renderedInstructionPaths.length
    generatedPaths = [opencodeResult.path, ...renderedInstructionPaths]
  }
  const generatedFileHashes = collectGeneratedFileHashes(rootDir, generatedPaths)

  if (scope === "global") {
    const registry = loadGlobalInstallRegistry(join(homedir(), ".config", env.globalRegistryDirName))
    recordInstalledTarget(registry, {
      target,
      scope,
      rootDir,
      source: "install",
      generatedPaths,
      generatedFileHashes,
      activePackIds: activePacks.map((pack) => pack.id),
    })
    saveGlobalInstallRegistry(registry, join(homedir(), ".config", env.globalRegistryDirName))
  } else {
    const registry = loadProjectInstallRegistry(rootDir, env.hostConventions)
    recordInstalledTarget(registry, {
      target,
      scope,
      rootDir,
      source,
      generatedPaths,
      generatedFileHashes,
      activePackIds: activePacks.map((pack) => pack.id),
    })
    saveProjectInstallRegistry(rootDir, env.hostConventions, registry)
  }

  return { filesWritten, generatedPaths, generatedFileHashes }
}

export function getToolkitContentInventory(env: ToolkitEnvironment): ToolkitContentInventory {
  const listMarkdown = (dir: string, exclude: string[] = []): string[] =>
    existsSync(dir)
      ? readdirSync(dir).filter((file) => file.endsWith(".md") && !exclude.includes(file))
      : []

  return {
    skills: listMarkdown(join(env.toolkitContentDir, "skills"), ["MANIFEST.md"]),
    agents: listMarkdown(join(env.toolkitContentDir, "agents")),
    commands: listMarkdown(join(env.toolkitContentDir, "commands"), ["README.md"]),
  }
}

export function getToolkitCatalog(env: ToolkitEnvironment): ToolCatalogEntry[] {
  return listToolCatalog(env.packsDir)
}

export function getToolkitInstalledTargets(env: ToolkitEnvironment, projectDir: string): ToolkitInstalledTargets {
  return {
    globalInstalls: loadGlobalInstallRegistry(join(homedir(), ".config", env.globalRegistryDirName)).installs,
    projectInstalls: getProjectInstalledTargets(projectDir, env.hostConventions),
  }
}

export function resolveToolkitInstallRequest(options: {
  env: ToolkitEnvironment
  target: AdapterTarget
  scope: "project" | "global"
  dirArg?: string
  profile: string
  explicitPacks?: string[]
}): { rootDir: string; activePacks: ResolvedPack[] } {
  const { env, target, scope, dirArg, profile, explicitPacks } = options
  const rootDir = dirArg ? resolve(dirArg) : (scope === "global" ? getDefaultToolkitGlobalRoot(env, target) : resolve("."))
  const activePacks = resolveToolkitPacks(env, rootDir, profile, explicitPacks)
  return { rootDir, activePacks }
}

export {
  ADAPTER_TARGETS,
  getAdapterTargets,
}

export function planToolkitTargetPrune(
  env: ToolkitEnvironment,
  projectDir: string,
  desiredTargets: AdapterTarget[],
): ReturnType<typeof planProjectTargetPrune> {
  return planProjectTargetPrune(projectDir, desiredTargets, env.hostConventions)
}

export function applyToolkitTargetPrune(
  env: ToolkitEnvironment,
  projectDir: string,
  plan: ReturnType<typeof planProjectTargetPrune>,
): ReturnType<typeof applyProjectTargetPrune> {
  return applyProjectTargetPrune(projectDir, plan, env.hostConventions)
}

export function inspectToolkitGlobalTarget(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  rootDir?: string,
): GlobalToolInventory {
  return inspectGlobalToolSurface(env, target, rootDir)
}

export function planToolkitGlobalTargetCleanup(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  mode: GlobalCleanupMode,
  selectedKeys: string[] = [],
  rootDir?: string,
): GlobalToolCleanupPlan {
  return planGlobalToolCleanup(env, target, mode, selectedKeys, rootDir)
}

export function applyToolkitGlobalTargetCleanup(
  env: ToolkitEnvironment,
  target: AdapterTarget,
  plan: GlobalToolCleanupPlan,
): GlobalToolCleanupResult {
  return applyGlobalToolCleanup(env, target, plan)
}
