import { createHash } from "node:crypto"

type SignatureRow = {
  id: number
  time_created: string
  expires_at: string
  actor: string
  target: string
  tool: string
  signature: string
  action_hash: string
  signature_hash: string
  prev_chain_hash: string
  chain_hash: string
}

type DecisionRow = {
  id: number
  time_created: string
  event_type: string
  payload_json: string
}

type StagingRow = {
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
}

const signatures: SignatureRow[] = []
const decisions: DecisionRow[] = []
const staging: StagingRow[] = []
let nextSignatureId = 1
let nextDecisionId = 1
let nextStagingId = 1

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function nowIso(): string {
  return new Date().toISOString()
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString()
}

export function resetInMemoryLedgerForTests(): void {
  signatures.length = 0
  decisions.length = 0
  staging.length = 0
  nextSignatureId = 1
  nextDecisionId = 1
  nextStagingId = 1
}

export function appendDecisionRecordMemory(eventType: string, payload: Record<string, unknown>): {
  ok: boolean
  reason?: string
} {
  decisions.push({
    id: nextDecisionId++,
    time_created: nowIso(),
    event_type: eventType,
    payload_json: JSON.stringify(payload),
  })
  return { ok: true }
}

export function recordSignatureApprovalMemory(input: {
  actor: string
  target: string
  tool: string
  signature: string
  ttlMinutes?: number
}): { ok: boolean; reason?: string } {
  const now = nowIso()
  const expiresAt = addMinutes(now, input.ttlMinutes ?? 15)
  const actionHash = digest(`${input.actor}|${input.tool}|${input.target}`)
  const signatureHash = digest(input.signature)
  const prev = signatures[signatures.length - 1]
  const prevChainHash = prev?.chain_hash ?? ""
  const chainHash = digest(`${prevChainHash}|${actionHash}|${signatureHash}|${now}`)

  signatures.push({
    id: nextSignatureId++,
    time_created: now,
    expires_at: expiresAt,
    actor: input.actor,
    target: input.target,
    tool: input.tool,
    signature: input.signature,
    action_hash: actionHash,
    signature_hash: signatureHash,
    prev_chain_hash: prevChainHash,
    chain_hash: chainHash,
  })

  return { ok: true }
}

export function hasFreshSignatureRecordMemory(input: {
  actor: string
  target: string
  tool: string
  signature: string
}): { ok: boolean; approved: boolean; reason: string } {
  const now = nowIso()
  const actionHash = digest(`${input.actor}|${input.tool}|${input.target}`)
  const signatureHash = digest(input.signature)

  const row = [...signatures]
    .reverse()
    .find((item) => {
      return (
        item.actor === input.actor &&
        item.target === input.target &&
        item.tool === input.tool &&
        item.action_hash === actionHash &&
        item.signature_hash === signatureHash &&
        item.expires_at >= now &&
        !!item.chain_hash
      )
    })

  if (!row) {
    return { ok: true, approved: false, reason: "No fresh matching signature record found" }
  }

  return { ok: true, approved: true, reason: "Fresh signature record and chain hash verified" }
}

export function queryRecentDecisionRecordsMemory(limit: number = 20): {
  ok: boolean
  rows: Array<{ id: number; time_created: string; event_type: string; payload_json: string }>
  reason?: string
} {
  const safeLimit = Math.max(1, Math.min(200, limit))
  const rows = [...decisions].reverse().slice(0, safeLimit)
  return { ok: true, rows }
}

export function upsertStagingRecordMemory(input: {
  missionId: string
  originalPath: string
  shadowPath: string
  baselineHash: string | null
  stagedHash: string | null
  rationale?: string | null
}): { ok: boolean; reason?: string } {
  staging.push({
    id: nextStagingId++,
    time_created: nowIso(),
    mission_id: input.missionId,
    original_path: input.originalPath,
    shadow_path: input.shadowPath,
    baseline_hash: input.baselineHash ?? "",
    staged_hash: input.stagedHash ?? "",
    rationale: input.rationale ?? "",
    status: "staged",
    applied_at: "",
  })
  return { ok: true }
}

export function queryStagingRecordsByMissionMemory(missionId: string): {
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
  return {
    ok: true,
    rows: staging.filter((row) => row.mission_id === missionId).slice().reverse(),
  }
}

export function markStagingRecordAppliedMemory(recordId: number): { ok: boolean; reason?: string } {
  const item = staging.find((row) => row.id === recordId)
  if (!item) return { ok: false, reason: "Staging record not found" }
  item.status = "applied"
  item.applied_at = nowIso()
  return { ok: true }
}
