import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { dirname, relative } from "node:path"

import type { FileMapObject, ProjectMap, TaskMap } from "../contracts/mapping"
import type { ContextBundle } from "../contracts/context-bundle"
import { validateProjectFileIndex, validateProjectMap, validateTaskMap } from "./validation"
import { validateContextBundle } from "../context-bundles/validation"
import {
  getLegacyProjectMapPaths,
  resolveContextBundlePath,
  resolveLegacyContextBundlePath,
  resolveLegacyTaskMapPath,
  resolveMapArtifactPath,
  resolveTaskMapPath,
} from "./pathing"

type StoredProjectMap = Omit<ProjectMap, "fileIndexPath"> & {
  fileIndexPath: string
}

function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true })
}

function writeJson(filePath: string, payload: unknown): void {
  ensureParentDir(filePath)
  writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8")
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!existsSync(filePath)) return null
    return JSON.parse(readFileSync(filePath, "utf8")) as T
  } catch {
    return null
  }
}

function readFirstJson<T>(paths: string[]): T | null {
  for (const filePath of paths) {
    const payload = readJson<T>(filePath)
    if (payload != null) return payload
  }
  return null
}

function getCanonicalProjectMapPaths(): { projectMapPath: string; projectFilesPath: string } {
  return {
    projectMapPath: resolveMapArtifactPath("project-map.json"),
    projectFilesPath: resolveMapArtifactPath("project-map.files.json"),
  }
}

export function saveProjectMap(projectMap: ProjectMap, files: Record<string, FileMapObject>): void {
  const canonicalPaths = getCanonicalProjectMapPaths()
  const legacyPaths = getLegacyProjectMapPaths()
  writeJson(canonicalPaths.projectFilesPath, files)
  writeJson(legacyPaths.projectFilesPath, files)

  const stored: StoredProjectMap = {
    ...projectMap,
    fileIndexPath: relative(process.cwd(), canonicalPaths.projectFilesPath).replace(/\\/g, "/"),
  }
  writeJson(canonicalPaths.projectMapPath, stored)
  writeJson(legacyPaths.projectMapPath, {
    ...stored,
    fileIndexPath: relative(process.cwd(), legacyPaths.projectFilesPath).replace(/\\/g, "/"),
  })
}

export function loadProjectMap(): { projectMap: ProjectMap; files: Record<string, FileMapObject> } | null {
  const canonicalPaths = getCanonicalProjectMapPaths()
  const legacyPaths = getLegacyProjectMapPaths()
  const projectMap = readFirstJson<ProjectMap>([canonicalPaths.projectMapPath, legacyPaths.projectMapPath])
  const files = readFirstJson<Record<string, FileMapObject>>([canonicalPaths.projectFilesPath, legacyPaths.projectFilesPath])
  if (!projectMap || !files) return null

  const mapValidation = validateProjectMap(projectMap)
  const fileValidation = validateProjectFileIndex(files)
  if (!mapValidation.ok || !fileValidation.ok) return null

  return {
    projectMap: {
      ...projectMap,
      fileIndexPath: canonicalPaths.projectFilesPath,
    },
    files,
  }
}

export function getProjectMapArtifactPaths(): { projectMapPath: string; projectFilesPath: string } {
  return getCanonicalProjectMapPaths()
}

export function saveTaskMap(taskMapPath: string, taskMap: TaskMap): void {
  const canonicalPath = resolveTaskMapPath(taskMap.taskMapId)
  const legacyPath = resolveLegacyTaskMapPath(taskMap.taskMapId)
  writeJson(canonicalPath, taskMap)
  writeJson(legacyPath, taskMap)
  if (taskMapPath !== canonicalPath && taskMapPath !== legacyPath) {
    writeJson(taskMapPath, taskMap)
  }
}

export function loadTaskMap(taskMapPath: string): TaskMap | null {
  const taskMapId = taskMapPath.split("/").pop()?.replace(/\.json$/, "") ?? ""
  const taskMap = readFirstJson<TaskMap>([
    taskMapPath,
    taskMapId ? resolveTaskMapPath(taskMapId) : "",
    taskMapId ? resolveLegacyTaskMapPath(taskMapId) : "",
  ].filter(Boolean))
  if (!taskMap) return null
  return validateTaskMap(taskMap).ok ? taskMap : null
}

export function saveContextBundle(bundlePath: string, bundle: ContextBundle): void {
  const canonicalPath = resolveContextBundlePath(bundle.missionId, bundle.purpose)
  const legacyPath = resolveLegacyContextBundlePath(bundle.missionId, bundle.purpose)
  writeJson(canonicalPath, bundle)
  writeJson(legacyPath, bundle)
  if (bundlePath !== canonicalPath && bundlePath !== legacyPath) {
    writeJson(bundlePath, bundle)
  }
}

export function loadContextBundle(bundlePath: string): ContextBundle | null {
  const fileName = bundlePath.split("/").pop()?.replace(/\.json$/, "") ?? ""
  const missionDir = bundlePath.split("/").slice(-2, -1)[0] ?? ""
  const legacyMatch = fileName.match(/^(.*)-(planning|implementation|review|verification|handoff)$/)
  const missionId = legacyMatch?.[1] ?? missionDir
  const purpose = legacyMatch?.[2] ?? fileName
  const candidates = [bundlePath]

  if (missionId && purpose) {
    candidates.push(resolveContextBundlePath(missionId, purpose))
    candidates.push(resolveLegacyContextBundlePath(missionId, purpose))
  }

  const bundle = readFirstJson<ContextBundle>(candidates)
  if (!bundle) return null
  return validateContextBundle(bundle).ok ? bundle : null
}
