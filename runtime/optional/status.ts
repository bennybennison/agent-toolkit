import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { ToolkitEnvironment } from "../lib/toolkit-environment"
import { getToolkitContentInventory, resolveToolkitPacks, formatToolkitPackSummary } from "../lib/toolkit-operations"
import { formatOptionalRuntimeStatus } from "../lib/optional-runtime-status"
import { listToolkitCommands } from "../lib/tooling/command-catalog"

interface ManifestLike {
  attachedAt: string
  artifacts: Array<{ type: string }>
  directories: Array<unknown>
}

export function renderOptionalRuntimeProjectStatus(options: {
  env: ToolkitEnvironment
  runtimeRoot: string
  projectDir: string
  loadManifest: (projectDir: string) => ManifestLike | null
  readJSON: (path: string) => Record<string, any>
  hookRegistryLength: number
  getActiveHooksCount: (profile: string, enabledByConfig: (moduleId: string, defaultValue?: boolean) => boolean) => number
}): string[] {
  const toolkitInventory = getToolkitContentInventory(options.env)
  const hookDirCandidates = [
    join(options.runtimeRoot, "runtime", "hooks"),
    join(options.runtimeRoot, "runtime", "optional", "framework", "hooks"),
  ]
  const hookDir = hookDirCandidates.find((candidate) => existsSync(candidate))
  const hooks = hookDir
    ? readdirSync(hookDir).filter((f: string) => f.endsWith(".ts"))
    : []

  const projectConfigPath = join(options.projectDir, ".agent", "config.json")
  const frameworkConfigPath = join(options.runtimeRoot, ".agent", "config.json")
  const legacyConfigPath = join(options.projectDir, ".opencode", "framework.json")
  const configPath = existsSync(projectConfigPath)
    ? projectConfigPath
    : existsSync(frameworkConfigPath)
      ? frameworkConfigPath
      : legacyConfigPath
  const config = existsSync(configPath) ? options.readJSON(configPath) : {}
  const profile = String(config.profile ?? "standard")
  const compaction = String(config.compaction_strategy ?? "normal")

  const moduleFlags = (config.modularity?.module_flags ?? {}) as Record<string, unknown>
  const enabledByConfig = (moduleId: string, defaultValue = true): boolean => {
    const val = moduleFlags[moduleId]
    return typeof val === "boolean" ? val : defaultValue
  }

  const activeHooks = options.getActiveHooksCount(profile, enabledByConfig)

  const memoryDir = join(options.projectDir, ".agent", "state", "memory")
  const legacyMemoryDir = join(options.projectDir, ".opencode", "memory")
  const activeMemoryDir = existsSync(memoryDir) ? memoryDir : legacyMemoryDir
  const memoryCount = existsSync(activeMemoryDir)
    ? readdirSync(activeMemoryDir).filter((f: string) => f.endsWith(".json")).length
    : 0

  const learningsPath = join(options.projectDir, ".agent", "state", "learnings.json")
  const legacyLearningsPath = join(options.projectDir, ".opencode", "learnings.json")
  const activeLearningsPath = existsSync(learningsPath) ? learningsPath : legacyLearningsPath
  const learningsCount = existsSync(activeLearningsPath)
    ? (options.readJSON(activeLearningsPath).learnings?.length ?? 0)
    : 0

  const statusPacks = resolveToolkitPacks(options.env, options.projectDir, profile)
  const commandCatalog = listToolkitCommands(options.env)
  const userCommandCount = commandCatalog.filter((entry) => entry.surface === "user").length
  const userAgentCommandCount = commandCatalog.filter((entry) => entry.surface === "user-agent").length
  const internalCommandCount = commandCatalog.filter((entry) => entry.surface === "internal").length

  const projectManifest = options.loadManifest(options.projectDir)
  const sandbox = config.sandbox_root ? `✓ (${config.sandbox_root})` : "✗ (unrestricted)"
  const attachment = projectManifest
    ? {
        attached: true as const,
        attachedDate: projectManifest.attachedAt.split("T")[0],
        artifactCount: projectManifest.artifacts.length,
        runtimeArtifactCount: projectManifest.artifacts.filter((a) => a.type === "runtime").length,
        adapterArtifactCount: projectManifest.artifacts.filter((a) => a.type === "adapter").length,
        durableArtifactCount: projectManifest.artifacts.filter((a) => a.type === "durable").length,
        trackedDirectories: projectManifest.directories.length,
      }
    : { attached: false as const }

  return formatOptionalRuntimeStatus({
    profile,
    compaction,
    activeHooks,
    availableHooks: options.hookRegistryLength,
    hookFiles: hooks.length,
    skillsCount: toolkitInventory.skills.length,
    skillsSource: `${options.env.toolkitContentDir}/skills`,
    agentsCount: toolkitInventory.agents.length,
    agentsSource: `${options.env.toolkitContentDir}/agents`,
    legacyCommandsCount: toolkitInventory.commands.length,
    legacyCommandsSource: `${options.env.toolkitContentDir}/commands`,
    userCommandsCount: userCommandCount,
    userAgentCommandsCount: userAgentCommandCount,
    internalCommandsCount: internalCommandCount,
    memoryCount,
    learningsCount,
    configLabel: existsSync(configPath) ? `✓ (${configPath})` : "✗ (using defaults)",
    packsLabel: `Capability Packs (${statusPacks.length} active)\n${formatToolkitPackSummary(statusPacks)}`,
    attachment,
    sandboxLabel: sandbox,
    staleFileGuardLabel: profile !== "minimal" && profile !== "light" ? "✓" : "✗ (standard+ only)",
  })
}
