import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { type ToolkitHostConventions } from "../toolkit-environment"
import { ADAPTER_TARGETS } from "./adapter-targets"
import { type AdapterTarget, type InstalledTargetRecord, type ToolInstallRegistry } from "./contracts"

const REGISTRY_VERSION = 1

export function getProjectInstallRegistryPath(projectDir: string, hostConventions: ToolkitHostConventions): string {
  return join(projectDir, hostConventions.projectStateDir, "tool-installs.json")
}

export function getGlobalInstallRegistryPath(baseDir?: string): string {
  const resolvedBaseDir = baseDir ?? join(homedir(), ".config", "agent-toolkit")
  return join(resolvedBaseDir, "tool-installs.json")
}

function createEmptyRegistry(): ToolInstallRegistry {
  return {
    version: REGISTRY_VERSION,
    installs: [],
  }
}

function loadRegistry(path: string): ToolInstallRegistry {
  if (!existsSync(path)) return createEmptyRegistry()
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as ToolInstallRegistry
    if (parsed.version !== REGISTRY_VERSION || !Array.isArray(parsed.installs)) {
      return createEmptyRegistry()
    }
    return parsed
  } catch {
    return createEmptyRegistry()
  }
}

function saveRegistry(path: string, registry: ToolInstallRegistry): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(registry, null, 2) + "\n", "utf8")
}

export function loadProjectInstallRegistry(projectDir: string, hostConventions: ToolkitHostConventions): ToolInstallRegistry {
  return loadRegistry(getProjectInstallRegistryPath(projectDir, hostConventions))
}

export function saveProjectInstallRegistry(projectDir: string, hostConventions: ToolkitHostConventions, registry: ToolInstallRegistry): void {
  saveRegistry(getProjectInstallRegistryPath(projectDir, hostConventions), registry)
}

export function loadGlobalInstallRegistry(baseDir?: string): ToolInstallRegistry {
  return loadRegistry(getGlobalInstallRegistryPath(baseDir))
}

export function saveGlobalInstallRegistry(registry: ToolInstallRegistry, baseDir?: string): void {
  saveRegistry(getGlobalInstallRegistryPath(baseDir), registry)
}

export function recordInstalledTarget(
  registry: ToolInstallRegistry,
  record: Omit<InstalledTargetRecord, "installedAt" | "updatedAt"> & Partial<Pick<InstalledTargetRecord, "installedAt" | "updatedAt">>,
): void {
  const now = new Date().toISOString()
  const existing = registry.installs.findIndex(
    (entry) => entry.target === record.target && entry.scope === record.scope && entry.rootDir === record.rootDir,
  )

  const normalized: InstalledTargetRecord = {
    ...record,
    installedAt: record.installedAt ?? (existing >= 0 ? registry.installs[existing].installedAt : now),
    updatedAt: record.updatedAt ?? now,
    activePackIds: [...record.activePackIds].sort(),
    generatedPaths: [...record.generatedPaths].sort(),
    generatedFileHashes: record.generatedFileHashes ? Object.fromEntries(
      Object.entries(record.generatedFileHashes).sort(([left], [right]) => left.localeCompare(right)),
    ) : undefined,
  }

  if (existing >= 0) {
    registry.installs[existing] = normalized
    return
  }

  registry.installs.push(normalized)
}

export function removeInstalledTarget(
  registry: ToolInstallRegistry,
  target: AdapterTarget,
  scope: "global" | "project",
  rootDir: string,
): void {
  registry.installs = registry.installs.filter(
    (entry) => !(entry.target === target && entry.scope === scope && entry.rootDir === rootDir),
  )
}

export function inferProjectInstalledTargets(projectDir: string): InstalledTargetRecord[] {
  const now = new Date().toISOString()
  return Object.values(ADAPTER_TARGETS)
    .map((definition) => {
      const generatedPaths = definition.defaultProjectPaths.filter((relPath) => existsSync(join(projectDir, relPath)))
      if (generatedPaths.length === 0) return null
      return {
        target: definition.id,
        scope: "project" as const,
        rootDir: projectDir,
        installedAt: now,
        updatedAt: now,
        source: "inferred" as const,
        generatedPaths: generatedPaths.sort(),
        activePackIds: [],
      }
    })
    .filter((entry): entry is InstalledTargetRecord => entry !== null)
}

export function getProjectInstalledTargets(projectDir: string, hostConventions: ToolkitHostConventions): InstalledTargetRecord[] {
  const registry = loadProjectInstallRegistry(projectDir, hostConventions)
  if (registry.installs.length > 0) return registry.installs
  return inferProjectInstalledTargets(projectDir)
}
