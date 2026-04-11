import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"
import { isValidMode, getModePolicy, type Mode, type ModePolicy } from "./model-routing/modes"

/**
 * Framework Config Loader
 *
 * Resolves config from up to three sources (in priority order):
 *   1. Project overlay:  .agent/config.json  (highest priority)
 *   2. Legacy project:   .opencode/framework.json  (fallback for old projects)
 *   3. Global defaults:  ~/.config/agent-toolkit/runtime.json
 *
 * Values are deep-merged: project overrides global, with DEFAULT_CONFIG as base.
 *
 * Backward compatibility: old configs using `commander.mode` (ghost/scout/autocrat/
 * guardian/interviewer) or `model_routing.execution_mode` are auto-migrated to the
 * unified top-level `mode` field.
 */

/** Resolve the framework's own install directory.
 *  Works whether loaded from the repo root index.ts re-export or directly. */
function resolveFrameworkDir(): string {
  // This file lives at runtime/lib/ — go up two levels to reach framework root
  const thisDir = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url))
  return dirname(dirname(thisDir))
}

const PREFERRED_GLOBAL_CONFIG_PATH = join(homedir(), ".config", "agent-toolkit", "runtime.json")
const LEGACY_GLOBAL_CONFIG_PATH = join(homedir(), ".config", "agent-framework", "config.json")

export function getGlobalConfigPath(): string {
  return existsSync(PREFERRED_GLOBAL_CONFIG_PATH) ? PREFERRED_GLOBAL_CONFIG_PATH : LEGACY_GLOBAL_CONFIG_PATH
}

export type ControlFlowConfig = {
  require_approval_for_feature_work: boolean
  require_area_selection_in_monorepos: boolean
  ask_once_then_stop_for_briefs: boolean
  max_research_passes_without_write: number
  disable_subagents_for_strategic_docs: boolean
}

export type CompactionStrategy = "normal" | "aggressive" | "conservative"

/** Kept for consumers that import OperationStyle from framework-config. */
export type OperationStyle = "interactive" | "autonomous"

export type ModularRuntimeConfig = {
  module_registry_path: string
  strict_module_resolution: boolean
  module_flags: Record<string, boolean>
}

export type ModelRoutingConfig = {
  provider_overrides: Record<string, Record<string, unknown>>
  profile_overrides: Record<string, Record<string, unknown>>
}

export type FrameworkConfig = {
  /** Unified mode: governs provider access, operation style, and approval gating. */
  mode: Mode
  /** Confidence threshold for escalation decisions (0–1). */
  cr_threshold: number
  profile: "minimal" | "light" | "standard" | "full"
  compaction_strategy: CompactionStrategy
  sandbox_root: string | null
  shadow_root_path: string
  modules: string[]
  platform: Record<string, string>
  control_flow: ControlFlowConfig
  modularity: ModularRuntimeConfig
  model_routing: ModelRoutingConfig
}

const DEFAULT_CONTROL_FLOW: ControlFlowConfig = {
  require_approval_for_feature_work: true,
  require_area_selection_in_monorepos: true,
  ask_once_then_stop_for_briefs: true,
  max_research_passes_without_write: 1,
  disable_subagents_for_strategic_docs: true,
}

const DEFAULT_MODEL_ROUTING: ModelRoutingConfig = {
  provider_overrides: {},
  profile_overrides: {},
}

const DEFAULT_CONFIG: FrameworkConfig = {
  mode: "online",
  cr_threshold: 0.85,
  profile: "standard",
  compaction_strategy: "normal",
  sandbox_root: null,
  shadow_root_path: ".agent/state/staging",
  modules: [],
  platform: {},
  control_flow: DEFAULT_CONTROL_FLOW,
  modularity: {
    module_registry_path: ".agent/state/modules",
    strict_module_resolution: false,
    module_flags: {},
  },
  model_routing: DEFAULT_MODEL_ROUTING,
}

/** Migrate old CommanderMode vocabulary to the unified Mode type. */
const LEGACY_COMMANDER_MODE_MAP: Record<string, Mode> = {
  ghost: "offline",
  scout: "online",
  autocrat: "autonomous",
  guardian: "review",
  interviewer: "planning",
}

/** Resolve the active Mode by checking config layers in priority order (handles legacy formats).
 *
 * Legacy migration (commander.mode / model_routing.execution_mode) is applied to the
 * project config only. The global config is respected for new-format `mode:` values
 * but not auto-migrated — users should explicitly update their global config. */
function resolveModeFromLayers(
  projectConfig: Record<string, any> | null,
  globalConfig: Record<string, any> | null,
): Mode {
  // Project config — full priority, including legacy migration
  if (projectConfig) {
    if (isValidMode(projectConfig.mode)) return projectConfig.mode as Mode
    const cmdMode = projectConfig.commander?.mode
    if (typeof cmdMode === "string" && cmdMode in LEGACY_COMMANDER_MODE_MAP) {
      return LEGACY_COMMANDER_MODE_MAP[cmdMode]
    }
    const execMode = projectConfig.model_routing?.execution_mode
    if (typeof execMode === "string" && isValidMode(execMode)) return execMode as Mode
  }
  // Global config — new format only (legacy migration requires explicit project config update)
  if (globalConfig && isValidMode(globalConfig.mode)) return globalConfig.mode as Mode
  return DEFAULT_CONFIG.mode
}

function parseThreshold(input: unknown): number {
  if (typeof input !== "number" || Number.isNaN(input)) return DEFAULT_CONFIG.cr_threshold
  return Math.max(0, Math.min(1, input))
}

function parseModuleFlags(input: unknown): Record<string, boolean> {
  if (typeof input !== "object" || input === null) return {}
  const result: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "boolean") result[key] = value
  }
  return result
}

let cached: FrameworkConfig | null = null

function readJSONSafe(path: string): Record<string, any> | null {
  try {
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return null
  }
}

function mergePartial(base: Record<string, any>, overlay: Record<string, any>): Record<string, any> {
  const result = { ...base }
  for (const [key, val] of Object.entries(overlay)) {
    if (val !== undefined && val !== null && typeof val === "object" && !Array.isArray(val) && typeof base[key] === "object" && !Array.isArray(base[key])) {
      result[key] = mergePartial(base[key], val)
    } else if (val !== undefined) {
      result[key] = val
    }
  }
  return result
}

export function loadFrameworkConfig(): FrameworkConfig {
  if (cached) return cached

  // 1. Start with defaults
  let merged: Record<string, any> = { ...DEFAULT_CONFIG }

  // 2. Layer global config (lowest priority overrides)
  const globalConfig = readJSONSafe(PREFERRED_GLOBAL_CONFIG_PATH) ?? readJSONSafe(LEGACY_GLOBAL_CONFIG_PATH)
  if (globalConfig) {
    merged = mergePartial(merged, globalConfig)
  }

  // 3. Layer project config (highest priority)
  //    Try new .agent/config.json first, fall back to legacy .opencode/framework.json
  const projectDir = process.cwd()
  const newConfigPath = join(projectDir, ".agent", "config.json")
  const legacyConfigPath = join(projectDir, ".opencode", "framework.json")

  const projectConfig = readJSONSafe(newConfigPath) ?? readJSONSafe(legacyConfigPath)
  if (projectConfig) {
    merged = mergePartial(merged, projectConfig)
  }

  // Resolve mode and cr_threshold from raw config layers (not merged, to preserve priority over defaults)
  const rawThreshold = projectConfig?.cr_threshold ?? projectConfig?.commander?.cr_threshold
    ?? globalConfig?.cr_threshold ?? globalConfig?.commander?.cr_threshold
    ?? merged.cr_threshold

  cached = {
    mode: resolveModeFromLayers(projectConfig ?? null, globalConfig ?? null),
    cr_threshold: parseThreshold(rawThreshold),
    profile: merged.profile ?? DEFAULT_CONFIG.profile,
    compaction_strategy: (["normal", "aggressive", "conservative"] as const).includes(merged.compaction_strategy as any)
      ? (merged.compaction_strategy as CompactionStrategy)
      : DEFAULT_CONFIG.compaction_strategy,
    sandbox_root: typeof merged.sandbox_root === "string" ? merged.sandbox_root : null,
    shadow_root_path: typeof merged.shadow_root_path === "string" ? merged.shadow_root_path : DEFAULT_CONFIG.shadow_root_path,
    modules: Array.isArray(merged.modules) ? merged.modules : [],
    platform: typeof merged.platform === "object" && merged.platform !== null ? merged.platform : {},
    control_flow: {
      ...DEFAULT_CONTROL_FLOW,
      ...(typeof merged.control_flow === "object" && merged.control_flow !== null ? merged.control_flow : {}),
    },
    modularity: {
      module_registry_path:
        typeof merged.modularity?.module_registry_path === "string"
          ? merged.modularity.module_registry_path
          : DEFAULT_CONFIG.modularity.module_registry_path,
      strict_module_resolution:
        typeof merged.modularity?.strict_module_resolution === "boolean"
          ? merged.modularity.strict_module_resolution
          : DEFAULT_CONFIG.modularity.strict_module_resolution,
      module_flags: parseModuleFlags(merged.modularity?.module_flags),
    },
    model_routing: {
      provider_overrides:
        typeof merged.model_routing?.provider_overrides === "object" && merged.model_routing.provider_overrides !== null
          ? merged.model_routing.provider_overrides
          : DEFAULT_MODEL_ROUTING.provider_overrides,
      profile_overrides:
        typeof merged.model_routing?.profile_overrides === "object" && merged.model_routing.profile_overrides !== null
          ? merged.model_routing.profile_overrides
          : DEFAULT_MODEL_ROUTING.profile_overrides,
    },
  }

  return cached
}

export function getControlFlow(): ControlFlowConfig {
  return loadFrameworkConfig().control_flow
}

/** Return the active mode and confidence threshold. */
export function getModeConfig(): { mode: Mode; cr_threshold: number } {
  const config = loadFrameworkConfig()
  return { mode: config.mode, cr_threshold: config.cr_threshold }
}

/** Return the full policy bundle for the active mode. */
export function getActiveModePolicy(): ModePolicy {
  return getModePolicy(loadFrameworkConfig().mode)
}

export function getModelRoutingConfig(): ModelRoutingConfig {
  return loadFrameworkConfig().model_routing
}

export function getDefaultOperationStyle(): OperationStyle {
  return getModePolicy(loadFrameworkConfig().mode).operationStyle
}

export function isModuleEnabled(moduleId: string, defaultValue: boolean = true): boolean {
  const flags = loadFrameworkConfig().modularity.module_flags
  if (moduleId in flags) return flags[moduleId]
  return defaultValue
}

export function getModularityConfig(): ModularRuntimeConfig {
  return loadFrameworkConfig().modularity
}

export function getShadowRootPath(): string {
  return loadFrameworkConfig().shadow_root_path
}

// Test helper to force re-reading config from disk after cwd changes.
export function __resetFrameworkConfigCacheForTests(): void {
  cached = null
}
