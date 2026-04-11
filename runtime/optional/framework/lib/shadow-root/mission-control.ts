import { mkdirSync } from "node:fs"
import { resolve } from "node:path"

import { getShadowRootPath } from "../framework-config"
import { queryStagingRecordsByMission } from "../ledger/adapter"
import { loadSessionStateFile, saveSessionStateFile } from "../session-state-store"

export function startShadowMission(missionId: string): { ok: boolean; reason?: string; missionId?: string } {
  const trimmed = missionId.trim()
  if (!trimmed) return { ok: false, reason: "Mission id is required" }

  const stagingRoot = resolve(process.cwd(), getShadowRootPath(), trimmed)
  mkdirSync(stagingRoot, { recursive: true })

  saveSessionStateFile({
    shadowMode: "staging",
    activeMissionId: trimmed,
  })

  return { ok: true, missionId: trimmed }
}

export function stopShadowMission(): { ok: boolean; previousMissionId: string | null } {
  const previous = loadSessionStateFile().activeMissionId
  saveSessionStateFile({
    shadowMode: "inactive",
    activeMissionId: null,
  })
  return { ok: true, previousMissionId: previous }
}

export function getShadowMissionStatus(missionIdOverride?: string): {
  ok: boolean
  active: boolean
  missionId: string | null
  stagedCount: number
  reason?: string
} {
  const state = loadSessionStateFile()
  const missionId = missionIdOverride ?? state.activeMissionId
  if (!missionId) {
    return { ok: true, active: false, missionId: null, stagedCount: 0 }
  }

  const rows = queryStagingRecordsByMission(missionId)
  if (!rows.ok) {
    return {
      ok: false,
      active: state.shadowMode === "staging",
      missionId,
      stagedCount: 0,
      reason: rows.reason,
    }
  }

  const stagedCount = rows.rows.filter((row) => row.status === "staged").length
  return {
    ok: true,
    active: state.shadowMode === "staging" && state.activeMissionId === missionId,
    missionId,
    stagedCount,
  }
}
