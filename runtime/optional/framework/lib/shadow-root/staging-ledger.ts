import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"

import { appendDecisionRecord, upsertStagingRecord } from "../ledger/adapter"

function hashFile(filePath: string): string | null {
  if (!existsSync(filePath)) return null
  const content = readFileSync(filePath)
  return createHash("sha256").update(content).digest("hex")
}

export function recordShadowStage(input: {
  missionId: string
  originalPath: string
  shadowPath: string
  rationale?: string | null
}): { ok: boolean; reason?: string } {
  const baselineHash = hashFile(input.originalPath)
  const stagedHash = hashFile(input.shadowPath)

  const record = upsertStagingRecord({
    missionId: input.missionId,
    originalPath: input.originalPath,
    shadowPath: input.shadowPath,
    baselineHash,
    stagedHash,
    rationale: input.rationale ?? null,
  })

  appendDecisionRecord("shadow.stage", {
    missionId: input.missionId,
    originalPath: input.originalPath,
    shadowPath: input.shadowPath,
    baselineHash,
    stagedHash,
    ok: record.ok,
  })

  return record
}
