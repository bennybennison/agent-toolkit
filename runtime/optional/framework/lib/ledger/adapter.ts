import { getModularityConfig } from "../framework-config"
import {
  appendDecisionRecord as appendDecisionRecordSqlite,
  hasFreshSignatureRecord as hasFreshSignatureRecordSqlite,
  markStagingRecordApplied as markStagingRecordAppliedSqlite,
  queryRecentDecisionRecords as queryRecentDecisionRecordsSqlite,
  queryStagingRecordsByMission as queryStagingRecordsByMissionSqlite,
  recordSignatureApproval as recordSignatureApprovalSqlite,
  upsertStagingRecord as upsertStagingRecordSqlite,
} from "./sqlite-ledger"
import {
  appendDecisionRecordMemory,
  hasFreshSignatureRecordMemory,
  markStagingRecordAppliedMemory,
  queryRecentDecisionRecordsMemory,
  queryStagingRecordsByMissionMemory,
  recordSignatureApprovalMemory,
  resetInMemoryLedgerForTests,
  upsertStagingRecordMemory,
} from "./in-memory-ledger"

function useMemoryLedger(): boolean {
  if ((process?.env?.AGENT_FRAMEWORK_LEDGER_ADAPTER ?? "").toLowerCase() === "memory") {
    return true
  }

  try {
    const flags = getModularityConfig().module_flags
    return flags["ledger.adapter.in-memory"] === true
  } catch {
    return false
  }
}

export function appendDecisionRecord(eventType: string, payload: Record<string, unknown>): {
  ok: boolean
  reason?: string
} {
  if (useMemoryLedger()) return appendDecisionRecordMemory(eventType, payload)
  return appendDecisionRecordSqlite(eventType, payload)
}

export function recordSignatureApproval(input: {
  actor: string
  target: string
  tool: string
  signature: string
  ttlMinutes?: number
}): { ok: boolean; reason?: string } {
  if (useMemoryLedger()) return recordSignatureApprovalMemory(input)
  return recordSignatureApprovalSqlite(input)
}

export function hasFreshSignatureRecord(input: {
  actor: string
  target: string
  tool: string
  signature: string
}): { ok: boolean; approved: boolean; reason: string } {
  if (useMemoryLedger()) return hasFreshSignatureRecordMemory(input)
  return hasFreshSignatureRecordSqlite(input)
}

export function queryRecentDecisionRecords(limit: number = 20): {
  ok: boolean
  rows: Array<{ id: number; time_created: string; event_type: string; payload_json: string }>
  reason?: string
} {
  if (useMemoryLedger()) return queryRecentDecisionRecordsMemory(limit)
  return queryRecentDecisionRecordsSqlite(limit)
}

export function resetLedgerForTests(): void {
  resetInMemoryLedgerForTests()
}

export function upsertStagingRecord(input: {
  missionId: string
  originalPath: string
  shadowPath: string
  baselineHash: string | null
  stagedHash: string | null
  rationale?: string | null
}): { ok: boolean; reason?: string } {
  if (useMemoryLedger()) return upsertStagingRecordMemory(input)
  return upsertStagingRecordSqlite(input)
}

export function queryStagingRecordsByMission(missionId: string): {
  ok: boolean
  rows: Array<{
    id: number
    time_created: string
    mission_id: string
    original_path: string
    shadow_path: string
    baseline_hash: string
    staged_hash: string
    rationale: string
    status: string
    applied_at: string
  }>
  reason?: string
} {
  if (useMemoryLedger()) return queryStagingRecordsByMissionMemory(missionId)
  return queryStagingRecordsByMissionSqlite(missionId)
}

export function markStagingRecordApplied(recordId: number): { ok: boolean; reason?: string } {
  if (useMemoryLedger()) return markStagingRecordAppliedMemory(recordId)
  return markStagingRecordAppliedSqlite(recordId)
}
