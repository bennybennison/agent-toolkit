import { execSync } from "node:child_process"

export type BranchIsolationResult = {
  ok: boolean
  branch: string | null
  created: boolean
  switched: boolean
  previousBranch: string | null
  reason?: string
}

function sanitizeSegment(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
}

function branchExists(branch: string): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branch}`, {
      cwd: process.cwd(),
      stdio: ["ignore", "ignore", "ignore"],
    })
    return true
  } catch {
    return false
  }
}

/**
 * Ensure autonomous mission work runs on an isolated git branch.
 */
export function ensureBranchIsolationForMission(missionId: string, prefix: "mission" | "loop" = "mission"): BranchIsolationResult {
  const suffix = sanitizeSegment(missionId)
  if (!suffix) {
    return {
      ok: false,
      branch: null,
      created: false,
      switched: false,
      previousBranch: null,
      reason: "Mission id is required for branch isolation",
    }
  }

  const branch = `${prefix}/${suffix}`

  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: process.cwd(),
      stdio: ["ignore", "ignore", "ignore"],
    })
  } catch {
    return {
      ok: false,
      branch,
      created: false,
      switched: false,
      previousBranch: null,
      reason: "Not a git repository; branch isolation skipped",
    }
  }

  const previousBranch = execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()

  if (previousBranch === branch) {
    return {
      ok: true,
      branch,
      created: false,
      switched: false,
      previousBranch,
    }
  }

  const exists = branchExists(branch)

  if (exists) {
    execSync(`git checkout ${branch}`, {
      cwd: process.cwd(),
      stdio: ["ignore", "ignore", "pipe"],
    })
    return {
      ok: true,
      branch,
      created: false,
      switched: true,
      previousBranch,
    }
  }

  execSync(`git checkout -b ${branch}`, {
    cwd: process.cwd(),
    stdio: ["ignore", "ignore", "pipe"],
  })

  return {
    ok: true,
    branch,
    created: true,
    switched: true,
    previousBranch,
  }
}