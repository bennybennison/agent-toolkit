/**
 * Framework Manifest — tracks all artifacts owned by the framework in a target project.
 *
 * The manifest enables clean detach by recording every file, symlink, and directory
 * the framework creates during attach, along with artifact classification and hashes
 * for change detection.
 */
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync, lstatSync, readdirSync } from "node:fs"
import { dirname, join, relative } from "node:path"

// ── Types ──

export type ArtifactType = "runtime" | "adapter" | "durable"
export type ArtifactKind = "file" | "symlink" | "directory"
export type ArtifactMethod = "copy" | "symlink" | "generated" | "created" | "modified"

export type ArtifactEntry = {
  path: string
  type: ArtifactType
  kind: ArtifactKind
  method: ArtifactMethod
  /** SHA-256 hash of file content at creation time (files only) */
  hash?: string
  /** Symlink target (symlinks only) */
  target?: string
  /** Whether this is a framework-seeded template vs user content */
  template?: boolean
  /** Lines added to an existing file (for .gitignore block management) */
  addedLines?: string[]
}

export type DirectoryEntry = {
  path: string
  type: ArtifactType | "mixed"
}

export type FrameworkManifest = {
  version: number
  profile: string
  frameworkPath: string
  attachedAt: string
  updatedAt: string
  artifacts: ArtifactEntry[]
  directories: DirectoryEntry[]
}

// ── Constants ──

const MANIFEST_VERSION = 1

export function getManifestPath(projectDir: string): string {
  return join(projectDir, ".agent", "framework-manifest.json")
}

// ── Hash ──

export function computeFileHash(filePath: string): string {
  const content = readFileSync(filePath)
  return "sha256:" + createHash("sha256").update(content).digest("hex")
}

// ── CRUD ──

export function createManifest(projectDir: string, profile: string, frameworkPath: string): FrameworkManifest {
  const now = new Date().toISOString()
  const manifest: FrameworkManifest = {
    version: MANIFEST_VERSION,
    profile,
    frameworkPath,
    attachedAt: now,
    updatedAt: now,
    artifacts: [],
    directories: [],
  }
  saveManifest(projectDir, manifest)
  return manifest
}

export function loadManifest(projectDir: string): FrameworkManifest | null {
  const manifestPath = getManifestPath(projectDir)
  if (!existsSync(manifestPath)) return null
  try {
    const raw = readFileSync(manifestPath, "utf8")
    const parsed = JSON.parse(raw) as FrameworkManifest
    if (parsed.version !== MANIFEST_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function saveManifest(projectDir: string, manifest: FrameworkManifest): void {
  const manifestPath = getManifestPath(projectDir)
  mkdirSync(dirname(manifestPath), { recursive: true })
  manifest.updatedAt = new Date().toISOString()
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8")
}

// ── Recording ──

export function recordArtifact(manifest: FrameworkManifest, entry: ArtifactEntry): void {
  const existing = manifest.artifacts.findIndex((a) => a.path === entry.path)
  if (existing >= 0) {
    manifest.artifacts[existing] = entry
  } else {
    manifest.artifacts.push(entry)
  }
}

export function recordDirectory(manifest: FrameworkManifest, entry: DirectoryEntry): void {
  const existing = manifest.directories.findIndex((d) => d.path === entry.path)
  if (existing >= 0) {
    manifest.directories[existing] = entry
  } else {
    manifest.directories.push(entry)
  }
}

// ── Query ──

export function getArtifactsByType(manifest: FrameworkManifest, type: ArtifactType): ArtifactEntry[] {
  return manifest.artifacts.filter((a) => a.type === type)
}

/**
 * Check whether an adapter file has been modified since the framework created it.
 * Returns true if the file still matches its original hash.
 */
export function isUnmodifiedAdapter(projectDir: string, entry: ArtifactEntry): boolean {
  if (!entry.hash) return true // no hash recorded → can't verify, treat as unmodified
  const fullPath = join(projectDir, entry.path)
  if (!existsSync(fullPath)) return true // already gone
  try {
    const currentHash = computeFileHash(fullPath)
    return currentHash === entry.hash
  } catch {
    return false // can't read → treat as modified
  }
}

// ── Classification helpers ──

/**
 * Scan .agent/plans/ for files NOT tracked in the manifest.
 * These are user-created durable docs that should be offered for retention.
 */
export function findUntrackedDurableDocs(projectDir: string, manifest: FrameworkManifest): string[] {
  const plansDir = join(projectDir, ".agent", "plans")
  if (!existsSync(plansDir)) return []

  const trackedPaths = new Set(manifest.artifacts.map((a) => a.path))
  const results: string[] = []

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      const relPath = relative(projectDir, fullPath)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (!trackedPaths.has(relPath)) {
        results.push(relPath)
      }
    }
  }

  walk(plansDir)
  return results
}

/**
 * Classify all artifacts for detach into action groups.
 */
export type DetachClassification = {
  removeRuntime: ArtifactEntry[]
  removeAdapterUnmodified: ArtifactEntry[]
  reviewAdapterModified: ArtifactEntry[]
  durableTracked: ArtifactEntry[]
  durableUntracked: string[]
  directories: DirectoryEntry[]
}

export function classifyForDetach(projectDir: string, manifest: FrameworkManifest): DetachClassification {
  const result: DetachClassification = {
    removeRuntime: [],
    removeAdapterUnmodified: [],
    reviewAdapterModified: [],
    durableTracked: [],
    durableUntracked: [],
    directories: manifest.directories,
  }

  for (const artifact of manifest.artifacts) {
    switch (artifact.type) {
      case "runtime":
        result.removeRuntime.push(artifact)
        break
      case "adapter":
        if (isUnmodifiedAdapter(projectDir, artifact)) {
          result.removeAdapterUnmodified.push(artifact)
        } else {
          result.reviewAdapterModified.push(artifact)
        }
        break
      case "durable":
        result.durableTracked.push(artifact)
        break
    }
  }

  result.durableUntracked = findUntrackedDurableDocs(projectDir, manifest)
  return result
}
