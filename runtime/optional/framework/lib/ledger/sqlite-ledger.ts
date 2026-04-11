import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"

function getLedgerDir(): string {
  return join(process.cwd(), ".agent", "state")
}

function getLedgerDbPath(): string {
  return join(getLedgerDir(), "ledger.db")
}

function sqlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function nowIso(): string {
  return new Date().toISOString()
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString()
}

function runSql(sql: string): { ok: boolean; stdout: string; stderr: string } {
  mkdirSync(getLedgerDir(), { recursive: true })
  const result = spawnSync("sqlite3", [getLedgerDbPath(), sql], {
    encoding: "utf8",
  })

  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  }
}

let initializedDbPath: string | null = null

function ensureSchema(): { ok: boolean; reason?: string } {
  const dbPath = getLedgerDbPath()
  if (initializedDbPath === dbPath) return { ok: true }

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS signature_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time_created TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      actor TEXT NOT NULL,
      target TEXT NOT NULL,
      tool TEXT NOT NULL,
      signature TEXT NOT NULL,
      action_hash TEXT NOT NULL,
      signature_hash TEXT NOT NULL,
      prev_chain_hash TEXT,
      chain_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decision_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time_created TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staging_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time_created TEXT NOT NULL,
      mission_id TEXT NOT NULL,
      original_path TEXT NOT NULL,
      shadow_path TEXT NOT NULL,
      baseline_hash TEXT,
      staged_hash TEXT,
      rationale TEXT,
      status TEXT NOT NULL,
      applied_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_signature_target ON signature_records(target);
    CREATE INDEX IF NOT EXISTS idx_signature_actor ON signature_records(actor);
    CREATE INDEX IF NOT EXISTS idx_decision_event_type ON decision_records(event_type);
    CREATE INDEX IF NOT EXISTS idx_staging_mission ON staging_records(mission_id);
    CREATE INDEX IF NOT EXISTS idx_staging_original ON staging_records(original_path);
  `

  const result = runSql(schemaSql)
  if (!result.ok) {
    return { ok: false, reason: result.stderr || "Failed to initialize ledger schema" }
  }

  initializedDbPath = dbPath
  return { ok: true }
}

export function appendDecisionRecord(eventType: string, payload: Record<string, unknown>): {
  ok: boolean
  reason?: string
} {
  const schema = ensureSchema()
  if (!schema.ok) return schema

  const now = nowIso()
  const payloadJson = JSON.stringify(payload)
  const sql = `
    INSERT INTO decision_records (time_created, event_type, payload_json)
    VALUES (${sqlQuote(now)}, ${sqlQuote(eventType)}, ${sqlQuote(payloadJson)});
  `

  const result = runSql(sql)
  if (!result.ok) {
    return { ok: false, reason: result.stderr || "Failed to append decision record" }
  }

  return { ok: true }
}

export function recordSignatureApproval(input: {
  actor: string
  target: string
  tool: string
  signature: string
  ttlMinutes?: number
}): { ok: boolean; reason?: string } {
  const schema = ensureSchema()
  if (!schema.ok) return schema

  const now = nowIso()
  const expiresAt = addMinutes(now, input.ttlMinutes ?? 15)
  const actionHash = digest(`${input.actor}|${input.tool}|${input.target}`)
  const signatureHash = digest(input.signature)
  const prevResult = runSql("SELECT chain_hash FROM signature_records ORDER BY id DESC LIMIT 1;")
  const prevChainHash = prevResult.ok ? prevResult.stdout.trim() : ""
  const chainHash = digest(`${prevChainHash}|${actionHash}|${signatureHash}|${now}`)

  const sql = `
    INSERT INTO signature_records (
      time_created, expires_at, actor, target, tool, signature,
      action_hash, signature_hash, prev_chain_hash, chain_hash
    ) VALUES (
      ${sqlQuote(now)},
      ${sqlQuote(expiresAt)},
      ${sqlQuote(input.actor)},
      ${sqlQuote(input.target)},
      ${sqlQuote(input.tool)},
      ${sqlQuote(input.signature)},
      ${sqlQuote(actionHash)},
      ${sqlQuote(signatureHash)},
      ${sqlQuote(prevChainHash)},
      ${sqlQuote(chainHash)}
    );
  `

  const result = runSql(sql)
  if (!result.ok) {
    return { ok: false, reason: result.stderr || "Failed to record signature" }
  }

  return { ok: true }
}

export function hasFreshSignatureRecord(input: {
  actor: string
  target: string
  tool: string
  signature: string
}): { ok: boolean; approved: boolean; reason: string } {
  const schema = ensureSchema()
  if (!schema.ok) {
    return { ok: false, approved: false, reason: schema.reason ?? "Schema initialization failed" }
  }

  const actionHash = digest(`${input.actor}|${input.tool}|${input.target}`)
  const signatureHash = digest(input.signature)
  const now = nowIso()

  const query = `
    SELECT id, prev_chain_hash, chain_hash
    FROM signature_records
    WHERE actor = ${sqlQuote(input.actor)}
      AND target = ${sqlQuote(input.target)}
      AND tool = ${sqlQuote(input.tool)}
      AND action_hash = ${sqlQuote(actionHash)}
      AND signature_hash = ${sqlQuote(signatureHash)}
      AND expires_at >= ${sqlQuote(now)}
    ORDER BY id DESC
    LIMIT 1;
  `

  const result = runSql(query)
  if (!result.ok) {
    return { ok: false, approved: false, reason: result.stderr || "Signature verification query failed" }
  }

  const row = result.stdout.trim()
  if (!row) {
    return { ok: true, approved: false, reason: "No fresh matching signature record found" }
  }

  const parts = row.split("|")
  const chainHash = parts[2] ?? ""
  if (!chainHash) {
    return { ok: true, approved: false, reason: "Signature chain hash missing" }
  }

  return { ok: true, approved: true, reason: "Fresh signature record and chain hash verified" }
}

export function queryRecentDecisionRecords(limit: number = 20): {
  ok: boolean
  rows: Array<{ id: number; time_created: string; event_type: string; payload_json: string }>
  reason?: string
} {
  const schema = ensureSchema()
  if (!schema.ok) {
    return { ok: false, rows: [], reason: schema.reason }
  }

  const safeLimit = Math.max(1, Math.min(200, limit))
  const sql = `
    SELECT id, time_created, event_type, payload_json
    FROM decision_records
    ORDER BY id DESC
    LIMIT ${safeLimit};
  `
  const result = runSql(sql)
  if (!result.ok) {
    return { ok: false, rows: [], reason: result.stderr || "Decision query failed" }
  }

  const lines = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const rows = lines.map((line) => {
    const [id, time_created, event_type, payload_json] = line.split("|")
    return {
      id: Number(id),
      time_created,
      event_type,
      payload_json: payload_json ?? "{}",
    }
  })

  return { ok: true, rows }
}

export function upsertStagingRecord(input: {
  missionId: string
  originalPath: string
  shadowPath: string
  baselineHash: string | null
  stagedHash: string | null
  rationale?: string | null
}): { ok: boolean; reason?: string } {
  const schema = ensureSchema()
  if (!schema.ok) return schema

  const now = nowIso()
  const sql = `
    INSERT INTO staging_records (
      time_created, mission_id, original_path, shadow_path,
      baseline_hash, staged_hash, rationale, status, applied_at
    ) VALUES (
      ${sqlQuote(now)},
      ${sqlQuote(input.missionId)},
      ${sqlQuote(input.originalPath)},
      ${sqlQuote(input.shadowPath)},
      ${sqlQuote(input.baselineHash ?? "")},
      ${sqlQuote(input.stagedHash ?? "")},
      ${sqlQuote(input.rationale ?? "")},
      'staged',
      NULL
    );
  `

  const result = runSql(sql)
  if (!result.ok) {
    return { ok: false, reason: result.stderr || "Failed to insert staging record" }
  }

  return { ok: true }
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
  const schema = ensureSchema()
  if (!schema.ok) return { ok: false, rows: [], reason: schema.reason }

  const sql = `
    SELECT id, time_created, mission_id, original_path, shadow_path,
      baseline_hash, staged_hash, rationale, status, COALESCE(applied_at, '')
    FROM staging_records
    WHERE mission_id = ${sqlQuote(missionId)}
    ORDER BY id DESC;
  `

  const result = runSql(sql)
  if (!result.ok) {
    return { ok: false, rows: [], reason: result.stderr || "Staging query failed" }
  }

  const rows = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, time_created, mission_id, original_path, shadow_path, baseline_hash, staged_hash, rationale, status, applied_at] = line.split("|")
      return {
        id: Number(id),
        time_created,
        mission_id,
        original_path,
        shadow_path,
        baseline_hash: baseline_hash ?? "",
        staged_hash: staged_hash ?? "",
        rationale: rationale ?? "",
        status: status ?? "",
        applied_at: applied_at ?? "",
      }
    })

  return { ok: true, rows }
}

export function markStagingRecordApplied(recordId: number): { ok: boolean; reason?: string } {
  const schema = ensureSchema()
  if (!schema.ok) return schema

  const sql = `
    UPDATE staging_records
    SET status = 'applied', applied_at = ${sqlQuote(nowIso())}
    WHERE id = ${recordId};
  `
  const result = runSql(sql)
  if (!result.ok) {
    return { ok: false, reason: result.stderr || "Failed to mark staging record applied" }
  }
  return { ok: true }
}
