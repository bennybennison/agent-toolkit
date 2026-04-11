/**
 * Pack resolver — discovers and resolves capability packs at install/attach time.
 *
 * Packs are directories under the toolkit packs directory with a pack.json manifest.
 * Resolution considers: auto-detection (project files), profile gates, and explicit selection.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export interface PackManifest {
  id: string
  name: string
  version: string
  category: "skills" | "agents" | "rules" | "quality" | "mcp" | "commands" | "workers" | "verify" | "backend"
  provides: string[]
  requires: string[]
  hostVisibility?: "visible" | "hidden"
  auto_detect?: { files: string[] }
  profiles?: string[]
  always?: boolean
  content: {
    instructions?: string[]
    commands?: string[]
    agents?: string[]
    hooks?: string[]
    mcp?: string[]
    templates?: string[]
  }
}

export interface ResolvedPack {
  id: string
  manifest: PackManifest
  dir: string
  /** Why this pack was included */
  reason: "always" | "auto-detect" | "profile" | "explicit"
}

/**
 * Load all pack.json manifests from the toolkit packs directory.
 */
export function loadPackManifests(packsDir: string): Map<string, { manifest: PackManifest; dir: string }> {
  const result = new Map<string, { manifest: PackManifest; dir: string }>()
  if (!existsSync(packsDir)) return result

  for (const entry of readdirSync(packsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const packJsonPath = join(packsDir, entry.name, "pack.json")
    if (!existsSync(packJsonPath)) continue
    try {
      const manifest: PackManifest = JSON.parse(readFileSync(packJsonPath, "utf-8"))
      result.set(manifest.id, { manifest, dir: join(packsDir, entry.name) })
    } catch {
      // Skip malformed pack.json
    }
  }
  return result
}

const PROFILE_RANK: Record<string, number> = {
  minimal: 1, light: 1, standard: 2, full: 3,
}

/**
 * Resolve which packs should be active for a given project.
 */
export function resolvePacks(opts: {
  packsDir: string
  projectDir: string
  profile: string
  explicitPacks?: string[]
}): ResolvedPack[] {
  const { packsDir, projectDir, profile, explicitPacks } = opts
  const all = loadPackManifests(packsDir)
  const resolved: ResolvedPack[] = []
  const currentRank = PROFILE_RANK[profile] ?? 2

  for (const [id, { manifest, dir }] of all) {
    // 1. Explicit selection always wins
    if (explicitPacks?.includes(id)) {
      resolved.push({ id, manifest, dir, reason: "explicit" })
      continue
    }

    // 2. Always-included packs
    if (manifest.always) {
      resolved.push({ id, manifest, dir, reason: "always" })
      continue
    }

    // 3. Profile gate — skip if current profile is below minimum
    if (manifest.profiles && manifest.profiles.length > 0) {
      const minRequired = Math.min(
        ...manifest.profiles.map((p) => PROFILE_RANK[p] ?? 2),
      )
      if (currentRank < minRequired) continue
    }

    // 4. Auto-detection — check if project has matching files
    if (manifest.auto_detect?.files && manifest.auto_detect.files.length > 0) {
      const detected = manifest.auto_detect.files.some((f) => existsSync(join(projectDir, f)))
      if (detected) {
        resolved.push({ id, manifest, dir, reason: "auto-detect" })
        continue
      }
      // Has auto_detect but no match AND no always flag — skip
      if (!manifest.profiles || manifest.profiles.length === 0) continue
    }

    // 5. Profile-only packs (no auto_detect) — include if profile matches
    if (manifest.profiles && manifest.profiles.length > 0 && !manifest.auto_detect) {
      resolved.push({ id, manifest, dir, reason: "profile" })
      continue
    }
  }

  return resolved
}

/**
 * Collect all instruction file paths from resolved packs.
 * Returns absolute paths suitable for opencode.json instructions array.
 */
export function collectPackInstructionPaths(packs: ResolvedPack[]): string[] {
  return collectPackInstructionPathsWithOptions(packs, { agentExposure: "all" })
}

export function collectPackInstructionPathsWithOptions(
  packs: ResolvedPack[],
  options?: { agentExposure?: "all" | "visible-only" | "none" },
): string[] {
  const paths: string[] = []
  const agentExposure = options?.agentExposure ?? "all"
  for (const pack of packs) {
    if (pack.manifest.content.instructions) {
      for (const pattern of pack.manifest.content.instructions) {
        if (pattern.includes("*")) {
          // Glob: expand *.md in the pack directory
          const dir = pack.dir
          if (existsSync(dir)) {
            const ext = pattern.replace("*", "")
            for (const file of readdirSync(dir)) {
              if (file.endsWith(ext) && file !== "pack.json") {
                paths.push(join(dir, file))
              }
            }
          }
        } else {
          paths.push(join(pack.dir, pattern))
        }
      }
    }
    // Agent .md files
    const allowAgents = agentExposure === "all"
      || (agentExposure === "visible-only" && pack.manifest.hostVisibility !== "hidden")
    if (allowAgents && pack.manifest.content.agents) {
      for (const pattern of pack.manifest.content.agents) {
        if (pattern.includes("*")) {
          const dir = pack.dir
          if (existsSync(dir)) {
            const ext = pattern.replace("*", "")
            for (const file of readdirSync(dir)) {
              if (file.endsWith(ext) && file !== "pack.json") {
                paths.push(join(dir, file))
              }
            }
          }
        } else {
          paths.push(join(pack.dir, pattern))
        }
      }
    }
    // Command .md files from commands/ subdirectory
    if (pack.manifest.content.commands) {
      for (const pattern of pack.manifest.content.commands) {
        const cmdDir = join(pack.dir, "commands")
        if (pattern.includes("*") && existsSync(cmdDir)) {
          const ext = pattern.replace("*", "")
          for (const file of readdirSync(cmdDir)) {
            if (file.endsWith(ext)) {
              paths.push(join(cmdDir, file))
            }
          }
        } else {
          paths.push(join(pack.dir, pattern))
        }
      }
    }
  }
  return paths
}

/**
 * Get hook module IDs that packs want to register.
 * These are added to the enabled hooks set.
 */
export function collectPackHookIds(packs: ResolvedPack[]): string[] {
  const hooks: string[] = []
  for (const pack of packs) {
    if (pack.manifest.content.hooks) {
      hooks.push(...pack.manifest.content.hooks)
    }
  }
  return hooks
}

/**
 * Collect MCP server config paths from resolved packs.
 */
export function collectPackMcpPaths(packs: ResolvedPack[]): string[] {
  const paths: string[] = []
  for (const pack of packs) {
    if (pack.manifest.content.mcp) {
      for (const file of pack.manifest.content.mcp) {
        paths.push(join(pack.dir, file))
      }
    }
  }
  return paths
}

/**
 * Format resolved packs for display.
 */
export function formatPackSummary(packs: ResolvedPack[]): string {
  if (packs.length === 0) return "  (none)"
  return packs
    .map((p) => `  ${p.id} (${p.reason})`)
    .join("\n")
}
