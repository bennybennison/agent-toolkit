import { existsSync, readdirSync, rmdirSync, unlinkSync } from "node:fs"
import { dirname, join } from "node:path"
import { type ToolkitHostConventions } from "../toolkit-environment"
import {
  getProjectInstalledTargets,
  loadProjectInstallRegistry,
  removeInstalledTarget,
  saveProjectInstallRegistry,
} from "./install-registry"
import { isToolkitFileUnmodified } from "./file-state"
import {
  type AdapterTarget,
  type BlockedTargetRemoval,
  type ProjectTargetPrunePlan,
  type ProjectTargetPruneResult,
} from "./contracts"

export function planProjectTargetPrune(
  projectDir: string,
  desiredTargets: AdapterTarget[],
  hostConventions: ToolkitHostConventions,
): ProjectTargetPrunePlan {
  const installed = getProjectInstalledTargets(projectDir, hostConventions)
  if (installed.length === 0) {
    return {
      desiredTargets,
      installedTargets: [],
      removable: [],
      blocked: [],
    }
  }
  const desired = new Set(desiredTargets)
  const removable: ProjectTargetPrunePlan["removable"] = []
  const blocked: BlockedTargetRemoval[] = []

  for (const entry of installed) {
    if (desired.has(entry.target)) continue

    const modified = entry.generatedPaths.filter((path) => {
      const expectedHash = entry.generatedFileHashes?.[path]
      return !isToolkitFileUnmodified(projectDir, path, expectedHash)
    })
    if (modified.length > 0) {
      blocked.push({
        target: entry.target,
        reason: "One or more generated files were modified locally.",
        paths: modified,
      })
      continue
    }

    removable.push({
      target: entry.target,
      paths: [...entry.generatedPaths],
    })
  }

  return {
    desiredTargets,
    installedTargets: installed.map((entry) => entry.target),
    removable,
    blocked,
  }
}

function removeEmptyParents(projectDir: string, relPath: string): void {
  let currentDir = dirname(join(projectDir, relPath))
  while (currentDir.startsWith(projectDir) && currentDir !== projectDir) {
    if (!existsSync(currentDir)) {
      currentDir = dirname(currentDir)
      continue
    }
    if (readdirSync(currentDir).length > 0) break
    rmdirSync(currentDir)
    currentDir = dirname(currentDir)
  }
}

export function applyProjectTargetPrune(
  projectDir: string,
  plan: ProjectTargetPrunePlan,
  hostConventions: ToolkitHostConventions,
): ProjectTargetPruneResult {
  const registry = loadProjectInstallRegistry(projectDir, hostConventions)
  const removedPaths: string[] = []
  const removedTargets: AdapterTarget[] = []

  for (const removable of plan.removable) {
    for (const relPath of removable.paths) {
      const fullPath = join(projectDir, relPath)
      if (!existsSync(fullPath)) continue
      unlinkSync(fullPath)
      removeEmptyParents(projectDir, relPath)
      removedPaths.push(relPath)
    }
    removeInstalledTarget(registry, removable.target, "project", projectDir)
    removedTargets.push(removable.target)
  }

  saveProjectInstallRegistry(projectDir, hostConventions, registry)

  return {
    removedTargets,
    removedPaths,
    blocked: plan.blocked,
  }
}
