import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, extname, join } from "node:path"

import type { DirectoryNode, FileMapObject, MapRefreshMode, MapRefreshResult, ProjectMap } from "../contracts/mapping"
import { listDirectory } from "../workers/file-metadata-reader"
import { deriveImportedByRelationships, extractRelationships, inferLanguage, inferTags, isLikelyTextFile, summarizeFile } from "./heuristics"
import { joinFromRoot, normalizeRelativePath } from "./pathing"
import { getProjectMapArtifactPaths, loadProjectMap, saveProjectMap } from "./storage"

const SKIP_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  ".agent",
  ".opencode/state",
  ".tmp",
  "dist",
  "build",
  "coverage",
])

type RefreshOptions = {
  rootPath?: string
  mode: MapRefreshMode
  targetPaths?: string[]
}

export function refreshProjectMap(options: RefreshOptions): MapRefreshResult {
  const rootPath = options.rootPath ?? process.cwd()
  const previous = loadProjectMap()
  const previousFiles = previous?.files ?? {}
  const scan = scanProjectStructure(rootPath)
  const now = new Date().toISOString()
  const allPaths = new Set(Object.keys(scan.files))
  const changedFiles = Object.keys(scan.files).filter((path) => {
    return scan.files[path].lastSeenHash !== previousFiles[path]?.lastSeenHash
  })
  const addedFiles = Object.keys(scan.files).filter((path) => !(path in previousFiles))
  const removedFiles = Object.keys(previousFiles).filter((path) => !(path in scan.files))

  const targetPaths = normalizeTargetPaths(rootPath, options.targetPaths ?? [], allPaths)
  const shouldFullRemap = options.mode === "full"
  const shouldTargetRemap = options.mode === "targeted" || targetPaths.length > 0
  const remapTargets = shouldFullRemap
    ? Object.keys(scan.files)
    : shouldTargetRemap
      ? dedupe([...targetPaths, ...changedFiles.filter((path) => targetPaths.includes(path))])
      : []
  const files: Record<string, FileMapObject> = {}
  for (const [path, nextFile] of Object.entries(scan.files)) {
    const previousFile = previousFiles[path]
    const contentChanged = nextFile.lastSeenHash !== previousFile?.lastSeenHash
    const remap = shouldFullRemap || remapTargets.includes(path)

    if (remap) {
      files[path] = enrichFileMap(rootPath, nextFile, allPaths, now)
      continue
    }

    if (!contentChanged && previousFile) {
      files[path] = { ...previousFile, sizeBytes: nextFile.sizeBytes, modifiedAt: nextFile.modifiedAt, lastSeenHash: nextFile.lastSeenHash }
      continue
    }

    files[path] = {
      ...nextFile,
      lastMappedAt: previousFile?.lastMappedAt ?? null,
      mappingStatus: nextFile.mappingStatus === "skipped" ? "skipped" : contentChanged ? "stale" : previousFile?.mappingStatus ?? "unmapped",
      summary: previousFile?.summary ?? null,
      purpose: previousFile?.purpose ?? null,
      keySymbols: previousFile?.keySymbols ?? [],
      relationships: previousFile?.relationships ?? [],
      tags: previousFile?.tags ?? nextFile.tags,
      error: previousFile?.error ?? null,
    }
  }

  const finalFiles = deriveImportedByRelationships(files)
  const projectMap = buildProjectMap(rootPath, scan.directories, finalFiles, previous?.projectMap.createdAt ?? now, now)
  saveProjectMap(projectMap, finalFiles)

  const staleFiles = Object.values(finalFiles)
    .filter((file) => file.mappingStatus === "stale")
    .map((file) => file.path)
    .sort()

  return {
    mode: options.mode,
    projectMap,
    files: finalFiles,
    addedFiles,
    removedFiles,
    changedFiles: dedupe(changedFiles),
    staleFiles,
    remappedFiles: remapTargets,
  }
}

export function ensureProjectMap(rootPath: string = process.cwd()): MapRefreshResult {
  return loadProjectMap()
    ? refreshProjectMap({ rootPath, mode: "structure-only" })
    : refreshProjectMap({ rootPath, mode: "full" })
}

function scanProjectStructure(rootPath: string): { directories: Record<string, DirectoryNode>; files: Record<string, FileMapObject> } {
  const directories: Record<string, DirectoryNode> = {}
  const files: Record<string, FileMapObject> = {}
  const queue = [rootPath]
  const now = new Date().toISOString()
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const relativePath = normalizeRelativePath(rootPath, current)
    const listing = listDirectory(current)
    const childDirectories = listing.directories
      .filter((path) => shouldIncludeDirectory(relativePath, basename(path)))
      .map((path) => normalizeRelativePath(rootPath, path))
      .sort()
    const filePaths = listing.files
      .map((path) => normalizeRelativePath(rootPath, path))
      .sort()

    directories[relativePath] = {
      path: relativePath,
      name: relativePath === "." ? basename(rootPath) : basename(current),
      parentPath: relativePath === "." ? null : normalizeRelativePath(rootPath, join(current, "..")),
      childDirectories,
      filePaths,
      totalFiles: filePaths.length,
      totalDirectories: childDirectories.length,
      updatedAt: now,
    }

    for (const child of childDirectories) {
      queue.push(joinFromRoot(rootPath, child))
    }

    for (const filePath of filePaths) {
      const absolutePath = joinFromRoot(rootPath, filePath)
      files[filePath] = buildFileShell(filePath, absolutePath)
    }
  }

  return { directories, files }
}

function buildFileShell(path: string, absolutePath: string): FileMapObject {
  const stat = safeStat(absolutePath)
  const language = inferLanguage(path)
  const tags = inferTags(path, language)

  return {
    path,
    name: basename(path),
    extension: extname(path),
    language,
    sizeBytes: stat?.size ?? 0,
    modifiedAt: stat?.mtime.toISOString() ?? null,
    lastSeenHash: hashFile(absolutePath),
    lastMappedAt: null,
    mappingStatus: isLikelyTextFile(path) ? "unmapped" : "skipped",
    summary: null,
    purpose: null,
    keySymbols: [],
    relationships: [],
    tags,
    error: null,
  }
}

function enrichFileMap(rootPath: string, file: FileMapObject, allPaths: Set<string>, mappedAt: string): FileMapObject {
  if (!isLikelyTextFile(file.path)) {
    return {
      ...file,
      mappingStatus: "skipped",
      lastMappedAt: null,
      summary: "Binary or unsupported file type",
      purpose: "Excluded from content mapping",
      keySymbols: [],
      relationships: [],
      error: null,
    }
  }

  const absolutePath = joinFromRoot(rootPath, file.path)
  try {
    const content = readFileSync(absolutePath, "utf8")
    const description = summarizeFile(file.path, file.language, file.tags, content)
    return {
      ...file,
      lastMappedAt: mappedAt,
      mappingStatus: "mapped",
      summary: description.summary,
      purpose: description.purpose,
      keySymbols: description.keySymbols,
      relationships: extractRelationships(file.path, content, allPaths),
      error: null,
    }
  } catch (error) {
    return {
      ...file,
      lastMappedAt: mappedAt,
      mappingStatus: "error",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function buildProjectMap(
  rootPath: string,
  directories: Record<string, DirectoryNode>,
  files: Record<string, FileMapObject>,
  createdAt: string,
  updatedAt: string,
): ProjectMap {
  const artifactPaths = getProjectMapArtifactPaths()
  const languages: Record<string, number> = {}
  const tags = new Set<string>()
  let mappedFileCount = 0
  let staleFileCount = 0
  let unmappedFileCount = 0
  let lastContentRefreshAt: string | null = null

  for (const file of Object.values(files)) {
    languages[file.language] = (languages[file.language] ?? 0) + 1
    for (const tag of file.tags) tags.add(tag)
    if (file.mappingStatus === "mapped") mappedFileCount++
    if (file.mappingStatus === "stale") staleFileCount++
    if (file.mappingStatus === "unmapped") unmappedFileCount++
    if (file.lastMappedAt && (!lastContentRefreshAt || file.lastMappedAt > lastContentRefreshAt)) {
      lastContentRefreshAt = file.lastMappedAt
    }
  }

  const freshnessStatus: ProjectMap["freshness"]["status"] =
    staleFileCount > 0 ? "stale" : unmappedFileCount > 0 ? "partial" : "fresh"

  return {
    schemaVersion: 1,
    mapId: createHash("sha256").update(`${rootPath}:${updatedAt}`).digest("hex").slice(0, 12),
    rootPath,
    createdAt,
    updatedAt,
    directories,
    fileIndexPath: artifactPaths.projectFilesPath,
    fileCount: Object.keys(files).length,
    directoryCount: Object.keys(directories).length,
    languages,
    tags: [...tags].sort(),
    freshness: {
      status: freshnessStatus,
      lastStructuralRefreshAt: updatedAt,
      lastContentRefreshAt,
      staleFileCount,
      unmappedFileCount,
      mappedFileCount,
    },
  }
}

function safeStat(path: string): ReturnType<typeof statSync> | null {
  try {
    if (!existsSync(path)) return null
    return statSync(path)
  } catch {
    return null
  }
}

function hashFile(path: string): string | null {
  try {
    const content = readFileSync(path)
    return createHash("sha256").update(content).digest("hex").slice(0, 16)
  } catch {
    return null
  }
}

function shouldIncludeDirectory(parentRelativePath: string, childName: string): boolean {
  const normalized = parentRelativePath === "." ? childName : `${parentRelativePath}/${childName}`
  return !SKIP_DIRECTORIES.has(normalized) && !SKIP_DIRECTORIES.has(childName)
}

function normalizeTargetPaths(rootPath: string, targetPaths: string[], allPaths: Set<string>): string[] {
  return dedupe(targetPaths
    .map((targetPath) => {
      const normalizedTarget = targetPath.startsWith(rootPath) ? targetPath : join(rootPath, targetPath)
      return normalizeRelativePath(rootPath, normalizedTarget)
    })
    .flatMap((targetPath) => {
      if (allPaths.has(targetPath)) return [targetPath]
      return [...allPaths].filter((path) => path === targetPath || path.startsWith(`${targetPath}/`))
    }))
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)].sort()
}
