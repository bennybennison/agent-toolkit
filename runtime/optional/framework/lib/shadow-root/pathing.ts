import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { relative, resolve } from "node:path"

import { getShadowRootPath } from "../framework-config"
import { loadSessionStateFile } from "../session-state-store"

function projectRoot(): string {
  return process.cwd()
}

export function getActiveMissionContext(): { active: boolean; missionId: string | null } {
  const state = loadSessionStateFile()
  return {
    active: state.shadowMode === "staging" && typeof state.activeMissionId === "string" && state.activeMissionId.length > 0,
    missionId: state.activeMissionId,
  }
}

export function isInternalFrameworkPath(filePath: string): boolean {
  const resolved = resolve(filePath)
  const root = projectRoot()
  return (
    resolved.startsWith(resolve(root, ".agent") + "/") ||
    resolved.startsWith(resolve(root, ".opencode") + "/")
  )
}

export function resolveProjectPath(targetPath: string): string {
  return resolve(projectRoot(), targetPath)
}

export function getMissionShadowRoot(missionId: string): string {
  return resolve(projectRoot(), getShadowRootPath(), missionId)
}

export function toShadowPath(targetPath: string, missionId: string): string {
  const physical = resolveProjectPath(targetPath)
  const rel = relative(projectRoot(), physical)
  return resolve(getMissionShadowRoot(missionId), rel)
}

export function getShadowPathIfStaged(targetPath: string): string | null {
  const context = getActiveMissionContext()
  if (!context.active || !context.missionId) return null

  const shadowPath = toShadowPath(targetPath, context.missionId)
  return existsSync(shadowPath) ? shadowPath : null
}

export function ensureShadowParent(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
}
