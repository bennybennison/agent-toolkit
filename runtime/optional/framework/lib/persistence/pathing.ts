import { join, resolve } from "node:path"
import type { HandoffObjectType } from "../contracts/handoff"

const ORCHESTRATION_DIR = ".agent/state/orchestration"
const ORCHESTRATION_SESSIONS_DIR = `${ORCHESTRATION_DIR}/sessions`
const ORCHESTRATION_HANDOFFS_DIR = `${ORCHESTRATION_DIR}/handoffs`
const ORCHESTRATION_MAPS_DIR = `${ORCHESTRATION_DIR}/maps`
const ORCHESTRATION_PROJECT_MAPS_DIR = `${ORCHESTRATION_MAPS_DIR}/project`
const ORCHESTRATION_TASK_MAPS_DIR = `${ORCHESTRATION_MAPS_DIR}/tasks`
const ORCHESTRATION_CONTEXT_BUNDLES_DIR = `${ORCHESTRATION_DIR}/context-bundles`
const ORCHESTRATION_MEMORY_DIR = `${ORCHESTRATION_DIR}/memory`
const ORCHESTRATION_MEMORY_ENTRIES_DIR = `${ORCHESTRATION_MEMORY_DIR}/entries`

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-")
}

export function getLegacySessionStatePath(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ".agent", "state", "session-state.json")
}

export function getCanonicalSessionStatePath(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_SESSIONS_DIR, "current.json")
}

export function getHandoffsDir(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_HANDOFFS_DIR)
}

export function getCanonicalMapsDir(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_MAPS_DIR)
}

export function getCanonicalProjectMapPaths(rootDir: string = process.cwd()): { projectMapPath: string; projectFilesPath: string } {
  return {
    projectMapPath: resolve(rootDir, ORCHESTRATION_PROJECT_MAPS_DIR, "project-map.json"),
    projectFilesPath: resolve(rootDir, ORCHESTRATION_PROJECT_MAPS_DIR, "project-map.files.json"),
  }
}

export function resolveCanonicalTaskMapPath(taskMapId: string, rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_TASK_MAPS_DIR, `${sanitizeSegment(taskMapId)}.json`)
}

export function getCanonicalContextBundlesDir(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_CONTEXT_BUNDLES_DIR)
}

export function resolveCanonicalContextBundlePath(missionId: string, purpose: string, rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_CONTEXT_BUNDLES_DIR, sanitizeSegment(missionId), `${sanitizeSegment(purpose)}.json`)
}

export function getMemoryEntriesDir(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_MEMORY_ENTRIES_DIR)
}

export function getLearningsPath(rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_MEMORY_DIR, "learnings.json")
}

export function resolveMemoryEntryPath(timestamp: string, rootDir: string = process.cwd()): string {
  const fileName = `${sanitizeSegment(timestamp.replace(/[:.]/g, "-"))}.json`
  return resolve(rootDir, ORCHESTRATION_MEMORY_ENTRIES_DIR, fileName)
}

export function resolveHandoffPath(type: HandoffObjectType, missionId: string, rootDir: string = process.cwd()): string {
  return resolve(rootDir, ORCHESTRATION_HANDOFFS_DIR, type, `${sanitizeSegment(missionId)}.json`)
}

export function getRelativeArtifactPath(rootDir: string, absolutePath: string): string {
  return absolutePath.startsWith(rootDir)
    ? absolutePath.slice(rootDir.length + 1).replace(/\\/g, "/")
    : absolutePath.replace(/\\/g, "/")
}
