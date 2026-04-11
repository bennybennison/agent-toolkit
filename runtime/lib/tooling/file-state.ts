import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export function computeToolkitFileHash(filePath: string): string {
  const content = readFileSync(filePath)
  return "sha256:" + createHash("sha256").update(content).digest("hex")
}

export function collectGeneratedFileHashes(rootDir: string, generatedPaths: string[]): Record<string, string> {
  const hashes: Record<string, string> = {}
  for (const relPath of generatedPaths) {
    const fullPath = join(rootDir, relPath)
    if (!existsSync(fullPath)) continue
    hashes[relPath] = computeToolkitFileHash(fullPath)
  }
  return hashes
}

export function isToolkitFileUnmodified(rootDir: string, relPath: string, expectedHash?: string): boolean {
  if (!expectedHash) return false
  const fullPath = join(rootDir, relPath)
  if (!existsSync(fullPath)) return true
  try {
    return computeToolkitFileHash(fullPath) === expectedHash
  } catch {
    return false
  }
}
