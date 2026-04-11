import { copyFileSync, existsSync, readFileSync, rmSync } from "node:fs"
import { createHash } from "node:crypto"

import {
  appendDecisionRecord,
  markStagingRecordApplied,
  queryStagingRecordsByMission,
} from "../ledger/adapter"
import { buildShadowDiff } from "./diff-manager"

type ApplyPreview = {
  recordId: number
  originalPath: string
  shadowPath: string
  conflict: boolean
  diff: string
  rationale: string
}

function hashFile(filePath: string): string | null {
  if (!existsSync(filePath)) return null
  return createHash("sha256").update(readFileSync(filePath)).digest("hex")
}

export function previewMissionApply(missionId: string): {
  ok: boolean
  previews: ApplyPreview[]
  reason?: string
} {
  const records = queryStagingRecordsByMission(missionId)
  if (!records.ok) return { ok: false, previews: [], reason: records.reason }

  const previews = records.rows
    .filter((row) => row.status === "staged")
    .map((row) => {
      const currentPhysicalHash = hashFile(row.original_path)
      const baselineHash = row.baseline_hash || null
      const conflict = baselineHash !== null && currentPhysicalHash !== baselineHash
      const diff = buildShadowDiff(row.original_path, row.shadow_path)
      return {
        recordId: row.id,
        originalPath: row.original_path,
        shadowPath: row.shadow_path,
        conflict,
        diff: diff.diff,
        rationale: row.rationale,
      }
    })

  return { ok: true, previews }
}

export function applyMissionStaging(missionId: string): {
  ok: boolean
  applied: string[]
  conflicts: string[]
  reason?: string
} {
  const preview = previewMissionApply(missionId)
  if (!preview.ok) return { ok: false, applied: [], conflicts: [], reason: preview.reason }

  const conflicts = preview.previews.filter((item) => item.conflict).map((item) => item.originalPath)
  if (conflicts.length > 0) {
    appendDecisionRecord("shadow.apply.conflict", { missionId, conflicts })
    return { ok: false, applied: [], conflicts, reason: "Conflicts detected; resolve before apply" }
  }

  const applied: string[] = []
  for (const item of preview.previews) {
    copyFileSync(item.shadowPath, item.originalPath)
    rmSync(item.shadowPath, { force: true })
    markStagingRecordApplied(item.recordId)
    applied.push(item.originalPath)
  }

  appendDecisionRecord("shadow.apply.complete", {
    missionId,
    applied,
    conflicts: [],
  })

  return { ok: true, applied, conflicts: [] }
}
