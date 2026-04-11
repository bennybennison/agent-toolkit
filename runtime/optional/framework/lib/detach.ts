/**
 * Detach Workflow — removes framework artifacts from a project.
 *
 * Phases:
 *   1. Analyze: load manifest, classify artifacts, detect modifications
 *   2. Preview: format a human-readable removal plan
 *   3. Execute: remove runtime/adapter artifacts, optionally export durable docs
 */
import { existsSync, mkdirSync, copyFileSync, unlinkSync, rmSync, readdirSync, lstatSync } from "node:fs"
import { join, dirname, relative } from "node:path"
import {
  loadManifest,
  classifyForDetach,
  getManifestPath,
  type DetachClassification,
  type ArtifactEntry,
  type DirectoryEntry,
} from "./manifest"
import { removeFrameworkIgnoreBlock } from "./gitignore"

// ── Types ──

export type DetachAnalysis = {
  projectDir: string
  profile: string
  classification: DetachClassification
  attachedAt: string
}

export type DetachOptions = {
  keepDocs: boolean
  exportTo: string
}

export type DetachResult = {
  removedFiles: number
  removedDirs: number
  exportedDocs: number
}

// ── Phase 1: Analyze ──

export function analyzeForDetach(projectDir: string): DetachAnalysis | null {
  const manifest = loadManifest(projectDir)
  if (!manifest) return null

  return {
    projectDir,
    profile: manifest.profile,
    classification: classifyForDetach(projectDir, manifest),
    attachedAt: manifest.attachedAt,
  }
}

// ── Phase 2: Preview ──

export function formatDetachPreview(analysis: DetachAnalysis): string {
  const { classification: c, profile, attachedAt } = analysis
  const lines: string[] = []

  lines.push("Agent Toolkit Runtime — Detach Preview")
  lines.push("================================")
  lines.push(`Profile: ${profile === "minimal" ? "light" : profile}`)
  lines.push(`Attached: ${attachedAt}`)
  lines.push("")

  if (c.removeRuntime.length > 0) {
    lines.push(`WILL REMOVE (runtime): ${c.removeRuntime.length} artifacts`)
    for (const a of c.removeRuntime.slice(0, 10)) {
      lines.push(`  - ${a.path}`)
    }
    if (c.removeRuntime.length > 10) {
      lines.push(`  ... and ${c.removeRuntime.length - 10} more`)
    }
    lines.push("")
  }

  if (c.removeAdapterUnmodified.length > 0) {
    lines.push(`WILL REMOVE (adapter, unmodified): ${c.removeAdapterUnmodified.length} artifacts`)
    for (const a of c.removeAdapterUnmodified.slice(0, 10)) {
      lines.push(`  - ${a.path}`)
    }
    if (c.removeAdapterUnmodified.length > 10) {
      lines.push(`  ... and ${c.removeAdapterUnmodified.length - 10} more`)
    }
    lines.push("")
  }

  if (c.reviewAdapterModified.length > 0) {
    lines.push(`MODIFIED — WILL REMOVE (adapter, user-modified): ${c.reviewAdapterModified.length} artifacts`)
    for (const a of c.reviewAdapterModified) {
      lines.push(`  ⚠ ${a.path}`)
    }
    lines.push("")
  }

  const allDurable = [...c.durableTracked, ...c.durableUntracked.map((p) => ({ path: p }))]
  if (allDurable.length > 0) {
    lines.push(`DURABLE DOCS (will export if --keep-docs): ${allDurable.length} documents`)
    for (const d of allDurable) {
      lines.push(`  → ${d.path}`)
    }
    lines.push("")
  }

  // Directories
  const runtimeDirs = c.directories.filter((d) => d.type === "runtime")
  const adapterDirs = c.directories.filter((d) => d.type === "adapter")
  if (runtimeDirs.length + adapterDirs.length > 0) {
    lines.push(`DIRECTORIES: ${runtimeDirs.length} runtime, ${adapterDirs.length} adapter`)
    lines.push("")
  }

  lines.push("GITIGNORE: Will remove framework block from .gitignore")

  return lines.join("\n")
}

// ── Phase 3: Execute ──

export function executeDetach(
  projectDir: string,
  analysis: DetachAnalysis,
  options: DetachOptions,
): DetachResult {
  const { classification: c } = analysis
  let removedFiles = 0
  let removedDirs = 0
  let exportedDocs = 0

  // 1. Export durable docs if requested
  if (options.keepDocs) {
    const allDurablePaths = [
      ...c.durableTracked.map((a) => a.path),
      ...c.durableUntracked,
    ]
    for (const relPath of allDurablePaths) {
      const srcFull = join(projectDir, relPath)
      if (!existsSync(srcFull)) continue

      // Map .agent/plans/X → docs/X (strip .agent/plans prefix)
      let exportRelPath = relPath
      if (exportRelPath.startsWith(".agent/plans/")) {
        exportRelPath = exportRelPath.slice(".agent/plans/".length)
      }
      const destFull = join(projectDir, options.exportTo, exportRelPath)
      mkdirSync(dirname(destFull), { recursive: true })
      copyFileSync(srcFull, destFull)
      exportedDocs++
    }
  }

  // 2. Remove runtime artifacts (files)
  for (const a of c.removeRuntime) {
    removeArtifactFile(projectDir, a)
    removedFiles++
  }

  // 3. Remove unmodified adapter artifacts (files + symlinks)
  for (const a of c.removeAdapterUnmodified) {
    removeArtifactFile(projectDir, a)
    removedFiles++
  }

  // 4. Remove modified adapter artifacts
  for (const a of c.reviewAdapterModified) {
    removeArtifactFile(projectDir, a)
    removedFiles++
  }

  // 5. Remove durable tracked artifacts (templates that weren't exported or were already exported)
  for (const a of c.durableTracked) {
    removeArtifactFile(projectDir, a)
    removedFiles++
  }

  // 6. Remove .gitignore block
  removeFrameworkIgnoreBlock(projectDir)

  // 7. Clean up directories (deepest first to avoid non-empty errors)
  const sortedDirs = [...c.directories].sort((a, b) => b.path.length - a.path.length)
  for (const d of sortedDirs) {
    const fullPath = join(projectDir, d.path)
    if (existsSync(fullPath) && isDirectoryEmpty(fullPath)) {
      try {
        rmSync(fullPath, { recursive: true })
        removedDirs++
      } catch {
        // Skip if can't remove (e.g., has untracked user content)
      }
    }
  }

  // 8. Remove the manifest itself before cleaning parent dirs
  const manifestPath = getManifestPath(projectDir)
  if (existsSync(manifestPath)) {
    unlinkSync(manifestPath)
    removedFiles++
  }

  // 9. Final cleanup: remove .agent/ and .opencode/ if empty
  for (const topDir of [".agent", ".opencode"]) {
    const fullPath = join(projectDir, topDir)
    if (existsSync(fullPath) && isDirectoryEmpty(fullPath)) {
      rmSync(fullPath, { recursive: true })
      removedDirs++
    }
  }

  return { removedFiles, removedDirs, exportedDocs }
}

// ── Helpers ──

function removeArtifactFile(projectDir: string, artifact: ArtifactEntry): void {
  const fullPath = join(projectDir, artifact.path)
  if (!existsSync(fullPath) && !lstatSync(fullPath, { throwIfNoEntry: false })?.isSymbolicLink()) {
    return
  }
  try {
    unlinkSync(fullPath)
  } catch {
    // File may already be gone or be a directory
  }
}

function isDirectoryEmpty(dirPath: string): boolean {
  try {
    const entries = readdirSync(dirPath)
    if (entries.length === 0) return true
    // Check recursively — a directory with only empty subdirs is "empty"
    for (const entry of entries) {
      const full = join(dirPath, entry)
      const stat = lstatSync(full, { throwIfNoEntry: false })
      if (!stat) continue
      if (stat.isDirectory()) {
        if (!isDirectoryEmpty(full)) return false
      } else {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}
