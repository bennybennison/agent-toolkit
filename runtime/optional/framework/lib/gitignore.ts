/**
 * Gitignore Block Manager
 *
 * Manages a sentinel-delimited block in the project's .gitignore for framework entries.
 * The block can be surgically added and removed without touching other .gitignore content.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const BLOCK_START = "# >>> agent-framework (managed — do not edit this block)"
const BLOCK_END = "# <<< agent-framework"

const FRAMEWORK_IGNORE_LINES = [
  ".agent/state/",
  ".agent/framework-manifest.json",
]

export function getIgnoreLines(): string[] {
  return [...FRAMEWORK_IGNORE_LINES]
}

/**
 * Add the framework ignore block to the project's .gitignore.
 * Returns the lines that were added, or null if block already exists.
 */
export function addFrameworkIgnoreBlock(projectDir: string): string[] | null {
  const gitignorePath = join(projectDir, ".gitignore")
  let content = ""

  if (existsSync(gitignorePath)) {
    content = readFileSync(gitignorePath, "utf8")
    if (content.includes(BLOCK_START)) {
      return null // already present
    }
  }

  const block = [
    "",
    BLOCK_START,
    ...FRAMEWORK_IGNORE_LINES,
    BLOCK_END,
    "",
  ].join("\n")

  // Ensure trailing newline before our block
  if (content.length > 0 && !content.endsWith("\n")) {
    content += "\n"
  }

  content += block
  writeFileSync(gitignorePath, content, "utf8")
  return FRAMEWORK_IGNORE_LINES
}

/**
 * Remove the framework ignore block from .gitignore.
 * Returns true if the block was found and removed.
 */
export function removeFrameworkIgnoreBlock(projectDir: string): boolean {
  const gitignorePath = join(projectDir, ".gitignore")
  if (!existsSync(gitignorePath)) return false

  const content = readFileSync(gitignorePath, "utf8")
  if (!content.includes(BLOCK_START)) return false

  // Remove the block including surrounding blank lines
  const lines = content.split("\n")
  const startIdx = lines.findIndex((l) => l.trim() === BLOCK_START)
  const endIdx = lines.findIndex((l, i) => i >= startIdx && l.trim() === BLOCK_END)

  if (startIdx === -1 || endIdx === -1) return false

  // Also trim one blank line before and after the block if present
  let removeStart = startIdx
  let removeEnd = endIdx + 1
  if (removeStart > 0 && lines[removeStart - 1].trim() === "") removeStart--
  if (removeEnd < lines.length && lines[removeEnd].trim() === "") removeEnd++

  lines.splice(removeStart, removeEnd - removeStart)

  const result = lines.join("\n")
  // Clean up any trailing multiple blank lines at end of file
  const cleaned = result.replace(/\n{3,}$/g, "\n")
  writeFileSync(gitignorePath, cleaned, "utf8")
  return true
}

/**
 * Check whether the framework ignore block is present in .gitignore.
 */
export function hasFrameworkIgnoreBlock(projectDir: string): boolean {
  const gitignorePath = join(projectDir, ".gitignore")
  if (!existsSync(gitignorePath)) return false
  const content = readFileSync(gitignorePath, "utf8")
  return content.includes(BLOCK_START)
}
