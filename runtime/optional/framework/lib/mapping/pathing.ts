import { join, relative, resolve, sep } from "node:path"
import {
  getCanonicalContextBundlesDir,
  getCanonicalMapsDir,
  resolveCanonicalContextBundlePath,
  resolveCanonicalTaskMapPath,
} from "../persistence/pathing"

const LEGACY_MAPS_DIR = ".agent/state/maps"
const LEGACY_TASK_MAPS_DIR = `${LEGACY_MAPS_DIR}/tasks`
const LEGACY_CONTEXT_BUNDLES_DIR = ".agent/state/context-bundles"

export function normalizeRelativePath(rootPath: string, targetPath: string): string {
  const rel = relative(rootPath, targetPath).split(sep).join("/")
  return rel === "" ? "." : rel
}

export function normalizeStoredPath(path: string): string {
  return path.split(sep).join("/")
}

export function resolveMapArtifactPath(...parts: string[]): string {
  return resolve(getCanonicalMapsDir(process.cwd()), "project", ...parts)
}

export function resolveTaskMapPath(taskMapId: string): string {
  return resolveCanonicalTaskMapPath(taskMapId, process.cwd())
}

export function resolveContextBundlePath(missionId: string, purpose: string): string {
  return resolveCanonicalContextBundlePath(missionId, purpose, process.cwd())
}

export function getMapsDir(): string {
  return getCanonicalMapsDir(process.cwd())
}

export function getTaskMapsDir(): string {
  return resolve(getMapsDir(), "tasks")
}

export function getContextBundlesDir(): string {
  return getCanonicalContextBundlesDir(process.cwd())
}

export function getLegacyMapsDir(): string {
  return resolve(process.cwd(), LEGACY_MAPS_DIR)
}

export function getLegacyProjectMapPaths(): { projectMapPath: string; projectFilesPath: string } {
  return {
    projectMapPath: resolve(process.cwd(), LEGACY_MAPS_DIR, "project-map.json"),
    projectFilesPath: resolve(process.cwd(), LEGACY_MAPS_DIR, "project-map.files.json"),
  }
}

export function resolveLegacyTaskMapPath(taskMapId: string): string {
  return resolve(process.cwd(), LEGACY_TASK_MAPS_DIR, `${taskMapId}.json`)
}

export function resolveLegacyContextBundlePath(missionId: string, purpose: string): string {
  const fileName = `${missionId}-${purpose}.json`.replace(/[^a-zA-Z0-9._-]/g, "-")
  return resolve(process.cwd(), LEGACY_CONTEXT_BUNDLES_DIR, fileName)
}

export function joinFromRoot(rootPath: string, relativePath: string): string {
  if (relativePath === ".") return rootPath
  return join(rootPath, relativePath)
}
