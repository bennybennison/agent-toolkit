import { execSync } from "node:child_process"

export type DiffEntry = {
  file: string
  status: "added" | "modified" | "deleted" | "renamed" | "unknown"
  additions: number
  deletions: number
  binary: boolean
}

export type DiffSummary = {
  changedFiles: DiffEntry[]
  totalAdditions: number
  totalDeletions: number
  totalFiles: number
  isBinary: boolean
}

/**
 * Atomic worker: summarize git diff of staged or unstaged changes.
 * Used by Builder to populate BuildProposal.diffSummary and by Auditor scope analysis.
 */
export function summarizeStagedDiff(cwd: string = process.cwd()): DiffSummary {
  return summarizeDiff(["git", "diff", "--cached", "--numstat"], cwd)
}

export function summarizeUnstagedDiff(cwd: string = process.cwd()): DiffSummary {
  return summarizeDiff(["git", "diff", "--numstat"], cwd)
}

export function summarizeDiffForFiles(files: string[], cwd: string = process.cwd()): DiffSummary {
  try {
    const statusOutput = execSync(`git diff --name-status HEAD -- ${files.map((f) => `"${f}"`).join(" ")}`, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    const statOutput = execSync(`git diff --numstat HEAD -- ${files.map((f) => `"${f}"`).join(" ")}`, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return parseNumstat(statOutput, statusOutput)
  } catch {
    return emptyDiffSummary()
  }
}

function summarizeDiff(args: string[], cwd: string): DiffSummary {
  try {
    const numstatOutput = execSync(args.join(" "), {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    const statusOutput = execSync(`git diff --cached --name-status`, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return parseNumstat(numstatOutput, statusOutput)
  } catch {
    return emptyDiffSummary()
  }
}

function parseNumstat(numstatOutput: string, statusOutput: string): DiffSummary {
  const statusMap: Record<string, string> = {}
  for (const line of statusOutput.trim().split("\n")) {
    if (!line.trim()) continue
    const parts = line.trim().split(/\s+/)
    if (parts.length >= 2) {
      statusMap[parts[1]] = parts[0]
    }
  }

  const changedFiles: DiffEntry[] = []
  let totalAdditions = 0
  let totalDeletions = 0
  let isBinary = false

  for (const line of numstatOutput.trim().split("\n")) {
    if (!line.trim()) continue
    const parts = line.trim().split("\t")
    if (parts.length < 3) continue
    const [addStr, delStr, file] = parts
    const binary = addStr === "-" || delStr === "-"
    if (binary) isBinary = true

    const additions = binary ? 0 : parseInt(addStr, 10) || 0
    const deletions = binary ? 0 : parseInt(delStr, 10) || 0
    totalAdditions += additions
    totalDeletions += deletions

    const rawStatus = statusMap[file] ?? "M"
    const status = resolveStatus(rawStatus)
    changedFiles.push({ file, status, additions, deletions, binary })
  }

  return {
    changedFiles,
    totalAdditions,
    totalDeletions,
    totalFiles: changedFiles.length,
    isBinary,
  }
}

function resolveStatus(raw: string): DiffEntry["status"] {
  const s = raw.charAt(0).toUpperCase()
  if (s === "A") return "added"
  if (s === "M") return "modified"
  if (s === "D") return "deleted"
  if (s === "R") return "renamed"
  return "unknown"
}

function emptyDiffSummary(): DiffSummary {
  return { changedFiles: [], totalAdditions: 0, totalDeletions: 0, totalFiles: 0, isBinary: false }
}
