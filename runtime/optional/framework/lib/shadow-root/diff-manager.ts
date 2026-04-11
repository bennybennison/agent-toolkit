import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"

export function buildShadowDiff(physicalPath: string, shadowPath: string): {
  ok: boolean
  hasDiff: boolean
  diff: string
  reason?: string
} {
  if (!existsSync(physicalPath) || !existsSync(shadowPath)) {
    return {
      ok: false,
      hasDiff: false,
      diff: "",
      reason: "Physical or shadow path does not exist",
    }
  }

  const result = spawnSync("git", ["diff", "--no-index", "--no-color", "--", physicalPath, shadowPath], {
    encoding: "utf8",
  })

  // git diff --no-index returns 1 when differences are found.
  if (result.status === 0) {
    return { ok: true, hasDiff: false, diff: "" }
  }
  if (result.status === 1) {
    return { ok: true, hasDiff: true, diff: result.stdout ?? "" }
  }

  return {
    ok: false,
    hasDiff: false,
    diff: result.stdout ?? "",
    reason: result.stderr || "Failed to generate diff",
  }
}
