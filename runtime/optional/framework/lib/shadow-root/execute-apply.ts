import { applyMissionStaging, previewMissionApply } from "./apply-manager"
import { saveSessionStateFile } from "../session-state-store"

export type ApplyReporter = {
  log: (line: string) => void
  error: (line: string) => void
}

export function runMissionApply(
  missionId: string,
  apply: boolean,
  reporter: ApplyReporter,
): number {
  const preview = previewMissionApply(missionId)
  if (!preview.ok) {
    reporter.error(`Preview failed: ${preview.reason ?? "unknown error"}`)
    return 1
  }

  if (preview.previews.length === 0) {
    reporter.log(`No staged files found for mission: ${missionId}`)
    return 0
  }

  const conflicts = preview.previews.filter((item) => item.conflict)

  reporter.log(`Mission: ${missionId}`)
  reporter.log(`Staged files: ${preview.previews.length}`)
  if (conflicts.length > 0) reporter.log(`Conflicts: ${conflicts.length}`)

  for (const item of preview.previews) {
    reporter.log(``)
    reporter.log(`- ${item.originalPath}`)
    reporter.log(`  conflict: ${item.conflict ? "yes" : "no"}`)
    if (item.rationale) reporter.log(`  rationale: ${item.rationale}`)
    if (item.diff) {
      reporter.log("  diff:")
      for (const line of item.diff.split("\n")) {
        reporter.log(`    ${line}`)
      }
    }
  }

  if (!apply) {
    reporter.log("")
    reporter.log("Dry run complete. Re-run with --yes to apply.")
    return 0
  }

  const result = applyMissionStaging(missionId)
  if (!result.ok) {
    reporter.error(`Apply failed: ${result.reason ?? "unknown error"}`)
    if (result.conflicts.length > 0) {
      reporter.error("Conflicted files:")
      for (const path of result.conflicts) {
        reporter.error(`- ${path}`)
      }
    }
    return 2
  }

  reporter.log("")
  reporter.log(`Applied ${result.applied.length} file(s).`)
  for (const path of result.applied) {
    reporter.log(`- ${path}`)
  }

  saveSessionStateFile({
    shadowMode: "inactive",
    activeMissionId: null,
  })
  reporter.log("Shadow mission cleared from session state.")
  return 0
}
